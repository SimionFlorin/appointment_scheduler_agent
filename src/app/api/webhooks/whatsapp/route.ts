import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWhatsAppMessage } from "@/lib/ai-agent";
import {
  claimMessageForProcessing,
  filterFreshMessages,
  logMetaWebhookDiagnostics,
  parseMetaWebhookPayload,
  type ParsedMetaMessage,
} from "@/lib/whatsapp/meta-provider";
import { parseTwilioWebhookPayload } from "@/lib/whatsapp/twilio-provider";

function truncate(s: string, max = 120): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

// Meta webhook verification (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Incoming messages (POST) -- handles both Meta and Twilio
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  console.log("[WA] POST /api/webhooks/whatsapp", {
    contentType,
    url: request.nextUrl.pathname,
  });

  try {
    // Detect provider by content type / payload shape
    if (contentType.includes("application/json")) {
      return await handleMetaWebhook(request);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      return await handleTwilioWebhook(request);
    }

    console.warn("[WA] Unknown content-type, returning 400", { contentType });
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (error) {
    console.error("[WA] Webhook processing error:", error);
    // Always return 200 to prevent retries from Meta/Twilio
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

async function handleMetaWebhook(request: NextRequest) {
  const body = await request.json();
  logMetaWebhookDiagnostics(body as Record<string, unknown>);

  // Always acknowledge quickly
  if (body.object !== "whatsapp_business_account") {
    console.log("[WA:meta] skip: object is not whatsapp_business_account", {
      object: body.object,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Log status updates (delivery receipts) — surface failures loudly.
  try {
    const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses;
    if (Array.isArray(statuses) && statuses.length > 0) {
      for (const s of statuses) {
        const failed = s.status === "failed";
        const log = failed ? console.error : console.log;
        log(failed ? "[WA:meta] MESSAGE FAILED" : "[WA:meta] STATUS UPDATE", {
          id: s.id,
          status: s.status,
          timestamp: s.timestamp,
          recipient_id: s.recipient_id,
          errorCode: s.errors?.[0]?.code,
          errorTitle: s.errors?.[0]?.title,
          errorDetails: s.errors?.[0]?.error_data?.details,
        });
      }
    }
  } catch (e) {
    console.warn("[WA:meta] could not log statuses", e);
  }

  const parsed = parseMetaWebhookPayload(body);
  if (!parsed) {
    console.warn(
      "[WA:meta] parseMetaWebhookPayload returned null — no text messages or missing phone_number_id (see [WA:meta] diagnostics above)"
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // BUG FIX #1 — Drop stale messages from Meta's retry backlog. Without this,
  // a message buffered for hours/days arrives long after the customer expects
  // any reply and the bot answers a "ghost" conversation.
  const freshMessages = filterFreshMessages(parsed.messages);
  if (freshMessages.length === 0) {
    console.log("[WA:meta] no fresh messages after age filter — acking");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log("[WA:meta] parsed inbound", {
    phoneNumberId: parsed.phoneNumberId,
    freshMessageCount: freshMessages.length,
    droppedCount: parsed.messages.length - freshMessages.length,
    previews: freshMessages.map((m) => ({
      from: m.from,
      id: m.id,
      body: truncate(m.body, 100),
    })),
  });

  // Find the user by their WhatsApp phone number ID
  const config = await prisma.whatsAppConfig.findFirst({
    where: {
      phoneNumberId: parsed.phoneNumberId,
      provider: "META",
      isActive: true,
    },
  });

  if (!config) {
    console.error(
      "[WA:meta] No WhatsAppConfig for phoneNumberId (DB mismatch?)",
      parsed.phoneNumberId
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log("[WA:meta] resolved user", {
    userId: config.userId,
    provider: config.provider,
  });

  // BUG FIX #2 — Group messages by customer phone so each customer's history
  // is read/written sequentially. Different customers still process in
  // parallel (separate after() blocks), but two messages from the SAME
  // customer cannot race each other and corrupt the conversation row.
  const byCustomer = new Map<string, ParsedMetaMessage[]>();
  for (const msg of freshMessages) {
    const list = byCustomer.get(msg.from) ?? [];
    list.push(msg);
    byCustomer.set(msg.from, list);
  }

  for (const [customerPhone, msgs] of byCustomer) {
    console.log("[WA:meta] scheduling customer batch", {
      customerPhone,
      messageCount: msgs.length,
      userId: config.userId,
    });

    // Process this customer's messages sequentially after we've returned 200.
    after(async () => {
      for (const msg of msgs) {
        // BUG FIX #3 — Idempotency. Atomically claim the message ID.
        // - "duplicate": another delivery already processed it → skip.
        // - "error":     DB couldn't track it (e.g. table missing) → process
        //                anyway (fail-open). Better one duplicate reply than
        //                a silent bot.
        const claim = await claimMessageForProcessing(msg.id);
        if (claim === "duplicate") {
          console.log("[WA:meta] skip duplicate message (already processed)", {
            id: msg.id,
            from: msg.from,
          });
          continue;
        }

        console.log("[WA:meta] after() processing message", {
          userId: config.userId,
          from: msg.from,
          id: msg.id,
          claim,
          body: truncate(msg.body, 100),
        });

        try {
          const reply = await processWhatsAppMessage(
            config.userId,
            msg.from,
            msg.body
          );
          console.log("[WA:meta] after() processWhatsAppMessage OK", {
            id: msg.id,
            replyLength: reply.length,
            replyPreview: truncate(reply, 160),
          });
        } catch (err) {
          console.error("[WA:meta] after() processWhatsAppMessage FAILED", {
            id: msg.id,
            err,
          });
        }
      }
    });
  }

  console.log("[WA:meta] returning 200 (work continues in after())");
  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleTwilioWebhook(request: NextRequest) {
  const formData = await request.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => {
    body[key] = value.toString();
  });

  console.log("[WA:twilio] form keys", Object.keys(body));

  const parsed = parseTwilioWebhookPayload(body);
  if (!parsed) {
    console.warn("[WA:twilio] parseTwilioWebhookPayload returned null");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log("[WA:twilio] parsed inbound", {
    to: parsed.to,
    from: parsed.from,
    body: truncate(parsed.body, 100),
  });

  // Find the user by their Twilio WhatsApp number
  const config = await prisma.whatsAppConfig.findFirst({
    where: {
      twilioPhoneNumber: parsed.to,
      provider: "TWILIO",
      isActive: true,
    },
  });

  if (!config) {
    console.error("[WA:twilio] No WhatsAppConfig for number:", parsed.to);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log("[WA:twilio] resolved user", { userId: config.userId });
  after(async () => {
    console.log("[WA:twilio] after() running processWhatsAppMessage");
    try {
      const reply = await processWhatsAppMessage(
        config.userId,
        parsed.from,
        parsed.body
      );
      console.log("[WA:twilio] after() OK", {
        replyLength: reply.length,
        replyPreview: truncate(reply, 160),
      });
    } catch (err) {
      console.error("[WA:twilio] after() FAILED", err);
    }
  });

  // Twilio expects TwiML or empty 200
  return new Response("<Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

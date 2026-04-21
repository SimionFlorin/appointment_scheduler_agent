import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWhatsAppMessage } from "@/lib/ai-agent";
import {
  logMetaWebhookDiagnostics,
  parseMetaWebhookPayload,
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

  const parsed = parseMetaWebhookPayload(body);
  if (!parsed) {
    console.warn(
      "[WA:meta] parseMetaWebhookPayload returned null — no text messages or missing phone_number_id (see [WA:meta] diagnostics above)"
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log("[WA:meta] parsed inbound", {
    phoneNumberId: parsed.phoneNumberId,
    messageCount: parsed.messages.length,
    previews: parsed.messages.map((m) => ({
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

  // Process each message after response — survives Vercel serverless return
  for (const msg of parsed.messages) {
    console.log("[WA:meta] scheduling processWhatsAppMessage", {
      userId: config.userId,
      from: msg.from,
      body: truncate(msg.body, 100),
    });
    after(async () => {
      console.log("[WA:meta] after() running processWhatsAppMessage", {
        userId: config.userId,
        from: msg.from,
      });
      try {
        const reply = await processWhatsAppMessage(
          config.userId,
          msg.from,
          msg.body
        );
        console.log("[WA:meta] after() processWhatsAppMessage OK", {
          replyLength: reply.length,
          replyPreview: truncate(reply, 160),
        });
      } catch (err) {
        console.error("[WA:meta] after() processWhatsAppMessage FAILED", err);
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

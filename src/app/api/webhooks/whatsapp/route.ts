import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWhatsAppMessage } from "@/lib/ai-agent";
import { parseMetaWebhookPayload } from "@/lib/whatsapp/meta-provider";
import { parseTwilioWebhookPayload } from "@/lib/whatsapp/twilio-provider";

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

  try {
    // Detect provider by content type / payload shape
    if (contentType.includes("application/json")) {
      return await handleMetaWebhook(request);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      return await handleTwilioWebhook(request);
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Always return 200 to prevent retries from Meta/Twilio
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

async function handleMetaWebhook(request: NextRequest) {
  const body = await request.json();

  // Always acknowledge quickly
  if (body.object !== "whatsapp_business_account") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const parsed = parseMetaWebhookPayload(body);
  if (!parsed) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Find the user by their WhatsApp phone number ID
  const config = await prisma.whatsAppConfig.findFirst({
    where: {
      phoneNumberId: parsed.phoneNumberId,
      provider: "META",
      isActive: true,
    },
  });

  if (!config) {
    console.error(`No config found for phone number ID: ${parsed.phoneNumberId}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Process each message (usually just one)
  for (const msg of parsed.messages) {
    // Fire and forget -- don't block the webhook response
    processWhatsAppMessage(config.userId, msg.from, msg.body).catch((err) =>
      console.error("Error processing message:", err)
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleTwilioWebhook(request: NextRequest) {
  const formData = await request.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => {
    body[key] = value.toString();
  });

  const parsed = parseTwilioWebhookPayload(body);
  if (!parsed) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Find the user by their Twilio WhatsApp number
  const config = await prisma.whatsAppConfig.findFirst({
    where: {
      twilioPhoneNumber: parsed.to,
      provider: "TWILIO",
      isActive: true,
    },
  });

  if (!config) {
    console.error(`No config found for Twilio number: ${parsed.to}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  processWhatsAppMessage(config.userId, parsed.from, parsed.body).catch((err) =>
    console.error("Error processing message:", err)
  );

  // Twilio expects TwiML or empty 200
  return new Response("<Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

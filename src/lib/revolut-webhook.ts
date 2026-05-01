import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { onOrderCompleted } from "@/lib/revolut-autopay";

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

function verifySignature(
  rawBody: string,
  timestamp: string | null,
  signatureHeader: string | null,
  signingSecret: string
): boolean {
  if (!timestamp || !signatureHeader) return false;

  const age = Math.abs(Date.now() - Number(timestamp));
  if (age > TIMESTAMP_TOLERANCE_MS) return false;

  const payloadToSign = `v1.${timestamp}.${rawBody}`;
  const expected =
    "v1=" +
    createHmac("sha256", signingSecret).update(payloadToSign).digest("hex");

  const signatures = signatureHeader.split(",").map((s) => s.trim());

  return signatures.some((sig) => {
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

interface WebhookOptions {
  signingSecret: string | undefined;
  sandbox: boolean;
}

export async function handleRevolutWebhook(
  req: Request,
  { signingSecret, sandbox }: WebhookOptions
) {
  const rawBody = await req.text();
  const source = sandbox ? "revolut-sandbox" : "revolut-live";

  if (signingSecret) {
    const timestamp = req.headers.get("Revolut-Request-Timestamp");
    const signature = req.headers.get("Revolut-Signature");

    if (!verifySignature(rawBody, timestamp, signature, signingSecret)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  }

  const rawPayload = JSON.parse(rawBody) as Record<string, unknown>;
  const event =
    typeof rawPayload.event === "string" ? rawPayload.event : "unknown";
  const order_id =
    typeof rawPayload.order_id === "string"
      ? rawPayload.order_id
      : undefined;

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[revolut-webhook/${source}] incoming payload:`,
      JSON.stringify(rawPayload, null, 2)
    );
  }

  await prisma.webhookEvent.create({
    data: {
      source,
      event,
      orderId: order_id ?? null,
      payload: rawPayload as Prisma.InputJsonValue,
    },
  });

  const payment = order_id
    ? await prisma.payment.findUnique({
        where: { revolutOrderId: order_id },
      })
    : null;

  switch (event) {
    case "ORDER_COMPLETED": {
      if (payment && order_id) {
        await prisma.payment.update({
          where: { revolutOrderId: order_id },
          data: { status: "COMPLETED" },
        });
        await onOrderCompleted({
          userId: payment.userId,
          revolutOrderId: order_id,
          sandbox,
        });
      }
      break;
    }

    case "ORDER_AUTHORISED": {
      if (payment && payment.status === "PENDING" && order_id) {
        await prisma.payment.update({
          where: { revolutOrderId: order_id },
          data: { status: "AUTHORISED" },
        });
      }
      break;
    }

    case "ORDER_PAYMENT_FAILED":
    case "ORDER_PAYMENT_DECLINED": {
      if (payment && order_id) {
        await prisma.payment.update({
          where: { revolutOrderId: order_id },
          data: { status: "FAILED" },
        });
      }
      break;
    }

    case "ORDER_CANCELLED": {
      if (payment && order_id) {
        await prisma.payment.update({
          where: { revolutOrderId: order_id },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

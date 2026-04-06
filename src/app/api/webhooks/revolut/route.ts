import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/revolut";
import { activateSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("revolut-signature") || "";
  const timestamp = req.headers.get("revolut-request-timestamp") || "";

  if (
    process.env.REVOLUT_WEBHOOK_SECRET &&
    process.env.REVOLUT_WEBHOOK_SECRET !== "your-revolut-webhook-signing-secret"
  ) {
    if (!verifyWebhookSignature(rawBody, signature, timestamp)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }
  }

  const payload = JSON.parse(rawBody);
  const { event, order_id } = payload;

  if (event === "ORDER_COMPLETED") {
    const payment = await prisma.payment.findUnique({
      where: { revolutOrderId: order_id },
    });

    if (payment) {
      await prisma.payment.update({
        where: { revolutOrderId: order_id },
        data: { status: "COMPLETED" },
      });

      await activateSubscription(payment.userId, order_id);
    }
  }

  if (event === "ORDER_PAYMENT_FAILED") {
    await prisma.payment.updateMany({
      where: { revolutOrderId: order_id },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}

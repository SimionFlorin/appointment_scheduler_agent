import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  const payload = await req.json();
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

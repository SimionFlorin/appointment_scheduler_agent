import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retrieveRevolutOrder } from "@/lib/revolut";
import { activateSubscription, getSubscriptionInfo } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latestPayment = await prisma.payment.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (latestPayment && latestPayment.status === "PENDING") {
    try {
      const order = await retrieveRevolutOrder(
        latestPayment.revolutOrderId,
        latestPayment.isSandbox
      );

      if (order.state === "COMPLETED") {
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: { status: "COMPLETED" },
        });
        await activateSubscription(
          session.user.id,
          latestPayment.revolutOrderId
        );
      } else if (order.state === "FAILED" || order.state === "CANCELLED") {
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: { status: "FAILED" },
        });
      }
    } catch {
      // Revolut API may be unreachable; fall through to return current state
    }
  }

  const info = await getSubscriptionInfo(session.user.id);
  return NextResponse.json({ subscription: info });
}

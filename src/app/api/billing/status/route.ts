import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isRevolutSecretConfigured,
  retrieveRevolutOrder,
  type RevolutOrderJson,
} from "@/lib/revolut";
import { onOrderCompleted } from "@/lib/revolut-autopay";
import { getSubscriptionInfo } from "@/lib/subscription";

function normalizeOrderState(order: RevolutOrderJson): string {
  const s = order.state;
  return typeof s === "string" ? s.toUpperCase() : "";
}

/**
 * Reads subscription state, and if the latest Payment is still PENDING
 * polls Revolut to finalize it (fallback for delayed/missed webhooks).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isDev = process.env.NODE_ENV === "development";

  const latestPayment = await prisma.payment.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (
    latestPayment &&
    latestPayment.status === "PENDING" &&
    isRevolutSecretConfigured(latestPayment.isSandbox)
  ) {
    try {
      const order = await retrieveRevolutOrder(
        latestPayment.revolutOrderId,
        latestPayment.isSandbox
      );
      const state = normalizeOrderState(order);

      if (state === "COMPLETED") {
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: { status: "COMPLETED" },
        });
        await onOrderCompleted({
          userId: session.user.id,
          revolutOrderId: latestPayment.revolutOrderId,
          sandbox: latestPayment.isSandbox,
          order,
        });
      } else if (state === "FAILED" || state === "CANCELLED") {
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: { status: "FAILED" },
        });
      }
    } catch (err) {
      if (isDev) {
        console.error(
          "[billing/status] Revolut retrieve failed:",
          err,
          `(payment isSandbox=${latestPayment.isSandbox}, orderId=${latestPayment.revolutOrderId})`
        );
      }
      // Fall through: return whatever state we have in the DB.
    }
  }

  const info = await getSubscriptionInfo(session.user.id);
  return NextResponse.json({ subscription: info });
}

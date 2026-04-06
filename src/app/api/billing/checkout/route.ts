import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRevolutOrder } from "@/lib/revolut";
import { getSubscriptionInfo } from "@/lib/subscription";

const PRICE_USD = 2000; // $20.00 in minor units (cents)
const PRICE_RON = 10000; // 100.00 RON in minor units (bani)

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const info = await getSubscriptionInfo(session.user.id);
  if (info.status === "active") {
    return NextResponse.json(
      { error: "You already have an active subscription" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const currency = body.currency === "RON" ? "RON" : "USD";
  const amount = currency === "RON" ? PRICE_RON : PRICE_USD;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  const origin =
    req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";

  const revolutOrder = await createRevolutOrder({
    amount,
    currency,
    description: "BookMe AI - Monthly Subscription",
    customerEmail: user?.email || undefined,
    redirectUrl: `${origin}/billing?status=success`,
  });

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      revolutOrderId: revolutOrder.id,
      amount,
      currency,
      status: "PENDING",
      checkoutUrl: revolutOrder.checkout_url,
    },
  });

  return NextResponse.json({ checkoutUrl: revolutOrder.checkout_url });
}

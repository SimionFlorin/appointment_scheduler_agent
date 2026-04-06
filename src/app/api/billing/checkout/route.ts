import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRevolutOrder, isSandboxCard } from "@/lib/revolut";
import { getSubscriptionInfo } from "@/lib/subscription";

const PRICE_USD = 2000; // $20.00 in cents
const PRICE_RON = 10000; // 100.00 RON in bani

const DISCOUNT_CODES: Record<string, { priceUSD: number; priceRON: number }> = {
  AQUATIQUE: { priceUSD: 300, priceRON: 1500 },
};

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
  const discountCode = (body.discountCode || "").trim().toUpperCase();
  const cardNumber = (body.cardNumber || "").replace(/\s/g, "");

  const sandbox = cardNumber ? isSandboxCard(cardNumber) : false;

  let amount = currency === "RON" ? PRICE_RON : PRICE_USD;
  let appliedDiscount: string | null = null;

  if (discountCode) {
    if (DISCOUNT_CODES[discountCode]) {
      amount =
        currency === "RON"
          ? DISCOUNT_CODES[discountCode].priceRON
          : DISCOUNT_CODES[discountCode].priceUSD;
      appliedDiscount = discountCode;
    } else {
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 400 }
      );
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  const origin =
    req.headers.get("origin") ||
    req.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
    "";

  const description = appliedDiscount
    ? `BookMe AI - Monthly Subscription (Discount: ${appliedDiscount})`
    : "BookMe AI - Monthly Subscription";

  const revolutOrder = await createRevolutOrder(
    {
      amount,
      currency,
      description,
      customerEmail: user?.email || undefined,
      redirectUrl: `${origin}/billing?status=success`,
    },
    sandbox
  );

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      revolutOrderId: revolutOrder.id,
      amount,
      currency,
      status: "PENDING",
      checkoutUrl: revolutOrder.checkout_url,
      isSandbox: sandbox,
      discountCode: appliedDiscount,
    },
  });

  return NextResponse.json({ checkoutUrl: revolutOrder.checkout_url });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createRevolutCustomer,
  createRevolutOrder,
  shouldUseRevolutSandbox,
} from "@/lib/revolut";
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

  const sandbox = shouldUseRevolutSandbox();

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
    select: { email: true, name: true, revolutCustomerId: true },
  });

  if (!user?.email) {
    return NextResponse.json(
      { error: "User email missing — cannot set up recurring billing" },
      { status: 400 }
    );
  }

  // Autopay requires a Revolut customer so we can save the payment method
  // against them and charge it from the cron with no user present.
  let revolutCustomerId = user.revolutCustomerId ?? null;
  if (!revolutCustomerId) {
    try {
      const customer = await createRevolutCustomer(
        { email: user.email, fullName: user.name || undefined },
        sandbox
      );
      revolutCustomerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { revolutCustomerId },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create Revolut customer";
      return NextResponse.json({ error: message }, { status: 422 });
    }
  }

  const description = appliedDiscount
    ? `BookMe AI - Monthly Subscription (Discount: ${appliedDiscount})`
    : "BookMe AI - Monthly Subscription";

  let revolutOrder;
  try {
    revolutOrder = await createRevolutOrder(
      {
        amount,
        currency,
        description,
        customerEmail: user.email,
        customerId: revolutCustomerId,
        savePaymentMethodFor: "merchant",
      },
      sandbox
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create Revolut order";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      revolutOrderId: revolutOrder.id,
      revolutCustomerId,
      amount,
      currency,
      status: "PENDING",
      isSandbox: sandbox,
      discountCode: appliedDiscount,
    },
  });

  return NextResponse.json({
    publicId: revolutOrder.public_id,
    isSandbox: sandbox,
  });
}

import { prisma } from "@/lib/prisma";
import {
  type RevolutOrderJson,
  type RevolutSavedPaymentMethod,
  createRevolutOrder,
  extractSavedMethodFromOrder,
  listRevolutPaymentMethods,
  payRevolutOrder,
  retrieveRevolutOrder,
} from "@/lib/revolut";
import { activateSubscription } from "@/lib/subscription";

function toInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Math.trunc(Number(v));
  }
  return null;
}

/**
 * After a customer-initiated order completes, persist the merchant-scope
 * payment method so the cron can charge it next month. Returns the DB row id,
 * or null if no merchant-scope method is available (cron will skip renewals
 * with `no_payment_method`).
 *
 * Resolution order:
 *  1. Order payload (passed in or retrieved) — includes payment_method inline.
 *  2. `/customers/{id}/payment-methods?only_merchant=true` as a fallback.
 *
 * We intentionally do NOT fall back to any-scope methods: a customer-scope
 * method cannot be charged merchant-initiated and would only cause
 * `error.payment-method-not-permitted-for-merchant` at renewal time.
 */
export async function savePaymentMethodFromOrder(args: {
  userId: string;
  revolutOrderId: string;
  revolutCustomerId: string;
  sandbox: boolean;
  /** When the caller already retrieved the order we reuse it. */
  order?: RevolutOrderJson | null;
}): Promise<string | null> {
  let method: RevolutSavedPaymentMethod | null = args.order
    ? extractSavedMethodFromOrder(args.order)
    : null;

  if (!method) {
    try {
      const fresh = await retrieveRevolutOrder(
        args.revolutOrderId,
        args.sandbox
      );
      method = extractSavedMethodFromOrder(fresh);
    } catch {
      // Ignore and try the listing endpoint.
    }
  }

  if (!method) {
    try {
      const merchantOnly = await listRevolutPaymentMethods(
        args.revolutCustomerId,
        { onlyMerchant: true, sandbox: args.sandbox }
      );
      method = merchantOnly[0] ?? null;
    } catch {
      // Nothing else to try.
    }
  }

  if (!method || typeof method.id !== "string" || typeof method.type !== "string") {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[autopay] no merchant-scope payment method for customer ${args.revolutCustomerId} ` +
          `after order ${args.revolutOrderId}. Make sure the widget is called with ` +
          `savePaymentMethodFor: "merchant".`
      );
    }
    return null;
  }

  const card = method.card ?? {};
  const saved = await prisma.revolutPaymentMethod.upsert({
    where: { revolutMethodId: method.id },
    update: {
      type: method.type,
      brand: typeof card.brand === "string" ? card.brand : null,
      last4: typeof card.last_four === "string" ? card.last_four : null,
      expMonth: toInt(card.expiry_month),
      expYear: toInt(card.expiry_year),
      isActive: true,
    },
    create: {
      userId: args.userId,
      revolutCustomerId: args.revolutCustomerId,
      revolutMethodId: method.id,
      type: method.type,
      brand: typeof card.brand === "string" ? card.brand : null,
      last4: typeof card.last_four === "string" ? card.last_four : null,
      expMonth: toInt(card.expiry_month),
      expYear: toInt(card.expiry_year),
      isActive: true,
    },
  });

  return saved.id;
}

/**
 * Called right after we mark an order COMPLETED (webhook or poll).
 *
 *  1. Saves the merchant-initiated payment method (if not already).
 *  2. Extends the subscription period + snapshots plan amount/currency.
 *  3. Points `nextChargeAt` to the new period end so the cron picks it up.
 */
export async function onOrderCompleted(args: {
  userId: string;
  revolutOrderId: string;
  sandbox: boolean;
  /** Optional — reused from caller to avoid an extra retrieve call. */
  order?: RevolutOrderJson | null;
}): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { revolutOrderId: args.revolutOrderId },
  });
  if (!payment) {
    await activateSubscription(args.userId, args.revolutOrderId);
    return;
  }

  let paymentMethodId: string | null = null;
  if (payment.revolutCustomerId) {
    paymentMethodId = await savePaymentMethodFromOrder({
      userId: args.userId,
      revolutOrderId: args.revolutOrderId,
      revolutCustomerId: payment.revolutCustomerId,
      sandbox: args.sandbox,
      order: args.order ?? null,
    });
  }

  await activateSubscription(args.userId, args.revolutOrderId, {
    paymentMethodId: paymentMethodId ?? undefined,
    planAmount: payment.amount,
    planCurrency: payment.currency,
  });
}

/**
 * Cron-driven monthly charge for a single subscription.
 *
 * Flow per Revolut docs:
 *  1. Create a new order with amount/currency + customer_id.
 *  2. POST /api/orders/{id}/payments with saved_payment_method + initiator=merchant.
 *  3. On COMPLETED → extend period + reset failures.
 *     On any other outcome → increment failedAttempts, schedule a retry or
 *     flip to PAST_DUE after too many failures.
 */
export async function chargeSubscriptionRenewal(subscriptionId: string): Promise<
  | { status: "charged" }
  | { status: "scheduled_retry"; attempts: number }
  | { status: "past_due"; attempts: number }
  | { status: "skipped"; reason: string }
> {
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { paymentMethod: true, user: true },
  });

  if (!sub) return { status: "skipped", reason: "subscription_not_found" };
  if (sub.status !== "ACTIVE")
    return { status: "skipped", reason: `status_${sub.status}` };
  if (!sub.paymentMethod || !sub.paymentMethod.isActive)
    return { status: "skipped", reason: "no_payment_method" };
  if (!sub.planAmount || !sub.planCurrency)
    return { status: "skipped", reason: "no_plan_snapshot" };
  if (!sub.user.revolutCustomerId)
    return { status: "skipped", reason: "no_revolut_customer" };

  // Sandbox flag follows whatever the saved method was created in — we have no
  // dedicated column for it so we infer from the latest sandbox payment row.
  const lastPayment = await prisma.payment.findFirst({
    where: { userId: sub.userId },
    orderBy: { createdAt: "desc" },
    select: { isSandbox: true },
  });
  const sandbox = lastPayment?.isSandbox ?? false;

  let order;
  try {
    order = await createRevolutOrder(
      {
        amount: sub.planAmount,
        currency: sub.planCurrency,
        description: "BookMe AI - Monthly Subscription (auto-renewal)",
        customerEmail: sub.user.email,
        customerId: sub.user.revolutCustomerId,
      },
      sandbox
    );
  } catch (err) {
    return recordFailure(subscriptionId, MAX_ATTEMPTS, RETRY_DELAY_MS, err);
  }

  await prisma.payment.create({
    data: {
      userId: sub.userId,
      revolutOrderId: order.id,
      revolutCustomerId: sub.user.revolutCustomerId,
      amount: sub.planAmount,
      currency: sub.planCurrency,
      status: "PENDING",
      isSandbox: sandbox,
    },
  });

  let payResult: RevolutOrderJson;
  try {
    payResult = await payRevolutOrder({
      orderId: order.id,
      sandbox,
      savedPaymentMethod: {
        id: sub.paymentMethod.revolutMethodId,
        type: sub.paymentMethod.type,
        initiator: "merchant",
      },
    });
  } catch (err) {
    await prisma.payment.update({
      where: { revolutOrderId: order.id },
      data: { status: "FAILED" },
    });
    return recordFailure(subscriptionId, MAX_ATTEMPTS, RETRY_DELAY_MS, err);
  }

  const state =
    typeof payResult.state === "string" ? payResult.state.toUpperCase() : "";

  if (state === "COMPLETED") {
    await prisma.payment.update({
      where: { revolutOrderId: order.id },
      data: { status: "COMPLETED" },
    });
    await onOrderCompleted({
      userId: sub.userId,
      revolutOrderId: order.id,
      sandbox,
      order: payResult,
    });
    return { status: "charged" };
  }

  // PENDING / AUTHORISED / anything else: leave Payment as PENDING and let the
  // webhook finalise. Push nextChargeAt forward a little so the cron doesn't
  // re-trigger this sub on the next run while we wait for confirmation.
  const waitUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { nextChargeAt: waitUntil },
  });
  return { status: "scheduled_retry", attempts: sub.failedAttempts };
}

async function recordFailure(
  subscriptionId: string,
  maxAttempts: number,
  retryDelayMs: number,
  err: unknown
): Promise<
  | { status: "scheduled_retry"; attempts: number }
  | { status: "past_due"; attempts: number }
> {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[autopay] charge failed for sub=${subscriptionId}:`,
      err instanceof Error ? err.message : err
    );
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { failedAttempts: { increment: 1 } },
    select: { failedAttempts: true },
  });

  if (updated.failedAttempts >= maxAttempts) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "PAST_DUE", nextChargeAt: null },
    });
    return { status: "past_due", attempts: updated.failedAttempts };
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { nextChargeAt: new Date(Date.now() + retryDelayMs) },
  });
  return { status: "scheduled_retry", attempts: updated.failedAttempts };
}

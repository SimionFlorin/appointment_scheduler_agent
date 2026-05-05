import { prisma } from "./prisma";

const TRIAL_DURATION_DAYS = 30;

export interface SubscriptionInfo {
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired" | "none";
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  daysLeft: number | null;
  isActive: boolean;
  /** True when the user paid during trial and the paid period hasn't started yet. */
  paidDuringTrial: boolean;
}

export async function ensureSubscription(userId: string): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (existing) return;

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

  await prisma.subscription.create({
    data: {
      userId,
      status: "TRIALING",
      trialEndsAt,
    },
  });
}

export async function getSubscriptionInfo(
  userId: string
): Promise<SubscriptionInfo> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!sub) {
    return {
      status: "none",
      trialEndsAt: null,
      currentPeriodEnd: null,
      daysLeft: null,
      isActive: false,
      paidDuringTrial: false,
    };
  }

  const now = new Date();

  if (sub.status === "TRIALING") {
    const isActive = now < sub.trialEndsAt;
    const daysLeft = Math.max(
      0,
      Math.ceil(
        (sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    return {
      status: isActive ? "trialing" : "expired",
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: null,
      daysLeft,
      isActive,
      paidDuringTrial: false,
    };
  }

  if (sub.status === "ACTIVE" && sub.currentPeriodEnd) {
    const isActive = now < sub.currentPeriodEnd;
    const daysLeft = Math.max(
      0,
      Math.ceil(
        (sub.currentPeriodEnd.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const paidDuringTrial =
      sub.currentPeriodStart !== null && now < sub.currentPeriodStart;

    return {
      status: isActive ? "active" : "expired",
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      daysLeft,
      isActive,
      paidDuringTrial,
    };
  }

  return {
    status: sub.status.toLowerCase() as SubscriptionInfo["status"],
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    daysLeft: null,
    isActive: sub.status === "ACTIVE",
    paidDuringTrial: false,
  };
}

export interface ActivateOptions {
  /** Link a saved payment method for future cron-based autopay. */
  paymentMethodId?: string;
  /** Snapshot of what we just charged; cron reuses this for the next renewal. */
  planAmount?: number;
  planCurrency?: string;
}

/**
 * Extend or start the paid subscription period.
 *
 * - TRIALING with trial still running → paid month begins at trialEndsAt.
 * - ACTIVE with future currentPeriodEnd (cron renewal) → new period starts
 *   at currentPeriodEnd, so users charged a day early don't lose time.
 * - Anything else (expired / cancelled / reactivation) → new period starts now.
 *
 * After success, `nextChargeAt = currentPeriodEnd` so the cron picks it up
 * exactly when the month runs out. `failedAttempts` is reset.
 */
export async function activateSubscription(
  userId: string,
  revolutOrderId: string,
  opts: ActivateOptions = {}
): Promise<void> {
  const now = new Date();

  const existing = await prisma.subscription.findUnique({ where: { userId } });

  let baseDate: Date;
  if (existing?.status === "TRIALING" && existing.trialEndsAt > now) {
    baseDate = existing.trialEndsAt;
  } else if (
    existing?.status === "ACTIVE" &&
    existing.currentPeriodEnd &&
    existing.currentPeriodEnd > now
  ) {
    baseDate = existing.currentPeriodEnd;
  } else {
    baseDate = now;
  }

  const periodStart = new Date(baseDate);
  const periodEnd = new Date(baseDate);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: "ACTIVE",
      revolutOrderId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelledAt: null,
      nextChargeAt: periodEnd,
      failedAttempts: 0,
      ...(opts.paymentMethodId
        ? { paymentMethodId: opts.paymentMethodId }
        : {}),
      ...(opts.planAmount !== undefined ? { planAmount: opts.planAmount } : {}),
      ...(opts.planCurrency ? { planCurrency: opts.planCurrency } : {}),
    },
    create: {
      userId,
      status: "ACTIVE",
      revolutOrderId,
      trialEndsAt: now,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      nextChargeAt: periodEnd,
      paymentMethodId: opts.paymentMethodId ?? null,
      planAmount: opts.planAmount ?? null,
      planCurrency: opts.planCurrency ?? null,
    },
  });
}

export async function cancelSubscription(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      nextChargeAt: null,
    },
  });
}

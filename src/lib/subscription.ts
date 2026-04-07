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

export async function activateSubscription(
  userId: string,
  revolutOrderId: string
): Promise<void> {
  const now = new Date();

  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  // If the user is still in an active trial, the paid month starts after the trial ends.
  const baseDate =
    existing?.status === "TRIALING" && existing.trialEndsAt > now
      ? existing.trialEndsAt
      : now;

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
    },
    create: {
      userId,
      status: "ACTIVE",
      revolutOrderId,
      trialEndsAt: now,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });
}

export async function cancelSubscription(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });
}

export function isSubscriptionActive(info: SubscriptionInfo): boolean {
  return info.isActive;
}

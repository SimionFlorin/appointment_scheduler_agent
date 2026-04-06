import { prisma } from "./prisma";

const TRIAL_DURATION_DAYS = 30;

export interface SubscriptionInfo {
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired" | "none";
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  daysLeft: number | null;
  isActive: boolean;
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

    return {
      status: isActive ? "active" : "expired",
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      daysLeft,
      isActive,
    };
  }

  return {
    status: sub.status.toLowerCase() as SubscriptionInfo["status"],
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    daysLeft: null,
    isActive: sub.status === "ACTIVE",
  };
}

export async function activateSubscription(
  userId: string,
  revolutOrderId: string
): Promise<void> {
  const now = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: "ACTIVE",
      revolutOrderId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelledAt: null,
    },
    create: {
      userId,
      status: "ACTIVE",
      revolutOrderId,
      trialEndsAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}

export function isSubscriptionActive(info: SubscriptionInfo): boolean {
  return info.isActive;
}

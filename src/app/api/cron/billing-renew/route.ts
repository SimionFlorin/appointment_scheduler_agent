import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeSubscriptionRenewal } from "@/lib/revolut-autopay";

// Vercel's scheduler invokes this endpoint with Authorization: Bearer $CRON_SECRET.
// We additionally accept the same value as a `?secret=` query param for
// local/manual runs. If CRON_SECRET is unset we refuse to run at all.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const q = req.nextUrl.searchParams.get("secret");
  if (q && q === secret) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      nextChargeAt: { lte: now },
      paymentMethodId: { not: null },
    },
    select: { id: true },
    take: 100, // keep each cron run bounded
  });

  const results: Array<{ subscriptionId: string; outcome: unknown }> = [];

  for (const { id } of due) {
    try {
      const outcome = await chargeSubscriptionRenewal(id);
      results.push({ subscriptionId: id, outcome });
    } catch (err) {
      results.push({
        subscriptionId: id,
        outcome: {
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return NextResponse.json({
    ranAt: now.toISOString(),
    processed: results.length,
    results,
  });
}

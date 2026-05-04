import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOutboundMessage } from "@/lib/scheduled-messages";

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 50;

// Vercel's scheduler invokes this endpoint with `Authorization: Bearer $CRON_SECRET`.
// We additionally accept the same value as a `?secret=` query param for manual /
// local runs. If `CRON_SECRET` is unset we refuse to run at all.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const q = req.nextUrl.searchParams.get("secret");
  if (q && q === secret) return true;

  return false;
}

async function runDispatcher() {
  const now = new Date();
  const due = await prisma.scheduledMessage.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: "asc" },
    take: BATCH_SIZE,
  });

  const results: Array<{
    id: string;
    outcome: "sent" | "failed" | "retry";
    error?: string;
  }> = [];

  for (const msg of due) {
    try {
      await sendOutboundMessage({
        userId: msg.userId,
        customerPhone: msg.customerPhone,
        body: msg.body,
      });
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          attempts: { increment: 1 },
          error: null,
        },
      });
      results.push({ id: msg.id, outcome: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const nextAttempts = msg.attempts + 1;
      const finalFailure = nextAttempts >= MAX_ATTEMPTS;
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: {
          status: finalFailure ? "FAILED" : "PENDING",
          attempts: { increment: 1 },
          error: message,
        },
      });
      results.push({
        id: msg.id,
        outcome: finalFailure ? "failed" : "retry",
        error: message,
      });
    }
  }

  return { ranAt: now.toISOString(), processed: results.length, results };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runDispatcher();
  return NextResponse.json(summary);
}

// Vercel cron historically issues GET; allow POST as well for symmetry with
// other cron handlers in this codebase.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runDispatcher();
  return NextResponse.json(summary);
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ScheduledMessageStatus } from "@prisma/client";

const VALID_STATUSES: ScheduledMessageStatus[] = [
  "PENDING",
  "SENT",
  "FAILED",
  "CANCELLED",
];

const MIN_LEAD_MS = 30 * 1000; // refuse to schedule less than 30s in the future

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const statusParam = searchParams.get("status");

  const where: {
    userId: string;
    customerPhone?: string;
    status?: ScheduledMessageStatus;
  } = { userId: session.user.id };
  if (phone) where.customerPhone = phone;
  if (statusParam && (VALID_STATUSES as string[]).includes(statusParam)) {
    where.status = statusParam as ScheduledMessageStatus;
  }

  const messages = await prisma.scheduledMessage.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const customerPhone =
    typeof body?.customerPhone === "string" ? body.customerPhone.trim() : "";
  const messageBody = typeof body?.body === "string" ? body.body : "";
  const scheduledForRaw =
    typeof body?.scheduledFor === "string" ? body.scheduledFor : "";

  if (!customerPhone) {
    return NextResponse.json(
      { error: "customerPhone is required" },
      { status: 400 }
    );
  }
  if (!messageBody.trim()) {
    return NextResponse.json(
      { error: "body is required" },
      { status: 400 }
    );
  }
  if (messageBody.length > 4096) {
    return NextResponse.json(
      { error: "Message is too long (max 4096 chars)" },
      { status: 400 }
    );
  }

  const scheduledFor = new Date(scheduledForRaw);
  if (Number.isNaN(scheduledFor.getTime())) {
    return NextResponse.json(
      { error: "scheduledFor must be a valid ISO 8601 datetime" },
      { status: 400 }
    );
  }
  if (scheduledFor.getTime() - Date.now() < MIN_LEAD_MS) {
    return NextResponse.json(
      {
        error:
          "scheduledFor must be at least 30 seconds in the future. Use the Send-now button to send immediately.",
      },
      { status: 400 }
    );
  }

  const created = await prisma.scheduledMessage.create({
    data: {
      userId: session.user.id,
      customerPhone,
      body: messageBody,
      scheduledFor,
      status: "PENDING",
    },
  });

  return NextResponse.json(created, { status: 201 });
}

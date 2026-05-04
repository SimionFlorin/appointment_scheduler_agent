import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOutboundMessage } from "@/lib/scheduled-messages";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.scheduledMessage.findUnique({
    where: { id },
  });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: `Cannot cancel a ${existing.status.toLowerCase()} message` },
      { status: 400 }
    );
  }

  const updated = await prisma.scheduledMessage.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  return NextResponse.json(updated);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  if (action !== "send-now") {
    return NextResponse.json(
      { error: "Unsupported action. Expected `send-now`." },
      { status: 400 }
    );
  }

  const existing = await prisma.scheduledMessage.findUnique({
    where: { id },
  });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: `Cannot send a ${existing.status.toLowerCase()} message` },
      { status: 400 }
    );
  }

  try {
    await sendOutboundMessage({
      userId: existing.userId,
      customerPhone: existing.customerPhone,
      body: existing.body,
    });
    const updated = await prisma.scheduledMessage.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        attempts: { increment: 1 },
        error: null,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    const updated = await prisma.scheduledMessage.update({
      where: { id },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        error: message,
      },
    });
    return NextResponse.json({ ...updated, error: message }, { status: 500 });
  }
}

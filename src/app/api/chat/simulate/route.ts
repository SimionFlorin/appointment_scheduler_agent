import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processWhatsAppMessage } from "@/lib/ai-agent";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, customerPhone } = await request.json();
  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const phone = customerPhone || "+0000000000";

  try {
    const response = await processWhatsAppMessage(
      session.user.id,
      phone,
      message,
      { simulate: true }
    );

    return NextResponse.json({ response });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to process message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const customerPhone = searchParams.get("customerPhone") || "+0000000000";

  if (all) {
    const { count } = await prisma.conversation.deleteMany({
      where: { userId: session.user.id, isTest: true },
    });
    return NextResponse.json({ success: true, deleted: count });
  }

  await prisma.conversation.deleteMany({
    where: {
      userId: session.user.id,
      customerPhone,
      isTest: true,
    },
  });

  return NextResponse.json({ success: true });
}

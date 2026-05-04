import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendManualMessage } from "@/lib/ai-agent";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerPhone, message } = await request.json();

  if (!customerPhone || !message) {
    return NextResponse.json(
      { error: "customerPhone and message are required" },
      { status: 400 }
    );
  }

  try {
    await sendManualMessage(session.user.id, customerPhone, message);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

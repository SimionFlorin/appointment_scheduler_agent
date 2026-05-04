import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendOutboundMessage } from "@/lib/scheduled-messages";

export async function POST(
  request: Request,
  context: { params: Promise<{ phone: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone: rawPhone } = await context.params;
  const phone = decodeURIComponent(rawPhone || "").trim();
  if (!phone) {
    return NextResponse.json(
      { error: "Customer phone is required" },
      { status: 400 }
    );
  }

  const { body } = await request.json();
  if (typeof body !== "string" || !body.trim()) {
    return NextResponse.json(
      { error: "Message body is required" },
      { status: 400 }
    );
  }
  if (body.length > 4096) {
    return NextResponse.json(
      { error: "Message is too long (max 4096 chars)" },
      { status: 400 }
    );
  }

  try {
    await sendOutboundMessage({
      userId: session.user.id,
      customerPhone: phone,
      body,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    console.error("[api:conversations:messages] send failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

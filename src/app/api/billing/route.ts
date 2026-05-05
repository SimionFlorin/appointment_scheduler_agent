import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSubscriptionInfo } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const info = await getSubscriptionInfo(session.user.id);
  return NextResponse.json({ subscription: info });
}

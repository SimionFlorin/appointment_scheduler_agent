import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cancelSubscription, getSubscriptionInfo } from "@/lib/subscription";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const info = await getSubscriptionInfo(session.user.id);
  if (info.status !== "active") {
    return NextResponse.json(
      { error: "No active subscription to cancel" },
      { status: 400 }
    );
  }

  await cancelSubscription(session.user.id);
  return NextResponse.json({ success: true });
}

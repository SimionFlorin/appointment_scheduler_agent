import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { timezone: true },
  });

  return NextResponse.json({
    timezone: profile?.timezone || "America/New_York",
  });
}

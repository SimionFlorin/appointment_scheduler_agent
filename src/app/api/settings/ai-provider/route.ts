import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { aiProvider: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ aiProvider: user.aiProvider });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { aiProvider } = body;

  if (!aiProvider || !["GEMINI", "OPENAI"].includes(aiProvider)) {
    return NextResponse.json({ error: "Invalid AI provider" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { aiProvider },
  });

  return NextResponse.json({ success: true });
}

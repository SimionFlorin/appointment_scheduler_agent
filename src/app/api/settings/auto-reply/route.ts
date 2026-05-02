import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { autoReplyEnabled: true },
  });

  return NextResponse.json({ autoReplyEnabled: user?.autoReplyEnabled ?? true });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { autoReplyEnabled } = await request.json();

  if (typeof autoReplyEnabled !== "boolean") {
    return NextResponse.json(
      { error: "autoReplyEnabled must be a boolean" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { autoReplyEnabled },
  });

  return NextResponse.json({ autoReplyEnabled });
}

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
    select: { aiAutoReplyEnabled: true },
  });

  return NextResponse.json({ enabled: user?.aiAutoReplyEnabled ?? true });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const enabled = body?.enabled;

  if (typeof enabled !== "boolean") {
    return NextResponse.json(
      { error: "`enabled` must be a boolean" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { aiAutoReplyEnabled: enabled },
  });

  return NextResponse.json({ enabled });
}

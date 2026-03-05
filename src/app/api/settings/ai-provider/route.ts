import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_PROVIDERS = ["GEMINI", "OPENAI"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { llmProvider: true },
  });

  return NextResponse.json({ provider: user?.llmProvider ?? "GEMINI" });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await request.json();

  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}` },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { llmProvider: provider },
  });

  return NextResponse.json({ provider });
}

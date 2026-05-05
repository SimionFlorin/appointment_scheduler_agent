import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonReply, maskSensitive } from "@/lib/api-log";

const area = "settings:ai-provider";
const VALID_PROVIDERS = ["GEMINI", "OPENAI"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonReply(area, { error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { llmProvider: true },
  });

  return jsonReply(area, { provider: user?.llmProvider ?? "GEMINI" });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonReply(area, { error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  console.log(`[${area}] PUT request body=`, maskSensitive(body));

  const { provider } = body;
  if (!VALID_PROVIDERS.includes(provider)) {
    return jsonReply(
      area,
      { error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}` },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { llmProvider: provider },
  });

  return jsonReply(area, { provider });
}

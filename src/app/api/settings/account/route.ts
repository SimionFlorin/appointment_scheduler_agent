import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonReply } from "@/lib/api-log";

const area = "settings:account";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonReply(area, { error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  return jsonReply(area, { success: true });
}

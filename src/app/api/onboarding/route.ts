import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultServices } from "@/lib/defaults";
import { Profession } from "@prisma/client";
import { jsonReply, maskSensitive } from "@/lib/api-log";

export async function POST(request: Request) {
  const area = "onboarding";
  const session = await auth();
  if (!session?.user?.id) {
    return jsonReply(area, { error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  console.log(`[${area}] POST request body=`, maskSensitive(body));

  const { profession, businessName, phone, address, timezone } = body;
  if (!profession || !businessName) {
    return jsonReply(area, { error: "Missing required fields" }, { status: 400 });
  }

  const userId = session.user.id!;
  const professionEnum = profession as Profession;

  await prisma.user.update({
    where: { id: userId },
    data: {
      profession: professionEnum,
      onboardingDone: true,
    },
  });

  await prisma.businessProfile.upsert({
    where: { userId },
    update: { businessName, phone, address, timezone },
    create: {
      userId,
      businessName,
      phone,
      address,
      timezone,
    },
  });

  const defaults = getDefaultServices(professionEnum);
  const existingServices = await prisma.service.count({
    where: { userId },
  });

  let seededServices = 0;
  if (existingServices === 0) {
    await prisma.service.createMany({
      data: defaults.map((s) => ({
        userId,
        name: s.name,
        description: s.description,
        price: s.price,
        duration: s.duration,
      })),
    });
    seededServices = defaults.length;
  }

  return jsonReply(area, { success: true, seededServices });
}

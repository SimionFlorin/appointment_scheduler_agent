import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultServices } from "@/lib/defaults";
import { Profession } from "@prisma/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { profession, businessName, phone, address, timezone } = body;

  if (!profession || !businessName) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const userId = session.user.id!;
  const professionEnum = profession as Profession;

  // Update user profession
  await prisma.user.update({
    where: { id: userId },
    data: {
      profession: professionEnum,
      onboardingDone: true,
    },
  });

  // Create business profile
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

  // Seed default services
  const defaults = getDefaultServices(professionEnum);
  const existingServices = await prisma.service.count({
    where: { userId },
  });

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
  }

  return NextResponse.json({ success: true });
}

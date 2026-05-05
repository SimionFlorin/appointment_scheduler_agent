import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonReply, maskSensitive } from "@/lib/api-log";

const area = "settings:profile";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonReply(area, { error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
  });

  return jsonReply(area, { profile });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonReply(area, { error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  console.log(`[${area}] PUT request body=`, maskSensitive(body));

  const {
    businessName,
    phone,
    address,
    timezone,
    mondayStart,
    mondayEnd,
    tuesdayStart,
    tuesdayEnd,
    wednesdayStart,
    wednesdayEnd,
    thursdayStart,
    thursdayEnd,
    fridayStart,
    fridayEnd,
    saturdayStart,
    saturdayEnd,
    sundayStart,
    sundayEnd,
  } = body;

  const profile = await prisma.businessProfile.upsert({
    where: { userId: session.user.id },
    update: {
      businessName,
      phone,
      address,
      timezone,
      mondayStart: mondayStart || null,
      mondayEnd: mondayEnd || null,
      tuesdayStart: tuesdayStart || null,
      tuesdayEnd: tuesdayEnd || null,
      wednesdayStart: wednesdayStart || null,
      wednesdayEnd: wednesdayEnd || null,
      thursdayStart: thursdayStart || null,
      thursdayEnd: thursdayEnd || null,
      fridayStart: fridayStart || null,
      fridayEnd: fridayEnd || null,
      saturdayStart: saturdayStart || null,
      saturdayEnd: saturdayEnd || null,
      sundayStart: sundayStart || null,
      sundayEnd: sundayEnd || null,
    },
    create: {
      userId: session.user.id,
      businessName: businessName || "My Business",
      phone,
      address,
      timezone: timezone || "America/New_York",
      mondayStart: mondayStart || null,
      mondayEnd: mondayEnd || null,
      tuesdayStart: tuesdayStart || null,
      tuesdayEnd: tuesdayEnd || null,
      wednesdayStart: wednesdayStart || null,
      wednesdayEnd: wednesdayEnd || null,
      thursdayStart: thursdayStart || null,
      thursdayEnd: thursdayEnd || null,
      fridayStart: fridayStart || null,
      fridayEnd: fridayEnd || null,
      saturdayStart: saturdayStart || null,
      saturdayEnd: saturdayEnd || null,
      sundayStart: sundayStart || null,
      sundayEnd: sundayEnd || null,
    },
  });

  return jsonReply(area, { profile });
}

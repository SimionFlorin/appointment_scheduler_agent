import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const HOUR_FIELDS = [
  "mondayStart",
  "mondayEnd",
  "tuesdayStart",
  "tuesdayEnd",
  "wednesdayStart",
  "wednesdayEnd",
  "thursdayStart",
  "thursdayEnd",
  "fridayStart",
  "fridayEnd",
  "saturdayStart",
  "saturdayEnd",
  "sundayStart",
  "sundayEnd",
] as const;

function convertTime(
  time: string | null | undefined,
  oldTz: string,
  newTz: string
): string | null {
  if (!time) return null;
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const utcTime = fromZonedTime(`${dateStr} ${time}:00`, oldTz);
  const newLocal = toZonedTime(utcTime, newTz);
  const hours = String(newLocal.getHours()).padStart(2, "0");
  const minutes = String(newLocal.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
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

  const existing = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
  });

  const oldTimezone = existing?.timezone;
  const newTimezone = timezone;
  const timezoneChanged =
    existing && newTimezone && oldTimezone && oldTimezone !== newTimezone;

  const hours: Record<string, string | null> = {
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
  };

  if (timezoneChanged) {
    for (const field of HOUR_FIELDS) {
      hours[field] = convertTime(hours[field], oldTimezone, newTimezone);
    }
  }

  const profile = await prisma.businessProfile.upsert({
    where: { userId: session.user.id },
    update: {
      businessName,
      phone,
      address,
      timezone,
      ...hours,
    },
    create: {
      userId: session.user.id,
      businessName: businessName || "My Business",
      phone,
      address,
      timezone: timezone || "America/New_York",
      ...hours,
    },
  });

  return NextResponse.json({ profile });
}

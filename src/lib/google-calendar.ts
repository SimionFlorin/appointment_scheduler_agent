import { google } from "googleapis";
import { prisma } from "./prisma";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
}

async function getAuthenticatedClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user || !user.googleRefreshToken) {
    throw new Error("User not found or missing Google credentials");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime(),
  });

  // Auto-refresh if expired
  const tokenExpiry = user.googleTokenExpiry?.getTime() || 0;
  if (Date.now() >= tokenExpiry - 60000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: credentials.access_token,
        googleTokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : undefined,
      },
    });
    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

export async function getAvailableSlots(
  userId: string,
  date: string,
  durationMinutes: number,
  timezone: string
): Promise<{ start: string; end: string }[]> {
  const oauth2Client = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { businessProfile: true },
  });

  if (!user?.businessProfile) return [];

  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  const dayName = dayNames[startOfDay.getDay()];
  const profile = user.businessProfile;
  const dayStart =
    (profile[`${dayName}Start` as keyof typeof profile] as string) || null;
  const dayEnd =
    (profile[`${dayName}End` as keyof typeof profile] as string) || null;

  if (!dayStart || !dayEnd) return []; // Closed on this day

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      timeZone: timezone,
      items: [{ id: "primary" }],
    },
  });

  const busySlots =
    response.data.calendars?.primary?.busy?.map((slot) => ({
      start: new Date(slot.start!).getTime(),
      end: new Date(slot.end!).getTime(),
    })) || [];

  const slots: { start: string; end: string }[] = [];

  const workStart = new Date(`${date}T${dayStart}:00`);
  const workEnd = new Date(`${date}T${dayEnd}:00`);

  let current = workStart.getTime();
  const slotDuration = durationMinutes * 60 * 1000;

  while (current + slotDuration <= workEnd.getTime()) {
    const slotEnd = current + slotDuration;
    const isConflict = busySlots.some(
      (busy) => current < busy.end && slotEnd > busy.start
    );

    if (!isConflict) {
      slots.push({
        start: new Date(current).toISOString(),
        end: new Date(slotEnd).toISOString(),
      });
    }

    current += 30 * 60 * 1000; // 30-min increments
  }

  return slots;
}

export async function createCalendarEvent(
  userId: string,
  params: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendeePhone?: string;
    timezone: string;
  }
) {
  const oauth2Client = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: params.summary,
      description: params.description || `Booked via WhatsApp. Customer phone: ${params.attendeePhone}`,
      start: {
        dateTime: params.startTime,
        timeZone: params.timezone,
      },
      end: {
        dateTime: params.endTime,
        timeZone: params.timezone,
      },
    },
  });

  return event.data;
}

export async function deleteCalendarEvent(
  userId: string,
  eventId: string
) {
  const oauth2Client = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

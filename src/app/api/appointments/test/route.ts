import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testAppointments = await prisma.appointment.findMany({
    where: { userId: session.user.id, isTest: true },
    select: { id: true, googleCalendarEventId: true },
  });

  for (const appt of testAppointments) {
    if (appt.googleCalendarEventId) {
      try {
        await deleteCalendarEvent(session.user.id, appt.googleCalendarEventId);
      } catch {
        // Calendar event may already be deleted
      }
    }
  }

  const { count } = await prisma.appointment.deleteMany({
    where: { userId: session.user.id, isTest: true },
  });

  return NextResponse.json({ success: true, deleted: count });
}

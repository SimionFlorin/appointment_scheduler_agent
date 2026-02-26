import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;
  if (upcoming === "true") {
    where.startTime = { gte: new Date() };
    where.status = { in: ["SCHEDULED", "CONFIRMED"] };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { service: true },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  return NextResponse.json(appointments);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.appointment.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(appointment);
}

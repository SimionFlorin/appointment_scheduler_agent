import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await prisma.service.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, price, duration } = body;

  if (!name || !price || !duration) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      userId: session.user.id,
      name,
      description: description || "",
      price: parseFloat(price),
      duration: parseInt(duration),
    },
  });

  return NextResponse.json(service);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, description, price, duration, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing service ID" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.service.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const service = await prisma.service.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      description: description ?? existing.description,
      price: price !== undefined ? parseFloat(price) : existing.price,
      duration: duration !== undefined ? parseInt(duration) : existing.duration,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    },
  });

  return NextResponse.json(service);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing service ID" }, { status: 400 });
  }

  const existing = await prisma.service.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

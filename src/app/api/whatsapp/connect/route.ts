import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Save WhatsApp configuration after user completes setup
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider, ...config } = body;

  if (provider === "META") {
    const { wabaId, phoneNumberId, accessToken } = config;
    if (!wabaId || !phoneNumberId || !accessToken) {
      return NextResponse.json({ error: "Missing Meta API fields" }, { status: 400 });
    }

    await prisma.whatsAppConfig.upsert({
      where: { userId: session.user.id },
      update: {
        provider: "META",
        wabaId,
        phoneNumberId,
        metaAccessToken: accessToken,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        provider: "META",
        wabaId,
        phoneNumberId,
        metaAccessToken: accessToken,
      },
    });
  } else if (provider === "TWILIO") {
    const { accountSid, authToken, phoneNumber } = config;
    if (!accountSid || !authToken || !phoneNumber) {
      return NextResponse.json({ error: "Missing Twilio fields" }, { status: 400 });
    }

    await prisma.whatsAppConfig.upsert({
      where: { userId: session.user.id },
      update: {
        provider: "TWILIO",
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken,
        twilioPhoneNumber: phoneNumber,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        provider: "TWILIO",
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken,
        twilioPhoneNumber: phoneNumber,
      },
    });
  } else {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

// Get current WhatsApp config status
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.whatsAppConfig.findUnique({
    where: { userId: session.user.id },
    select: {
      provider: true,
      isActive: true,
      phoneNumberId: true,
      twilioPhoneNumber: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ config });
}

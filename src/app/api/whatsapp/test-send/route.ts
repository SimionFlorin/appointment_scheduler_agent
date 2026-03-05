import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppProvider } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phoneNumber } = await request.json();
  if (!phoneNumber) {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { whatsappConfig: true, businessProfile: true },
  });

  if (!user?.whatsappConfig?.isActive) {
    return NextResponse.json(
      { error: "WhatsApp is not configured. Connect it in Settings first." },
      { status: 400 }
    );
  }

  const businessName =
    user.businessProfile?.businessName || "Your Business";

  try {
    const whatsapp = getWhatsAppProvider(user.whatsappConfig.provider, {
      phoneNumberId: user.whatsappConfig.phoneNumberId || "",
      metaAccessToken: user.whatsappConfig.metaAccessToken || "",
      twilioAccountSid: user.whatsappConfig.twilioAccountSid || "",
      twilioAuthToken: user.whatsappConfig.twilioAuthToken || "",
      twilioPhoneNumber: user.whatsappConfig.twilioPhoneNumber || "",
    });

    await whatsapp.sendMessage({
      to: phoneNumber,
      body: `This is a test message from ${businessName}'s appointment scheduler. If you received this, your WhatsApp integration is working correctly!`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send test message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

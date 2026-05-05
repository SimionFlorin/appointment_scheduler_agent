import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { jsonReply, maskSensitive } from "@/lib/api-log";

const area = "WA:test-send";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonReply(area, { error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  console.log(`[${area}] POST request body=`, maskSensitive(body));

  const { phoneNumber } = body;
  if (!phoneNumber) {
    return jsonReply(area, { error: "Phone number is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { whatsappConfig: true, businessProfile: true },
  });

  if (!user?.whatsappConfig?.isActive) {
    return jsonReply(
      area,
      { error: "WhatsApp is not configured. Connect it in Settings first." },
      { status: 400 }
    );
  }

  const businessName = user.businessProfile?.businessName || "Your Business";

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

    return jsonReply(area, { success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send test message";
    console.error(`[${area}] POST send threw:`, error);
    return jsonReply(area, { error: message }, { status: 500 });
  }
}

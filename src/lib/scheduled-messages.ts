import { prisma } from "./prisma";
import { getWhatsAppProvider } from "./whatsapp";
import type { ConversationMessage } from "@/types";

/**
 * Send an outbound WhatsApp message on behalf of a user (the business owner)
 * and append it to the corresponding Conversation history with `manual: true`.
 *
 * Used by:
 *   - The "Send now" button in the Conversations UI (`/api/conversations/[phone]/messages`)
 *   - The `?action=send-now` override on a scheduled row
 *   - The cron dispatcher (`/api/cron/send-scheduled-messages`)
 *
 * Throws on any error (missing config, provider failure, etc.) so callers can
 * surface the message to the user / mark a scheduled row as FAILED.
 */
export async function sendOutboundMessage(opts: {
  userId: string;
  customerPhone: string;
  body: string;
}): Promise<void> {
  const { userId, customerPhone, body } = opts;

  const trimmed = body?.trim();
  if (!trimmed) {
    throw new Error("Message body is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { whatsappConfig: true },
  });

  if (!user) {
    throw new Error("User not found");
  }
  if (!user.whatsappConfig || !user.whatsappConfig.isActive) {
    throw new Error(
      "WhatsApp is not configured. Connect it in Settings first."
    );
  }

  const provider = getWhatsAppProvider(user.whatsappConfig.provider, {
    phoneNumberId: user.whatsappConfig.phoneNumberId || "",
    metaAccessToken: user.whatsappConfig.metaAccessToken || "",
    twilioAccountSid: user.whatsappConfig.twilioAccountSid || "",
    twilioAuthToken: user.whatsappConfig.twilioAuthToken || "",
    twilioPhoneNumber: user.whatsappConfig.twilioPhoneNumber || "",
  });

  console.log("[scheduled-messages] sending outbound", {
    userId,
    customerPhone,
    provider: user.whatsappConfig.provider,
    bodyLength: trimmed.length,
  });

  await provider.sendMessage({ to: customerPhone, body: trimmed });

  // Persist into the conversation history as a manual assistant message.
  const conversation = await prisma.conversation.findUnique({
    where: { userId_customerPhone: { userId, customerPhone } },
  });

  const existingMessages: ConversationMessage[] = conversation
    ? (conversation.messages as unknown as ConversationMessage[])
    : [];

  existingMessages.push({
    role: "assistant",
    content: trimmed,
    timestamp: new Date().toISOString(),
    manual: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messagesJson = JSON.parse(JSON.stringify(existingMessages)) as any;

  if (conversation) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messages: messagesJson,
        lastMessageAt: new Date(),
      },
    });
  } else {
    await prisma.conversation.create({
      data: {
        userId,
        customerPhone,
        messages: messagesJson,
        lastMessageAt: new Date(),
      },
    });
  }

  console.log("[scheduled-messages] outbound + history persisted OK");
}

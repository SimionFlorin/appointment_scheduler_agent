import { WhatsAppProvider } from "@prisma/client";

export interface WhatsAppMessage {
  to: string;
  body: string;
}

export interface IncomingWhatsAppMessage {
  from: string;
  body: string;
  messageId: string;
  timestamp: string;
}

export interface IWhatsAppProvider {
  sendMessage(message: WhatsAppMessage): Promise<void>;
  /**
   * Show the "three dots" typing indicator to the customer for the given
   * inbound message. On Meta this also marks the message as read. Providers
   * that do not support typing indicators (e.g. Twilio) MUST implement this
   * as a no-op rather than throwing — callers treat all providers uniformly.
   */
  sendTypingIndicator(inboundMessageId: string): Promise<void>;
}

export function getWhatsAppProvider(
  provider: WhatsAppProvider,
  config: Record<string, string>
): IWhatsAppProvider {
  switch (provider) {
    case "META":
      // Dynamic import to avoid loading both
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { MetaWhatsAppProvider } = require("./meta-provider");
      return new MetaWhatsAppProvider(
        config.phoneNumberId,
        config.metaAccessToken
      );
    case "TWILIO":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { TwilioWhatsAppProvider } = require("./twilio-provider");
      return new TwilioWhatsAppProvider(
        config.twilioAccountSid,
        config.twilioAuthToken,
        config.twilioPhoneNumber
      );
    default:
      throw new Error(`Unknown WhatsApp provider: ${provider}`);
  }
}

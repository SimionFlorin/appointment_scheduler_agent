import { IWhatsAppProvider, WhatsAppMessage } from "./index";
import twilio from "twilio";

export class TwilioWhatsAppProvider implements IWhatsAppProvider {
  private client: ReturnType<typeof twilio>;

  constructor(
    accountSid: string,
    authToken: string,
    private fromNumber: string
  ) {
    this.client = twilio(accountSid, authToken);
  }

  async sendMessage(message: WhatsAppMessage): Promise<void> {
    await this.client.messages.create({
      body: message.body,
      from: `whatsapp:${this.fromNumber}`,
      to: `whatsapp:${message.to}`,
    });
  }
}

export function parseTwilioWebhookPayload(body: Record<string, string>): {
  from: string;
  body: string;
  messageSid: string;
  to: string;
} | null {
  try {
    const from = body.From?.replace("whatsapp:", "") || "";
    const msgBody = body.Body || "";
    const messageSid = body.MessageSid || "";
    const to = body.To?.replace("whatsapp:", "") || "";

    if (!from || !msgBody) return null;
    return { from, body: msgBody, messageSid, to };
  } catch {
    return null;
  }
}

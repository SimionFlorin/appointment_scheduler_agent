import { IWhatsAppProvider, WhatsAppMessage } from "./index";
import { decrypt } from "@/lib/crypto";

const graphVersion = () => process.env.META_GRAPH_VERSION || "v25.0";

/**
 * Resolve the access token for a vendor. When `META_USE_SYSTEM_TOKEN=true`
 * (dev/testing), the shared `SYSTEM_USER_ACCESS_TOKEN_WHATSAPP` env var is
 * used instead of the per-vendor encrypted token.
 */
export function resolveAccessToken(encryptedOrPlain: string): string {
  if (process.env.META_USE_SYSTEM_TOKEN === "true" && process.env.SYSTEM_USER_ACCESS_TOKEN_WHATSAPP) {
    return process.env.SYSTEM_USER_ACCESS_TOKEN_WHATSAPP;
  }
  return decrypt(encryptedOrPlain);
}

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  constructor(
    private phoneNumberId: string,
    private accessToken: string
  ) {}

  async sendMessage(message: WhatsAppMessage): Promise<void> {
    const token = resolveAccessToken(this.accessToken);
    const url = `https://graph.facebook.com/${graphVersion()}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to,
        type: "text",
        text: { body: message.body },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => response.text());
      throw new Error(
        `Meta WhatsApp API ${response.status}: ${typeof error === "string" ? error : JSON.stringify(error)}`
      );
    }
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");
  return `sha256=${expectedSignature}` === signature;
}

/** Verbose diagnostics for Vercel/Meta webhook debugging (prefix logs with grep `[WA]`). */
export function logMetaWebhookDiagnostics(body: Record<string, unknown>): void {
  try {
    const obj = body.object;
    const entries = (body.entry as Array<Record<string, unknown>>) || [];
    const entry0 = entries[0];
    const changes = (entry0?.changes as Array<Record<string, unknown>>) || [];
    const ch0 = changes[0];
    const field = ch0?.field as string | undefined;
    const value = ch0?.value as Record<string, unknown> | undefined;
    const metadata = value?.metadata as Record<string, string> | undefined;
    const phoneNumberId = metadata?.phone_number_id;
    const rawMessages = (value?.messages as Array<Record<string, unknown>>) || [];
    const statuses = (value?.statuses as Array<Record<string, unknown>>) || [];
    const types = rawMessages.map((m) => String(m.type ?? "?")).join(", ");

    console.log("[WA:meta] diagnostics", {
      object: obj,
      entryCount: entries.length,
      firstChangeField: field,
      phone_number_id: phoneNumberId ?? "(missing)",
      rawMessageCount: rawMessages.length,
      rawMessageTypes: types || "(none)",
      textAfterFilterWouldBe: rawMessages.filter((m) => m.type === "text").length,
      statusCount: statuses.length,
    });
  } catch (e) {
    console.error("[WA:meta] diagnostics parse error", e);
  }
}

export function parseMetaWebhookPayload(body: Record<string, unknown>): {
  phoneNumberId: string;
  messages: { from: string; body: string; id: string; timestamp: string }[];
} | null {
  try {
    const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
    const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
    const value = changes?.value as Record<string, unknown>;
    const metadata = value?.metadata as Record<string, string>;
    const phoneNumberId = metadata?.phone_number_id;

    const rawMessages = (value?.messages as Array<Record<string, unknown>>) || [];
    const messages = rawMessages
      .filter((m) => m.type === "text")
      .map((m) => ({
        from: m.from as string,
        body: (m.text as Record<string, string>)?.body || "",
        id: m.id as string,
        timestamp: m.timestamp as string,
      }));

    if (!phoneNumberId || messages.length === 0) return null;

    return { phoneNumberId, messages };
  } catch {
    return null;
  }
}

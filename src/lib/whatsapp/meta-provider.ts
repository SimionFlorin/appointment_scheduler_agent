import { IWhatsAppProvider, WhatsAppMessage } from "./index";
import { prisma } from "@/lib/prisma";

const GRAPH_API_VERSION = "v21.0";

/**
 * Drop any inbound webhook message whose original `timestamp` (Unix seconds
 * sent by Meta) is older than this many seconds. Meta retries failed webhook
 * deliveries for up to 7 days — without this filter a previously-undelivered
 * backlog can flood the bot all at once.
 */
export const MAX_WEBHOOK_MESSAGE_AGE_SECONDS = 5 * 60;

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  constructor(
    private phoneNumberId: string,
    private accessToken: string
  ) {}

  async sendMessage(message: WhatsAppMessage): Promise<void> {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
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
      const error = await response.text();
      throw new Error(`Meta WhatsApp API error: ${error}`);
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

export interface ParsedMetaMessage {
  from: string;
  body: string;
  id: string;
  timestamp: string; // Unix seconds, as a string (Meta's format)
}

export function parseMetaWebhookPayload(body: Record<string, unknown>): {
  phoneNumberId: string;
  messages: ParsedMetaMessage[];
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

/**
 * Filter out messages whose Meta-provided `timestamp` is older than
 * MAX_WEBHOOK_MESSAGE_AGE_SECONDS. Returns the kept messages and logs how many
 * were dropped (so a backlog flood is visible in logs).
 */
export function filterFreshMessages<T extends { timestamp: string; id: string }>(
  messages: T[]
): T[] {
  const nowSec = Math.floor(Date.now() / 1000);
  const fresh: T[] = [];
  const stale: { id: string; ageSec: number }[] = [];

  for (const m of messages) {
    const ts = parseInt(m.timestamp, 10);
    if (!Number.isFinite(ts)) {
      // If Meta omitted/garbled the timestamp, treat as fresh rather than drop
      // a real customer message. Idempotency will still prevent duplicates.
      fresh.push(m);
      continue;
    }
    const ageSec = nowSec - ts;
    if (ageSec > MAX_WEBHOOK_MESSAGE_AGE_SECONDS) {
      stale.push({ id: m.id, ageSec });
    } else {
      fresh.push(m);
    }
  }

  if (stale.length > 0) {
    console.warn("[WA:meta] dropped STALE messages from webhook backlog", {
      droppedCount: stale.length,
      maxAgeSeconds: MAX_WEBHOOK_MESSAGE_AGE_SECONDS,
      samples: stale.slice(0, 5),
    });
  }

  return fresh;
}

export type ClaimResult = "claimed" | "duplicate" | "error";

/**
 * Atomically claim a Meta message ID for processing.
 *
 * - "claimed":   we won — caller should process the message.
 * - "duplicate": another delivery already processed this messageId — caller
 *                should skip (this is the normal idempotency path).
 * - "error":     unexpected DB error (e.g. table missing, connection issue).
 *                Caller should fail-OPEN and process the message anyway —
 *                better to risk one duplicate reply than to silence the bot.
 *
 * This leverages a unique constraint on `ProcessedMessage.messageId` so
 * concurrent inserts can't both succeed.
 */
export async function claimMessageForProcessing(
  messageId: string
): Promise<ClaimResult> {
  try {
    await prisma.processedMessage.create({ data: { messageId } });
    return "claimed";
  } catch (err: unknown) {
    // Prisma throws P2002 on unique violation — that's a real duplicate.
    const code = (err as { code?: string })?.code;
    if (code === "P2002") return "duplicate";
    console.error(
      "[WA:meta] claimMessageForProcessing FAILED — failing OPEN (will process anyway). " +
        "Did you run `npx prisma db push`?",
      { messageId, errorCode: code, err }
    );
    return "error";
  }
}

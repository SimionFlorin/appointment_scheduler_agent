import { NextResponse } from "next/server";

const SENSITIVE_KEYS = new Set(
  [
    "access_token",
    "accessToken",
    "metaAccessToken",
    "meta_access_token",
    "authToken",
    "auth_token",
    "password",
    "secret",
    "apiKey",
    "api_key",
    "code",
    "client_secret",
    "refresh_token",
    "csrfToken",
    "csrf_token",
    "twilioAuthToken",
    "twilio_auth_token",
  ].map((k) => k.toLowerCase())
);

function maskString(s: string): string {
  if (s.length <= 6) return "[masked]";
  return `${s.slice(0, 4)}…[${s.length}c]`;
}

export function maskSensitive(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(maskSensitive);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = typeof v === "string" ? maskString(v) : "[masked]";
    } else {
      out[k] = maskSensitive(v);
    }
  }
  return out;
}

export function maskSensitiveText(text: string, maxLen = 2000): string {
  let out = text;
  for (const key of SENSITIVE_KEYS) {
    const json = new RegExp(`("${key}"\\s*:\\s*")([^"]*)(")`, "gi");
    out = out.replace(json, (_, p1: string, p2: string, p3: string) =>
      `${p1}${maskString(p2)}${p3}`
    );
    const form = new RegExp(`(${key}=)([^&\\s]*)`, "gi");
    out = out.replace(form, (_, p1: string, p2: string) =>
      `${p1}${maskString(decodeURIComponent(p2))}`
    );
  }
  if (out.length > maxLen) {
    return `${out.slice(0, maxLen)}…[+${out.length - maxLen} chars]`;
  }
  return out;
}

/**
 * Logs a structured response and returns the corresponding NextResponse. Use
 * in API route handlers so every return path emits a `[area] response` log
 * with the status and (masked) body.
 */
export function jsonReply(
  area: string,
  body: unknown,
  init?: { status?: number }
): NextResponse {
  const status = init?.status ?? 200;
  console.log(`[${area}] response status=${status} body=`, maskSensitive(body));
  return NextResponse.json(body, init);
}

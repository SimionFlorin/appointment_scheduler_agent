/**
 * Graph API helpers for WhatsApp Embedded Signup onboarding.
 *
 * Every function throws a `MetaApiError` on non-2xx responses so callers
 * get the structured error body Meta returns (useful for debugging).
 */

const graphVersion = () => process.env.META_GRAPH_VERSION || "v25.0";
const graphUrl = (path: string) =>
  `https://graph.facebook.com/${graphVersion()}/${path}`;

export class MetaApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

async function graphFetch(
  url: string,
  init?: RequestInit
): Promise<unknown> {
  const res = await fetch(url, init);
  const body = await res.json();

  if (!res.ok) {
    const msg =
      (body as Record<string, Record<string, string>>)?.error?.message ||
      JSON.stringify(body);
    throw new MetaApiError(
      `Meta Graph API ${res.status}: ${msg}`,
      res.status,
      body
    );
  }
  return body;
}

/**
 * Exchange the short-lived code from Embedded Signup for a long-lived
 * Business Integration System User access token.
 *
 * **The code expires in ~30 seconds** — call this immediately upon receipt.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    code,
  });

  const data = (await graphFetch(
    `${graphUrl("oauth/access_token")}?${params}`
  )) as { access_token: string };

  return data.access_token;
}

/**
 * Subscribe our app to the WABA's webhooks so we receive message events.
 */
export async function subscribeApp(
  wabaId: string,
  accessToken: string
): Promise<void> {
  await graphFetch(graphUrl(`${wabaId}/subscribed_apps`), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Register the phone number with Cloud API.
 * The PIN is required for future re-registration — store it securely.
 */
export async function registerPhoneNumber(
  phoneNumberId: string,
  accessToken: string,
  pin: string
): Promise<void> {
  await graphFetch(graphUrl(`${phoneNumberId}/register`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      pin,
    }),
  });
}

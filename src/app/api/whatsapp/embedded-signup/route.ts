import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonReply, maskSensitive } from "@/lib/api-log";

const area = "WA:es";
const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface MetaErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

async function readMetaError(res: Response): Promise<string> {
  try {
    const data = (await res.clone().json()) as MetaErrorBody;
    if (data?.error?.message) {
      const sub =
        data.error.error_subcode != null ? ` (subcode ${data.error.error_subcode})` : "";
      return `${data.error.message}${sub}`;
    }
  } catch {
    // fall through to text
  }
  try {
    return await res.text();
  } catch {
    return `HTTP ${res.status}`;
  }
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonReply(area, { error: "Unauthorized" }, { status: 401 });
  }

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    console.error(
      `[${area}] missing NEXT_PUBLIC_FACEBOOK_APP_ID or FACEBOOK_APP_SECRET`
    );
    return jsonReply(
      area,
      { error: "Server is not configured for Embedded Signup" },
      { status: 500 }
    );
  }

  let body: { code?: string; wabaId?: string; phoneNumberId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonReply(area, { error: "Invalid JSON body" }, { status: 400 });
  }
  console.log(`[${area}] POST request body=`, maskSensitive(body));

  const { code, wabaId, phoneNumberId } = body;
  if (!code || !wabaId || !phoneNumberId) {
    return jsonReply(
      area,
      { error: "Missing code, wabaId, or phoneNumberId" },
      { status: 400 }
    );
  }

  // 1. Exchange the auth code for a long-lived business access token.
  let accessToken: string;
  try {
    const exchangeUrl = new URL(`${GRAPH_BASE}/oauth/access_token`);
    exchangeUrl.searchParams.set("client_id", appId);
    exchangeUrl.searchParams.set("client_secret", appSecret);
    exchangeUrl.searchParams.set("code", code);

    const tokenRes = await fetch(exchangeUrl.toString(), { method: "GET" });
    if (!tokenRes.ok) {
      const detail = await readMetaError(tokenRes);
      console.error(`[${area}] token exchange failed:`, detail);
      return jsonReply(
        area,
        { error: `Token exchange failed: ${detail}` },
        { status: 400 }
      );
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      console.error(`[${area}] token exchange returned no access_token`, tokenData);
      return jsonReply(
        area,
        { error: "Token exchange returned no access token" },
        { status: 400 }
      );
    }
    accessToken = tokenData.access_token;
    console.log(`[${area}] meta /oauth/access_token ok`);
  } catch (err) {
    console.error(`[${area}] token exchange threw`, err);
    return jsonReply(
      area,
      { error: "Network error during token exchange" },
      { status: 502 }
    );
  }

  // 2. Subscribe our app to webhooks for this WABA.
  try {
    const subRes = await fetch(`${GRAPH_BASE}/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!subRes.ok) {
      const detail = await readMetaError(subRes);
      console.error(`[${area}] subscribed_apps failed:`, detail);
      return jsonReply(
        area,
        { error: `Webhook subscription failed: ${detail}` },
        { status: 400 }
      );
    }
    console.log(`[${area}] meta /subscribed_apps ok`, { wabaId });
  } catch (err) {
    console.error(`[${area}] subscribed_apps threw`, err);
    return jsonReply(
      area,
      { error: "Network error subscribing webhooks" },
      { status: 502 }
    );
  }

  // 3. Register the phone number on WhatsApp's network. If it's already
  //    registered Meta returns a 400 we can safely ignore — the same flow is
  //    documented in whatsapp-error-131031-troubleshooting.md.
  const pin = generatePin();
  try {
    console.log(`[${area}] registering phone with PIN`, { phoneNumberId, pin });
    const regRes = await fetch(`${GRAPH_BASE}/${phoneNumberId}/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", pin }),
    });
    if (!regRes.ok) {
      const detail = await readMetaError(regRes);
      console.warn(
        `[${area}] meta /register non-OK (continuing — number may already be registered):`,
        detail
      );
    } else {
      console.log(`[${area}] meta /register ok`, { phoneNumberId });
    }
  } catch (err) {
    console.warn(`[${area}] /register threw (continuing)`, err);
  }

  // 4. Persist the connection (including the registration PIN).
  try {
    await prisma.whatsAppConfig.upsert({
      where: { userId: session.user.id },
      update: {
        provider: "META",
        wabaId,
        phoneNumberId,
        metaAccessToken: accessToken,
        registerPin: pin,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        provider: "META",
        wabaId,
        phoneNumberId,
        metaAccessToken: accessToken,
        registerPin: pin,
      },
    });
  } catch (err) {
    console.error(`[${area}] DB upsert failed`, err);
    return jsonReply(
      area,
      { error: "Failed to save WhatsApp configuration" },
      { status: 500 }
    );
  }

  return jsonReply(area, { success: true, wabaId, phoneNumberId });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import {
  exchangeCodeForToken,
  subscribeApp,
  registerPhoneNumber,
  MetaApiError,
} from "@/lib/meta";
import { randomInt } from "crypto";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    code: string;
    waba_id: string;
    phone_number_id: string;
    business_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { code, waba_id, phone_number_id, business_id } = body;
  if (!code || !waba_id || !phone_number_id) {
    return NextResponse.json(
      { error: "Missing required fields: code, waba_id, phone_number_id" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Exchange the short-lived code for a long-lived token.
    // The code has a ~30s TTL — this must happen immediately.
    const accessToken = await exchangeCodeForToken(code);

    // Step 2: Subscribe our app to the WABA's webhooks.
    await subscribeApp(waba_id, accessToken);

    // Step 3: Register the phone number with Cloud API.
    const pin = String(randomInt(100000, 999999));
    await registerPhoneNumber(phone_number_id, accessToken, pin);

    // Step 4: Persist everything on the vendor's record.
    // Token and PIN are encrypted at rest.
    await prisma.whatsAppConfig.upsert({
      where: { userId: session.user.id },
      update: {
        provider: "META",
        wabaId: waba_id,
        phoneNumberId: phone_number_id,
        businessId: business_id || null,
        metaAccessToken: encrypt(accessToken),
        registrationPin: encrypt(pin),
        isActive: true,
      },
      create: {
        userId: session.user.id,
        provider: "META",
        wabaId: waba_id,
        phoneNumberId: phone_number_id,
        businessId: business_id || null,
        metaAccessToken: encrypt(accessToken),
        registrationPin: encrypt(pin),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[onboard] WhatsApp Embedded Signup failed:", error);

    if (error instanceof MetaApiError) {
      return NextResponse.json(
        { error: error.message, meta_error: error.body },
        { status: error.status >= 400 && error.status < 500 ? error.status : 502 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Onboarding failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

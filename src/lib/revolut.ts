const REVOLUT_SANDBOX_URL =
  process.env.REVOLUT_API_URL || "https://sandbox-merchant.revolut.com";
const REVOLUT_SANDBOX_KEY = process.env.REVOLUT_API_SECRET_KEY!;

const REVOLUT_LIVE_URL =
  process.env.REVOLUT_LIVE_API_URL || "https://merchant.revolut.com";
const REVOLUT_LIVE_KEY = process.env.REVOLUT_LIVE_SECRET_KEY || "";

const API_VERSION = "2024-09-01";

const TEST_CARD_NUMBER = process.env.REVOLUT_TEST_CARD_NUMBER || "";

function getRevolutConfig(sandbox: boolean) {
  return {
    apiUrl: sandbox ? REVOLUT_SANDBOX_URL : REVOLUT_LIVE_URL,
    secretKey: sandbox ? REVOLUT_SANDBOX_KEY : REVOLUT_LIVE_KEY,
  };
}

export function isSandboxCard(cardNumber: string): boolean {
  return cardNumber.replace(/\s/g, "") === TEST_CARD_NUMBER;
}

interface CreateOrderParams {
  amount: number;
  currency: string;
  description?: string;
  customerEmail?: string;
  redirectUrl?: string;
}

interface RevolutOrder {
  id: string;
  token: string;
  type: string;
  state: string;
  amount: number;
  currency: string;
  description?: string;
  checkout_url: string;
  created_at: string;
  updated_at: string;
}

export async function createRevolutOrder(
  params: CreateOrderParams,
  sandbox: boolean = false
): Promise<RevolutOrder> {
  const { apiUrl, secretKey } = getRevolutConfig(sandbox);

  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency,
  };

  if (params.description) body.description = params.description;
  if (params.customerEmail) body.customer_email = params.customerEmail;
  if (params.redirectUrl) body.redirect_url = params.redirectUrl;

  const response = await fetch(`${apiUrl}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      "Revolut-Api-Version": API_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Revolut API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function retrieveRevolutOrder(
  orderId: string,
  sandbox: boolean = false
): Promise<RevolutOrder> {
  const { apiUrl, secretKey } = getRevolutConfig(sandbox);

  const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Revolut-Api-Version": API_VERSION,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Revolut API error ${response.status}: ${text}`);
  }

  return response.json();
}

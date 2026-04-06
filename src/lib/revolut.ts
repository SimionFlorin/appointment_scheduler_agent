const REVOLUT_API_URL = process.env.REVOLUT_API_URL!;
const REVOLUT_API_SECRET_KEY = process.env.REVOLUT_API_SECRET_KEY!;

const API_VERSION = "2024-09-01";

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
  params: CreateOrderParams
): Promise<RevolutOrder> {
  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency,
  };

  if (params.description) body.description = params.description;
  if (params.customerEmail) body.customer_email = params.customerEmail;
  if (params.redirectUrl) body.redirect_url = params.redirectUrl;

  const response = await fetch(`${REVOLUT_API_URL}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REVOLUT_API_SECRET_KEY}`,
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
  orderId: string
): Promise<RevolutOrder> {
  const response = await fetch(`${REVOLUT_API_URL}/api/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${REVOLUT_API_SECRET_KEY}`,
      "Revolut-Api-Version": API_VERSION,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Revolut API error ${response.status}: ${text}`);
  }

  return response.json();
}


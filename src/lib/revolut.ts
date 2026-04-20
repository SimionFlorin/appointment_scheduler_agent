const REVOLUT_SANDBOX_URL =
  process.env.REVOLUT_SANDBOX_API_URL || "https://sandbox-merchant.revolut.com";
const REVOLUT_SANDBOX_KEY = process.env.REVOLUT_SANDBOX_API_SECRET_KEY || "";

const REVOLUT_LIVE_URL =
  process.env.REVOLUT_API_URL || "https://merchant.revolut.com";
const REVOLUT_LIVE_KEY = process.env.REVOLUT_API_SECRET_KEY || "";

const API_VERSION = "2025-06-04";

function getRevolutConfig(sandbox: boolean) {
  return {
    apiUrl: sandbox ? REVOLUT_SANDBOX_URL : REVOLUT_LIVE_URL,
    secretKey: sandbox ? REVOLUT_SANDBOX_KEY : REVOLUT_LIVE_KEY,
  };
}

/**
 * Whether checkout should use Revolut sandbox. The widget uses the order's
 * `public_id` + this flag to pick the right hosted environment, so there's no
 * need for per-card routing on the client anymore.
 *
 * Defaults to sandbox in any non-production NODE_ENV; set
 * `REVOLUT_USE_LIVE=1` to force live even in dev.
 */
export function shouldUseRevolutSandbox(): boolean {
  if (process.env.REVOLUT_USE_LIVE === "1") return false;
  return process.env.NODE_ENV !== "production";
}

export function isRevolutSecretConfigured(sandbox: boolean): boolean {
  const { secretKey } = getRevolutConfig(sandbox);
  return typeof secretKey === "string" && secretKey.trim().length > 0;
}

function assertRevolutSecretConfigured(sandbox: boolean): void {
  if (isRevolutSecretConfigured(sandbox)) return;
  if (sandbox) {
    throw new Error(
      "Revolut sandbox is selected but REVOLUT_SANDBOX_API_SECRET_KEY is " +
        "missing or empty. Use the Merchant API secret from your Revolut " +
        "sandbox business account."
    );
  }
  throw new Error(
    "Revolut live is selected but REVOLUT_API_SECRET_KEY is missing or empty."
  );
}

interface CreateOrderParams {
  amount: number;
  currency: string;
  description?: string;
  customerEmail?: string;
  /** Revolut customer id — required when saving a payment method. */
  customerId?: string;
  /**
   * Must be `"merchant"` for autopay (so the cron can charge the saved card
   * off-session) or `"customer"` for 1-click checkout. Revolut requires this
   * on the order *and* on the widget's `payWithPopup({ savePaymentMethodFor })`
   * call; passing it to only one side results in a 400 on the widget's
   * `/api/public/orders/{id}/payments` request.
   */
  savePaymentMethodFor?: "merchant" | "customer";
}

/** Full JSON body from Revolut Merchant `orders` API (create/retrieve). */
export type RevolutOrderJson = Record<string, unknown>;

/**
 * Create-order response after validating the fields we rely on.
 * `public_id` is the token the browser passes to the Revolut Checkout widget.
 *
 * The Merchant API has returned this under different keys across versions —
 * `token` (2024-09-01+) and `public_id` (older) — so we normalise to
 * `public_id` after parsing.
 */
export type RevolutOrderCreated = RevolutOrderJson & {
  id: string;
  public_id: string;
};

function normaliseOrderFields(
  order: RevolutOrderJson
): { id: string; public_id: string } {
  const id = order.id;
  const publicId =
    typeof order.public_id === "string"
      ? order.public_id
      : typeof order.token === "string"
        ? order.token
        : null;

  if (typeof id !== "string" || !publicId) {
    throw new Error(
      "Invalid Revolut order response: missing id or widget token " +
        "(public_id / token)"
    );
  }

  order.public_id = publicId;
  return { id, public_id: publicId };
}

export async function createRevolutOrder(
  params: CreateOrderParams,
  sandbox: boolean = false
): Promise<RevolutOrderCreated> {
  assertRevolutSecretConfigured(sandbox);
  const { apiUrl, secretKey } = getRevolutConfig(sandbox);

  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency,
  };

  if (params.description) body.description = params.description;
  if (params.customerEmail) body.customer_email = params.customerEmail;
  // IMPORTANT: Revolut expects `customer` as a nested object with `id`, not a
  // flat `customer_id` field. The flat form is silently ignored, which makes
  // the widget's /payments call fail with 400 code 1022 because the order is
  // treated as not-linked-to-a-customer.
  if (params.customerId) body.customer = { id: params.customerId };
  if (params.savePaymentMethodFor)
    body.save_payment_method_for = params.savePaymentMethodFor;

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
    const hint =
      response.status === 401
        ? sandbox
          ? " Check REVOLUT_SANDBOX_API_SECRET_KEY."
          : " Check REVOLUT_API_SECRET_KEY (live Merchant API secret)."
        : "";
    throw new Error(`Revolut API error ${response.status}: ${text}${hint}`);
  }

  const json = (await response.json()) as RevolutOrderJson;
  normaliseOrderFields(json);

  // Sanity-check that the customer actually linked. If Revolut echoes back
  // no `customer` object, the widget will later fail with 400 code 1022.
  if (params.customerId && process.env.NODE_ENV !== "production") {
    const echoed = (json as { customer?: { id?: string } }).customer;
    if (!echoed?.id) {
      console.warn(
        "[revolut] Order created but response is missing `customer` object — " +
          "payment popup will 400 with code 1022. Check that customer.id was " +
          "sent as a nested object, not flat customer_id.",
        { sent: params.customerId, orderId: (json as { id?: string }).id }
      );
    }
  }

  return json as RevolutOrderCreated;
}

export async function retrieveRevolutOrder(
  orderId: string,
  sandbox: boolean = false
): Promise<RevolutOrderJson> {
  assertRevolutSecretConfigured(sandbox);
  const { apiUrl, secretKey } = getRevolutConfig(sandbox);

  const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Revolut-Api-Version": API_VERSION,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const hint =
      response.status === 401
        ? sandbox
          ? " Check REVOLUT_SANDBOX_API_SECRET_KEY."
          : " Check REVOLUT_API_SECRET_KEY (live), or if this Payment row has the wrong isSandbox flag, fix or remove stale PENDING payments."
        : "";
    throw new Error(`Revolut API error ${response.status}: ${text}${hint}`);
  }

  return (await response.json()) as RevolutOrderJson;
}

// ---------------------------------------------------------------------------
// Customers, saved payment methods and merchant-initiated pay-order.
// Used by the recurring-subscription / autopay cron flow.
// ---------------------------------------------------------------------------

export interface RevolutCustomerJson {
  id: string;
  email?: string;
  full_name?: string;
  [key: string]: unknown;
}

export interface RevolutSavedPaymentMethod {
  id: string;
  type: string; // "card" | "revolut_pay"
  saved_for?: string; // "customer" | "merchant"
  card?: {
    brand?: string;
    last_four?: string;
    expiry_month?: number | string;
    expiry_year?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function createRevolutCustomer(
  params: { email: string; fullName?: string },
  sandbox: boolean
): Promise<RevolutCustomerJson> {
  assertRevolutSecretConfigured(sandbox);
  const { apiUrl, secretKey } = getRevolutConfig(sandbox);

  const body: Record<string, unknown> = { email: params.email };
  if (params.fullName) body.full_name = params.fullName;

  const response = await fetch(`${apiUrl}/api/1.0/customers`, {
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
    throw new Error(`Revolut create-customer ${response.status}: ${text}`);
  }

  const json = (await response.json()) as RevolutCustomerJson;
  if (typeof json.id !== "string") {
    throw new Error("Revolut create-customer: missing id in response");
  }
  return json;
}

export async function listRevolutPaymentMethods(
  customerId: string,
  opts: { onlyMerchant?: boolean; sandbox: boolean }
): Promise<RevolutSavedPaymentMethod[]> {
  assertRevolutSecretConfigured(opts.sandbox);
  const { apiUrl, secretKey } = getRevolutConfig(opts.sandbox);

  const qs = opts.onlyMerchant ? "?only_merchant=true" : "";
  const response = await fetch(
    `${apiUrl}/api/1.0/customers/${customerId}/payment-methods${qs}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Revolut-Api-Version": API_VERSION,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Revolut list-payment-methods ${response.status}: ${text}`
    );
  }

  const json = await response.json();
  if (Array.isArray(json)) return json as RevolutSavedPaymentMethod[];
  if (json && Array.isArray((json as { data?: unknown }).data))
    return (json as { data: RevolutSavedPaymentMethod[] }).data;
  return [];
}

interface PayOrderParams {
  orderId: string;
  savedPaymentMethod: {
    id: string;
    type: string; // "card" | "revolut_pay"
    initiator: "customer" | "merchant";
  };
  sandbox: boolean;
}

/**
 * Merchant-initiated charge of a saved payment method against an existing order.
 * Response state is typically COMPLETED (sync) or PENDING (async, await webhook).
 */
export async function payRevolutOrder(
  params: PayOrderParams
): Promise<RevolutOrderJson> {
  assertRevolutSecretConfigured(params.sandbox);
  const { apiUrl, secretKey } = getRevolutConfig(params.sandbox);

  const response = await fetch(
    `${apiUrl}/api/orders/${params.orderId}/payments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Revolut-Api-Version": API_VERSION,
      },
      body: JSON.stringify({ saved_payment_method: params.savedPaymentMethod }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Revolut pay-order ${response.status}: ${text}`);
  }

  return (await response.json()) as RevolutOrderJson;
}

/**
 * Pull the saved payment method off the order's payments list (preferred),
 * falling back to the customer's payment-method list when the order response
 * hasn't embedded it yet.
 */
export function extractSavedMethodFromOrder(
  order: RevolutOrderJson
): RevolutSavedPaymentMethod | null {
  const payments = order.payments;
  if (!Array.isArray(payments) || payments.length === 0) return null;

  for (const p of payments) {
    if (!p || typeof p !== "object") continue;
    const pm = (p as Record<string, unknown>).payment_method;
    if (pm && typeof pm === "object") {
      const m = pm as RevolutSavedPaymentMethod;
      if (typeof m.id === "string" && typeof m.type === "string") return m;
    }
  }
  return null;
}

/**
 * Minimal PayPal Orders v2 client — create an order, capture it. Deliberately
 * a hand-rolled fetch wrapper rather than a dependency: we use two endpoints.
 *
 * Credentials come from the environment and never from the browser:
 *   NEXT_PUBLIC_PAYPAL_CLIENT_ID  client id (also needed by the JS SDK, hence public)
 *   PAYPAL_CLIENT_SECRET          secret — server only
 *   PAYPAL_ENV                    "live" | "sandbox" (default: sandbox)
 */

const SANDBOX_API = "https://api-m.sandbox.paypal.com";
const LIVE_API = "https://api-m.paypal.com";

/** Thrown when the app has no PayPal credentials — routes turn this into a 503. */
export class PayPalConfigError extends Error {
  constructor() {
    super("PayPal is not configured.");
    this.name = "PayPalConfigError";
  }
}

export class PayPalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PayPalApiError";
  }
}

export function isLive(): boolean {
  return process.env.PAYPAL_ENV === "live";
}

export function apiBase(): string {
  return isLive() ? LIVE_API : SANDBOX_API;
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new PayPalConfigError();

  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new PayPalApiError(
      `PayPal auth failed (${response.status}). Check the client id and secret.`,
      response.status,
    );
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new PayPalApiError("PayPal returned no access token.", 502);
  return data.access_token;
}

interface CreateOrderInput {
  /** Fixed-2 string, e.g. "58.50". */
  amount: string;
  currency: string;
  description: string;
  /** Tier slug — read back on capture so the receipt can name the package. */
  referenceId: string;
  /** Partner attribution slug, e.g. "cosmo". */
  customId: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
}

export async function createPayPalOrder(input: CreateOrderInput): Promise<PayPalOrder> {
  const token = await getAccessToken();

  const response = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          custom_id: input.customId,
          // PayPal caps description at 127 characters.
          description: input.description.slice(0, 127),
          amount: { currency_code: input.currency, value: input.amount },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Away Tweaks",
            // Digital service: never ask the buyer for a shipping address.
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
    }),
  });

  const data = (await response.json()) as PayPalOrder & { message?: string };
  if (!response.ok || !data.id) {
    throw new PayPalApiError(data.message ?? "PayPal could not create the order.", response.status);
  }
  return data;
}

export interface PayPalCapture {
  orderId: string;
  status: string;
  /** Fixed-2 string as charged. */
  amount: string;
  currency: string;
  /** Tier slug from reference_id. */
  tierSlug: string;
  /** Partner slug from custom_id. */
  partner: string;
  buyerEmail: string;
  buyerName: string;
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalCapture> {
  const token = await getAccessToken();

  const response = await fetch(`${apiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = (await response.json()) as PayPalCaptureResponse & { message?: string };
  if (!response.ok) {
    throw new PayPalApiError(data.message ?? "PayPal could not capture the payment.", response.status);
  }

  return normalizeCapture(data);
}

interface PayPalCaptureResponse {
  id?: string;
  status?: string;
  payer?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    payments?: {
      captures?: Array<{ amount?: { value?: string; currency_code?: string } }>;
    };
  }>;
}

/**
 * Flattens PayPal's capture payload. Every field here comes back from PayPal
 * rather than the browser, so the amount and attribution can be trusted.
 * Exported for tests.
 */
export function normalizeCapture(data: PayPalCaptureResponse): PayPalCapture {
  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const name = [data.payer?.name?.given_name, data.payer?.name?.surname].filter(Boolean).join(" ");

  return {
    orderId: data.id ?? "",
    status: data.status ?? "UNKNOWN",
    amount: capture?.amount?.value ?? "",
    currency: capture?.amount?.currency_code ?? "",
    tierSlug: unit?.reference_id ?? "",
    partner: unit?.custom_id ?? "direct",
    buyerEmail: data.payer?.email_address ?? "",
    buyerName: name,
  };
}

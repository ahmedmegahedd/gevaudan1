/**
 * Paymob (Egypt) credit-card integration.
 *
 * Standard 3-step flow before showing the iframe:
 *   1. Auth      — POST /auth/tokens         → bearer token (1h TTL)
 *   2. Register  — POST /ecommerce/orders    → paymob order id
 *   3. Pay key   — POST /acceptance/payment_keys → opaque token used by iframe
 *
 * Then redirect the customer to:
 *   {BASE}/acceptance/iframes/{IFRAME_ID}?payment_token={token}
 *
 * After payment Paymob fires a webhook with HMAC-signed payload that we
 * verify in /api/payment/paymob/webhook.
 *
 * All env vars are read inside each function so a missing key produces a
 * single descriptive error instead of crashing module-load on the build server.
 */

import crypto from "crypto"

const DEFAULT_BASE_URL = "https://accept.paymob.com/api"

interface PaymobEnv {
  apiKey: string
  integrationId: string
  iframeId: string
  hmacSecret: string
  baseUrl: string
}

export function getPaymobEnv(): PaymobEnv {
  const apiKey = process.env.PAYMOB_API_KEY
  const integrationId = process.env.PAYMOB_INTEGRATION_ID
  const iframeId = process.env.PAYMOB_IFRAME_ID
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET
  const baseUrl = process.env.PAYMOB_BASE_URL ?? DEFAULT_BASE_URL

  const missing: string[] = []
  if (!apiKey || apiKey === "replace_me") missing.push("PAYMOB_API_KEY")
  if (!integrationId || integrationId === "replace_me") missing.push("PAYMOB_INTEGRATION_ID")
  if (!iframeId || iframeId === "replace_me") missing.push("PAYMOB_IFRAME_ID")
  if (!hmacSecret || hmacSecret === "replace_me") missing.push("PAYMOB_HMAC_SECRET")

  if (missing.length > 0) {
    throw new Error(
      `Paymob is not configured. Missing env vars: ${missing.join(", ")}.`
    )
  }
  return { apiKey: apiKey!, integrationId: integrationId!, iframeId: iframeId!, hmacSecret: hmacSecret!, baseUrl }
}

// ── Step 1 ─────────────────────────────────────────────────────────────────
async function authenticate(env: PaymobEnv): Promise<string> {
  const res = await fetch(`${env.baseUrl}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: env.apiKey }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Paymob auth failed: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { token?: string }
  if (!json.token) throw new Error("Paymob auth: no token in response")
  return json.token
}

// ── Step 2 ─────────────────────────────────────────────────────────────────
interface RegisterOrderInput {
  amountCents: number
  currency: string
  merchantOrderId: string
  items: Array<{
    name: string
    amount_cents: number
    description?: string
    quantity: number
  }>
}

async function registerOrder(
  env: PaymobEnv,
  authToken: string,
  input: RegisterOrderInput
): Promise<{ paymobOrderId: number }> {
  const res = await fetch(`${env.baseUrl}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: input.amountCents,
      currency: input.currency,
      items: input.items,
      merchant_order_id: input.merchantOrderId,
    }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Paymob register failed: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { id?: number }
  if (!json.id) throw new Error("Paymob register: no order id in response")
  return { paymobOrderId: json.id }
}

// ── Step 3 ─────────────────────────────────────────────────────────────────
interface PaymentKeyInput {
  amountCents: number
  currency: string
  paymobOrderId: number
  billing: BillingData
}

export interface BillingData {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  apartment?: string
  floor?: string
  street: string
  building?: string
  shipping_method?: string
  postal_code?: string
  city: string
  country: string
  state?: string
}

const BILLING_DEFAULTS: Partial<BillingData> = {
  apartment: "NA",
  floor: "NA",
  building: "NA",
  shipping_method: "NA",
  postal_code: "NA",
  state: "NA",
}

async function getPaymentKey(
  env: PaymobEnv,
  authToken: string,
  input: PaymentKeyInput
): Promise<string> {
  const billing: BillingData = { ...(BILLING_DEFAULTS as BillingData), ...input.billing }
  const res = await fetch(`${env.baseUrl}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: input.amountCents,
      expiration: 3600,
      order_id: input.paymobOrderId,
      billing_data: billing,
      currency: input.currency,
      integration_id: Number(env.integrationId),
      lock_order_when_paid: true,
    }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Paymob payment-key failed: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { token?: string }
  if (!json.token) throw new Error("Paymob payment-key: no token in response")
  return json.token
}

// ── Public: full chain ─────────────────────────────────────────────────────
export interface CreatePaymentInput {
  /** Internal order UUID — passed as merchant_order_id so the webhook can look us up. */
  internalOrderId: string
  amountCents: number
  currency: string
  items: RegisterOrderInput["items"]
  billing: BillingData
}

export interface CreatePaymentResult {
  paymobOrderId: number
  iframeUrl: string
  paymentToken: string
}

/**
 * Runs auth → register → get payment key and returns the iframe URL the
 * customer should be redirected to.
 */
export async function createPaymobPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const env = getPaymobEnv()
  const authToken = await authenticate(env)
  const { paymobOrderId } = await registerOrder(env, authToken, {
    amountCents: input.amountCents,
    currency: input.currency,
    items: input.items,
    merchantOrderId: input.internalOrderId,
  })
  const paymentToken = await getPaymentKey(env, authToken, {
    amountCents: input.amountCents,
    currency: input.currency,
    paymobOrderId,
    billing: input.billing,
  })
  const iframeUrl = `${env.baseUrl}/acceptance/iframes/${env.iframeId}?payment_token=${paymentToken}`
  return { paymobOrderId, iframeUrl, paymentToken }
}

// ── Webhook HMAC verification ─────────────────────────────────────────────
/**
 * Paymob's transaction processed callback signs the following 23 fields
 * concatenated in this exact order with HMAC-SHA512.
 * https://docs.paymob.com/docs/hmac-calculation
 */
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const

interface PaymobTransactionPayload {
  obj?: Record<string, unknown>
}

function getNested(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = cur[p]
    else return ""
  }
  if (cur === null || cur === undefined) return ""
  return String(cur)
}

/**
 * Returns true when the supplied HMAC matches the canonical concatenation
 * of the transaction fields signed with the merchant's HMAC secret.
 */
export function verifyPaymobHmac(
  payload: PaymobTransactionPayload,
  receivedHmac: string
): boolean {
  if (!receivedHmac) return false
  const env = getPaymobEnv()
  const obj = (payload.obj ?? {}) as Record<string, unknown>
  const concatenated = HMAC_FIELDS.map((f) => getNested(obj, f)).join("")
  const expected = crypto
    .createHmac("sha512", env.hmacSecret)
    .update(concatenated)
    .digest("hex")
  // Constant-time compare
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(receivedHmac, "hex")
    )
  } catch {
    return false
  }
}

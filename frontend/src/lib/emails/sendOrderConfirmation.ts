import { render } from "@react-email/components"
import { sendEmail } from "@/lib/email"
import { storeConfig } from "@/config/store.config"
import { formatOrderNumber } from "@/lib/orderNumber"
import OrderConfirmation from "./OrderConfirmation"
import type { Order } from "@/types"

interface SendOrderConfirmationResult {
  data?: { id?: string }
  error?: string
  /** True when no email address was supplied (success-equivalent — nothing to do). */
  skipped?: boolean
}

/**
 * Render the OrderConfirmation React Email template and send it via Resend.
 * Safe to call without a customer email — it will return `{ skipped: true }`.
 *
 * Errors are returned, not thrown, so order placement isn't blocked by
 * email delivery failures. Callers should log on `error` but otherwise
 * continue.
 */
export async function sendOrderConfirmationEmail(
  order: Order
): Promise<SendOrderConfirmationResult> {
  const email = order.customer_info?.email?.trim()
  if (!email) return { skipped: true }

  const { brand } = storeConfig
  const shortId = formatOrderNumber(order.order_number)
  const subject = `Order ${shortId} confirmed — thank you from ${brand.name}`

  const html = await render(OrderConfirmation({ order }))

  const result = await sendEmail({ to: email, subject, html })
  if (result.error) return { error: result.error }
  return { data: result.data ?? undefined }
}

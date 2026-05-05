import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { sendOrderConfirmationEmail } from "@/lib/emails/sendOrderConfirmation"
import type { Order } from "@/types"

/**
 * POST /api/orders
 * Public — guest checkout. Uses service role key to bypass RLS on insert.
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { customer_info, delivery_address, items, subtotal, delivery_fee, total, promo_code, discount_amount } = body

  if (!customer_info || !delivery_address || !items || items.length === 0) {
    return NextResponse.json({ error: "Missing required order fields" }, { status: 400 })
  }

  // Normalize the email so empty strings become null and stored value is lowercased
  const normalizedEmail =
    typeof customer_info.email === "string" && customer_info.email.trim()
      ? customer_info.email.trim().toLowerCase()
      : null
  const normalizedCustomerInfo = {
    name: customer_info.name,
    phone: customer_info.phone,
    email: normalizedEmail ?? "",
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_info: normalizedCustomerInfo,
      delivery_address,
      items,
      subtotal,
      delivery_fee,
      discount_amount: discount_amount ?? 0,
      total,
      promo_code: promo_code ?? null,
      status: "pending",
    })
    .select("*")
    .single()

  // Deduct stock for each ordered item (variant-aware)
  if (!error) {
    await Promise.all(
      items.map(async (item: { product_id: string; quantity: number; variant?: Record<string, string> }) => {
        const { data: product } = await supabase
          .from("products")
          .select("stock, variant_stock, variants")
          .eq("id", item.product_id)
          .single()
        if (!product) return

        const updates: Record<string, unknown> = {}

        // Deduct from variant_stock if this product uses it
        if (product.variant_stock && item.variant && Object.keys(product.variant_stock).length > 0) {
          const specialKeys = /^(material|materials|fabric|size_guide)$/i
          const realKeys = Object.keys(product.variants ?? {}).filter((k: string) => !specialKeys.test(k))
          const key = realKeys.map((k: string) => item.variant![k] ?? "").join("|")
          if (key in product.variant_stock) {
            const updatedVariantStock = { ...product.variant_stock }
            updatedVariantStock[key] = Math.max(0, (updatedVariantStock[key] ?? 0) - item.quantity)
            updates.variant_stock = updatedVariantStock
            // Also update total stock as sum of all variant stocks
            updates.stock = Object.values(updatedVariantStock).reduce((s: number, v) => s + (v as number), 0)
          }
        } else {
          // No variant stock — deduct from total stock
          updates.stock = Math.max(0, product.stock - item.quantity)
        }

        await supabase.from("products").update(updates).eq("id", item.product_id)
      })
    )
  }

  // Increment promo code usage counter
  if (!error && promo_code) {
    const { data: promoRow } = await supabase
      .from("promo_codes")
      .select("times_used")
      .eq("code", promo_code)
      .single()
    if (promoRow) {
      await supabase
        .from("promo_codes")
        .update({ times_used: promoRow.times_used + 1 })
        .eq("code", promo_code)
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // ── Fire the order confirmation email (best-effort, non-blocking on errors) ──
  // We `await` the send here because serverless function lifecycles end with
  // the response, but we never let an email failure roll back the order.
  try {
    const result = await sendOrderConfirmationEmail(data as Order)
    if (result.error) {
      console.error("[orders] order confirmation email failed:", result.error)
    }
  } catch (e) {
    console.error("[orders] order confirmation email threw:", e)
  }

  return NextResponse.json(data, { status: 201 })
}

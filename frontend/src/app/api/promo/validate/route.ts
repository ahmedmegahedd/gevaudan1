import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"

const schema = z.object({
  code: z.string().min(1),
  orderTotal: z.number().min(0),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ valid: false, message: "Invalid request" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Invalid input" }, { status: 422 })
  }

  const { code, orderTotal } = parsed.data

  // Use service role to read promo codes (RLS policy only allows active codes for anon)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single()

  if (error || !promo) {
    return NextResponse.json({ valid: false, message: "Promo code not found." })
  }

  if (!promo.is_active) {
    return NextResponse.json({ valid: false, message: "This promo code is no longer active." })
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, message: "This promo code has expired." })
  }

  if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
    return NextResponse.json({ valid: false, message: "This promo code has reached its usage limit." })
  }

  if (promo.min_order_amount > 0 && orderTotal < promo.min_order_amount) {
    return NextResponse.json({
      valid: false,
      message: `Minimum order amount of ${promo.min_order_amount} required for this code.`,
    })
  }

  const discountAmount =
    promo.discount_type === "percentage"
      ? Math.round((orderTotal * promo.discount_value) / 100)
      : Math.min(promo.discount_value, orderTotal)

  return NextResponse.json({
    valid: true,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: discountAmount,
    message:
      promo.discount_type === "percentage"
        ? `${promo.discount_value}% discount applied!`
        : `${promo.discount_value} discount applied!`,
  })
}

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * POST /api/orders
 * Public — guest checkout. Uses service role key to bypass RLS on insert.
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { customer_info, delivery_address, items, subtotal, delivery_fee, total } = body

  if (!customer_info || !delivery_address || !items || items.length === 0) {
    return NextResponse.json({ error: "Missing required order fields" }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data, error } = await supabase
    .from("orders")
    .insert({ customer_info, delivery_address, items, subtotal, delivery_fee, total, status: "pending" })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

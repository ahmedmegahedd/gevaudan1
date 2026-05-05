import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"

const schema = z.object({
  product_id: z.string().uuid("Invalid product id"),
  email: z.string().email("Please enter a valid email address"),
  variant_info: z.record(z.string(), z.string()).nullable().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { product_id, email, variant_info } = parsed.data

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { error } = await supabase.from("stock_notifications").insert({
    product_id,
    email: email.toLowerCase().trim(),
    variant_info: variant_info ?? null,
  })

  if (error) {
    if (error.code === "23505") {
      // unique_violation — already on the waitlist for this product
      return NextResponse.json({ alreadySubscribed: true }, { status: 200 })
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

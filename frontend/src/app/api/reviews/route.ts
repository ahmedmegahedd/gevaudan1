import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"

const schema = z.object({
  product_id: z.string().uuid("Invalid product id"),
  display_name: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(80, "Display name is too long"),
  review_text: z
    .string()
    .trim()
    .min(20, "Review must be at least 20 characters")
    .max(4000, "Review is too long"),
  rating: z
    .number()
    .int()
    .min(1, "Please select a star rating")
    .max(5),
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

  const { product_id, display_name, review_text, rating } = parsed.data

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Confirm product exists (avoid orphaned reviews on bad ids)
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", product_id)
    .single()
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  // Insert as pending (is_approved = null) — distinct from rejected (false) and approved (true).
  const { error } = await supabase.from("reviews").insert({
    product_id,
    display_name,
    review_text,
    rating,
    is_approved: null,
  })

  if (error) {
    // Log the real Supabase error so it surfaces in the dev terminal / Vercel logs
    console.error("[api/reviews] insert failed:", error)
    return NextResponse.json(
      { error: error.message ?? "Something went wrong. Please try again.", code: error.code },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

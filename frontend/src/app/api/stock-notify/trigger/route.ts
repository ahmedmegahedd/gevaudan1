import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"
import { sendEmail, buildBackInStockEmail } from "@/lib/email"

const schema = z.object({
  product_id: z.string().uuid(),
})

interface NotificationRow {
  id: string
  email: string
}

interface ProductRow {
  id: string
  name: string
  slug: string
  images: string[] | null
}

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

  const { product_id } = parsed.data

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Verify caller is an admin (avoids leaking subscriber emails / spamming via this endpoint)
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: () => {},
      },
    }
  )
  const { data: userResult } = await userClient.auth.getUser()
  if (!userResult.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userResult.user.id)
    .single()
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Look up product (need name + slug + cover image for the email)
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, slug, images")
    .eq("id", product_id)
    .single<ProductRow>()

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  // Pull unnotified subscribers
  const { data: subs, error: subsError } = await supabase
    .from("stock_notifications")
    .select("id, email")
    .eq("product_id", product_id)
    .eq("notified", false)
    .returns<NotificationRow[]>()

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 })
  }
  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const productUrl = `${siteUrl.replace(/\/$/, "")}/shop/${product.slug}`
  const productImage = product.images?.[0] ?? null
  const html = buildBackInStockEmail({
    productName: product.name,
    productUrl,
    productImage,
  })
  const subject = `Good news! ${product.name} is back in stock`

  const sentIds: string[] = []
  let failed = 0

  for (const sub of subs) {
    const { error } = await sendEmail({ to: sub.email, subject, html })
    if (error) {
      failed += 1
      continue
    }
    sentIds.push(sub.id)
  }

  // Only mark rows we actually delivered as notified, so failed sends can be retried
  if (sentIds.length > 0) {
    await supabase
      .from("stock_notifications")
      .update({ notified: true })
      .in("id", sentIds)
  }

  return NextResponse.json({ sent: sentIds.length, failed })
}

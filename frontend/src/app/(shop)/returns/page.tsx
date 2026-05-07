import type { Metadata } from "next"
import { storeConfig } from "@/config/store.config"
import { createClient } from "@/lib/supabase/server"
import ReturnsClient, { type ExchangeProduct } from "./ReturnsClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Returns & Exchange | ${storeConfig.brand.name}`,
  description: `Start a return or exchange for your ${storeConfig.brand.name} order.`,
}

export default async function ReturnsPage() {
  const supabase = await createClient()

  // Fetch every active product the customer might exchange into. Pull all the
  // variant + per-variant-stock fields so the storefront can render the
  // variant pickers and OOS state without an extra round-trip.
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, images, stock, variants, variant_stock, stock_by_variant, color_names"
    )
    .eq("is_active", true)
    .gt("stock", 0)
    .order("name")

  const exchangeProducts: ExchangeProduct[] = (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    slug: p.slug as string,
    price: p.price as number,
    images: (p.images ?? []) as string[],
    stock: (p.stock as number) ?? 0,
    variants: ((p.variants ?? {}) as Record<string, string[]>),
    variant_stock: (p.variant_stock as Record<string, number> | null) ?? null,
    stock_by_variant: (p.stock_by_variant as Record<string, number> | null) ?? null,
    color_names: (p.color_names as Record<string, string> | null) ?? null,
  }))

  return <ReturnsClient exchangeProducts={exchangeProducts} />
}

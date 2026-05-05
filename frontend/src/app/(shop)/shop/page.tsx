import type { Metadata } from "next"
import { storeConfig } from "@/config/store.config"
import { createClient } from "@/lib/supabase/server"
import ShopPageClient from "@/components/shop/ShopPageClient"
import { attachRatings } from "@/lib/reviews"
import type { Product, Category } from "@/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Shop",
  description: `Browse all products from ${storeConfig.brand.name}`,
}

interface ShopPageProps {
  searchParams: { category?: string; minPrice?: string; maxPrice?: string; search?: string }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const supabase = await createClient()
  const { currency } = storeConfig.delivery

  // Fetch categories for filter UI
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name")

  // Build product query
  let query = supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (searchParams.search) {
    const term = searchParams.search.trim()
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  }

  if (searchParams.category) {
    const cat = (categories as Category[])?.find((c) => c.slug === searchParams.category)
    if (cat) query = query.eq("category_id", cat.id)
  }

  if (searchParams.minPrice) {
    query = query.gte("price", Number(searchParams.minPrice))
  }

  if (searchParams.maxPrice) {
    query = query.lte("price", Number(searchParams.maxPrice))
  }

  const { data: products } = await query
  const enriched = products ? await attachRatings(products as Product[]) : []

  const activeCategory = searchParams.category ?? null

  return (
    <ShopPageClient
      products={enriched}
      categories={(categories as Category[]) ?? []}
      activeCategory={activeCategory}
      minPrice={searchParams.minPrice ?? ""}
      maxPrice={searchParams.maxPrice ?? ""}
      currency={currency}
      searchQuery={searchParams.search ?? ""}
    />
  )
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import ProductDetail from "@/components/shop/ProductDetail"
import type { Product } from "@/types"

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("products")
      .select("slug")
      .eq("is_active", true)
    return (data ?? []).map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", params.slug)
    .single()

  if (!data) return { title: "Product Not Found" }

  return {
    title: `${data.name} | ${storeConfig.brand.name}`,
    description: data.description ?? storeConfig.brand.tagline,
  }
}

export default async function ProductPage({ params }: Props) {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single()

  if (!product) notFound()

  return <ProductDetail product={product as Product} />
}

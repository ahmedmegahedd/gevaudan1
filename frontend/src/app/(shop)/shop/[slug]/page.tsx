import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'
import { storeConfig } from "@/config/store.config"
import ProductDetail from "@/components/shop/ProductDetail"
import ProductCard from "@/components/shop/ProductCard"
import { getRecommendedProducts } from "@/lib/recommendations"
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

  const recommended = await getRecommendedProducts({
    categoryId: product.category_id,
    excludeIds: [product.id],
  })

  return (
    <>
      <ProductDetail product={product as Product} />

      {recommended.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t" style={{ borderColor: "#e5e7eb" }}>
          <h2
            className="text-2xl md:text-3xl font-bold mb-6"
            style={{ fontFamily: `var(--font-heading)`, color: "var(--color-primary)" }}
          >
            You May Also Like
          </h2>

          {/* Mobile: horizontal scroll; Desktop: 4-column grid */}
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-4 md:gap-6 scrollbar-hide">
            {recommended.map((p) => (
              <div key={p.id} className="shrink-0 w-48 md:w-auto">
                <ProductCard product={p as Product} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

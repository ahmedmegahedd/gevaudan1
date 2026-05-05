import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'
import { storeConfig } from "@/config/store.config"
import ProductDetail from "@/components/shop/ProductDetail"
import ProductCard from "@/components/shop/ProductCard"
import ReviewsSection from "@/components/shop/ReviewsSection"
import { getRecommendedProducts } from "@/lib/recommendations"
import { attachRatings } from "@/lib/reviews"
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

  const recommendedRaw = await getRecommendedProducts({
    categoryId: product.category_id,
    excludeIds: [product.id],
  })
  const recommended = await attachRatings(recommendedRaw as Product[])

  const p = product as Product

  return (
    <>
      <ProductDetail product={p} />

      {recommended.length > 0 && (
        <section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24"
          style={{ borderTop: "1px solid var(--divider-soft)" }}
        >
          <div className="section-title mb-12 md:mb-16">
            <h2
              className="text-[28px] md:text-[40px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-primary)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Complete Your Look
            </h2>
          </div>

          {/* Mobile: horizontal scroll; Desktop: 4-column grid */}
          <div className="flex gap-5 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-4 md:gap-8 scrollbar-hide">
            {recommended.map((rec) => (
              <div key={rec.id} className="shrink-0 w-56 md:w-auto">
                <ProductCard product={rec as Product} />
              </div>
            ))}
          </div>
        </section>
      )}

      <ReviewsSection productId={p.id} />
    </>
  )
}

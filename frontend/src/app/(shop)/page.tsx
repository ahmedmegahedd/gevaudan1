import type { Metadata } from "next"
import Link from "next/link"
import { storeConfig } from "@/config/store.config"
import { createClient } from "@/lib/supabase/server"
import ProductCard from "@/components/shop/ProductCard"
import Aurora from "@/components/ui/Aurora"
import { attachRatings } from "@/lib/reviews"
import type { Product, Category } from "@/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: storeConfig.brand.name,
  description: storeConfig.brand.tagline,
}

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: featuredRaw }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name"),
  ])

  const featuredProducts = featuredRaw
    ? await attachRatings(featuredRaw as Product[])
    : []

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative flex items-center justify-center min-h-[100vh] text-center px-4 sm:px-6 lg:px-10 py-24 overflow-hidden"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {/* Aurora WebGL background */}
        <div className="absolute inset-0 z-0">
          <Aurora
            colorStops={["#5C1F2A", "#8B3A48", "#3D1419"]}
            amplitude={1.8}
            blend={0.8}
            speed={0.5}
          />
        </div>
        {/* Subtle overlay — just enough to keep text readable */}
        <div
          className="absolute inset-0 z-10"
          style={{ background: "linear-gradient(to top, rgba(61,20,25,0.75) 0%, rgba(61,20,25,0.1) 50%, rgba(61,20,25,0.3) 100%)" }}
        />
        <div className="relative z-20 max-w-3xl w-full">
          <p
            className="brand-script mb-6 md:mb-8"
            style={{ color: "var(--color-cream)", fontSize: 56 }}
          >
            {storeConfig.brand.name}
          </p>
          <h1
            className="text-[36px] md:text-[56px] lg:text-[72px] mb-8 text-white"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "0.02em",
            }}
          >
            {storeConfig.brand.tagline}
          </h1>
          <p
            className="text-white/60 text-base md:text-lg mb-12 max-w-xl mx-auto"
            style={{ lineHeight: 1.8 }}
          >
            Discover our curated collection — crafted for those who appreciate timeless
            quality and refined style.
          </p>
          <Link
            href="/shop"
            className="inline-block w-full sm:w-auto px-12 py-4 text-[11px] uppercase font-medium text-white hover:opacity-90 rounded-[2px]"
            style={{
              backgroundColor: "var(--color-accent)",
              letterSpacing: "0.25em",
              minHeight: "52px",
              lineHeight: "44px",
            }}
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24">
          <div className="section-title mb-12 md:mb-20">
            <h2
              className="text-[28px] md:text-[40px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-primary)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Featured
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-16 md:mt-20">
            <Link
              href="/shop"
              className="luxe-outline-btn"
            >
              View All
            </Link>
          </div>
        </section>
      )}

      {/* ── Categories ── */}
      {categories && categories.length > 0 && (
        <section className="py-12 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="section-title mb-12 md:mb-20 px-4">
              <h2
                className="text-[28px] md:text-[40px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}
              >
                Shop by Category
              </h2>
            </div>
            {/* Mobile: horizontal scroll strip */}
            <div className="flex overflow-x-auto gap-5 pb-2 px-4 snap-x scrollbar-hide md:hidden">
              {(categories as Category[]).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative shrink-0 w-44 aspect-square snap-start overflow-hidden flex items-end p-5 rounded-card hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span
                    className="text-white text-base relative z-10"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {cat.name}
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  />
                </Link>
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-2 sm:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-10">
              {(categories as Category[]).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative aspect-square overflow-hidden flex items-end p-8 rounded-card hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span
                    className="text-white text-xl relative z-10"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {cat.name}
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

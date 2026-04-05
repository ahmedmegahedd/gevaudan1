import type { Metadata } from "next"
import Link from "next/link"
import { storeConfig } from "@/config/store.config"
import { createClient } from "@/lib/supabase/server"
import ProductCard from "@/components/shop/ProductCard"
import Aurora from "@/components/ui/Aurora"
import type { Product, Category } from "@/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: storeConfig.brand.name,
  description: storeConfig.brand.tagline,
}

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: featuredProducts }, { data: categories }] = await Promise.all([
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

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative flex items-center justify-center min-h-screen text-center px-4 overflow-hidden"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {/* Aurora WebGL background */}
        <div className="absolute inset-0 z-0">
          <Aurora
            colorStops={["#447794", "#88CCE8", "#2D5B75"]}
            amplitude={1.8}
            blend={0.8}
            speed={0.5}
          />
        </div>
        {/* Subtle overlay — just enough to keep text readable */}
        <div
          className="absolute inset-0 z-10"
          style={{ background: "linear-gradient(to top, rgba(6,18,34,0.75) 0%, rgba(6,18,34,0.1) 50%, rgba(6,18,34,0.3) 100%)" }}
        />
        <div className="relative z-20 max-w-3xl w-full">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-4 md:mb-6"
            style={{ color: "var(--color-accent)" }}
          >
            {storeConfig.brand.subtitle}
          </p>
          <h1
            className="text-4xl lg:text-7xl font-bold tracking-tight mb-4 md:mb-6 text-white"
            style={{ fontFamily: "var(--font-heading)", lineHeight: 1.1 }}
          >
            {storeConfig.brand.tagline}
          </h1>
          <p className="text-white/50 text-base md:text-lg mb-8 md:mb-10 max-w-xl mx-auto">
            Discover our curated collection — crafted for those who appreciate timeless
            quality and refined style.
          </p>
          <Link
            href="/shop"
            className="block sm:inline-block w-full sm:w-auto px-10 py-4 text-sm uppercase tracking-widest font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <h2
            className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            Featured
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {(featuredProducts as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-10 md:mt-12">
            <Link
              href="/shop"
              className="inline-block border text-sm uppercase tracking-widest px-8 py-3 transition-colors hover:text-white hover:bg-[var(--color-primary)]"
              style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
              }}
            >
              View All
            </Link>
          </div>
        </section>
      )}

      {/* ── Categories ── */}
      {categories && categories.length > 0 && (
        <section
          className="py-12 md:py-20"
          style={{ backgroundColor: "#f9f9f9" }}
        >
          <div className="max-w-7xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center px-4"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
            >
              Shop by Category
            </h2>
            {/* Mobile: horizontal scroll strip */}
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 snap-x scrollbar-hide md:hidden">
              {(categories as Category[]).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative shrink-0 w-40 aspect-square snap-start overflow-hidden flex items-end p-4 transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span
                    className="text-white text-sm font-semibold tracking-wide relative z-10"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {cat.name}
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  />
                </Link>
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 sm:px-6 lg:px-8">
              {(categories as Category[]).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative aspect-square overflow-hidden flex items-end p-6 transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span
                    className="text-white text-lg font-semibold tracking-wide relative z-10"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {cat.name}
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
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


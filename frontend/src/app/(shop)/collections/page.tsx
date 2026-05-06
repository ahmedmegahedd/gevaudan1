import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import type { Collection } from "@/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Collections | ${storeConfig.brand.name}`,
  description: `Browse curated collections from ${storeConfig.brand.name}`,
}

export default async function CollectionsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  const collections = (data ?? []) as Collection[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24">
      {/* Header */}
      <div className="text-center mb-16 md:mb-24 pt-4 md:pt-8">
        <p
          className="text-[11px] uppercase mb-6"
          style={{ color: "var(--color-accent)", letterSpacing: "0.3em" }}
        >
          Curated Edits
        </p>
        <h1
          className="text-[36px] md:text-[56px] mb-6"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          Collections
        </h1>
        <p
          className="text-base md:text-lg max-w-xl mx-auto"
          style={{ color: "rgba(42,61,46,0.55)", lineHeight: 1.8 }}
        >
          Thoughtfully curated selections for every occasion and style.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-base mb-8" style={{ color: "rgba(42,61,46,0.5)", lineHeight: 1.8 }}>
            No collections available yet.
          </p>
          <Link href="/shop" className="luxe-primary-btn">
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="group flex flex-col overflow-hidden rounded-card card-shadow"
              style={{ backgroundColor: "#ffffff" }}
            >
              {/* Cover image */}
              <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: "#DCD2BD" }}>
                {col.cover_image ? (
                  <Image
                    src={col.cover_image}
                    alt={col.name}
                    fill
                    className="object-cover group-hover:scale-105"
                    style={{ transition: "transform 0.4s ease" }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-mid2))" }}
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10" />
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col flex-1">
                <h2
                  className="text-2xl mb-3"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-primary)",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  {col.name}
                </h2>
                {col.description && (
                  <p
                    className="text-sm line-clamp-2 mb-6 flex-1"
                    style={{ color: "rgba(42,61,46,0.55)", lineHeight: 1.7 }}
                  >
                    {col.description}
                  </p>
                )}
                <span
                  className="self-start text-[11px] uppercase font-medium mt-auto pt-5 w-full"
                  style={{
                    borderTop: "1px solid var(--divider-soft)",
                    color: "var(--color-accent)",
                    letterSpacing: "0.18em",
                  }}
                >
                  View Collection →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

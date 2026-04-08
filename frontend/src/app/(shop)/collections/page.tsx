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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <h1
          className="text-3xl md:text-5xl font-bold mb-3"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Collections
        </h1>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          Thoughtfully curated selections for every occasion and style.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400">No collections available yet.</p>
          <Link
            href="/shop"
            className="inline-block mt-6 text-sm font-semibold uppercase tracking-widest px-8 py-3 text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="group flex flex-col overflow-hidden border transition-shadow hover:shadow-md"
              style={{ borderColor: "#e5e7eb" }}
            >
              {/* Cover image */}
              <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: "#a8c8e0" }}>
                {col.cover_image ? (
                  <Image
                    src={col.cover_image}
                    alt={col.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-mid2))" }}
                  />
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1" style={{ backgroundColor: "#d4e9f7" }}>
                <h2
                  className="text-xl font-bold mb-1 leading-snug"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
                >
                  {col.name}
                </h2>
                {col.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{col.description}</p>
                )}
                <span
                  className="self-start text-xs uppercase tracking-widest font-semibold mt-auto pt-2 border-t w-full"
                  style={{ borderColor: "#f3f4f6", color: "var(--color-accent)" }}
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

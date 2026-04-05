import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import ProductCard from "@/components/shop/ProductCard"
import type { Collection, CollectionProduct, Product, Category } from "@/types"

export const dynamic = "force-dynamic"

interface Props {
  params: { slug: string }
}

type ProductWithCategory = Product & { category?: Category }
type CollectionWithProducts = Collection & { products: (CollectionProduct & { product: ProductWithCategory })[] }

async function getCollection(slug: string): Promise<CollectionWithProducts | null> {
  const supabase = await createClient()

  const { data: col } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  if (!col) return null

  const { data: cps } = await supabase
    .from("collection_products")
    .select("*, product:products(*, category:categories(*))")
    .eq("collection_id", col.id)
    .order("display_order")

  return {
    ...col,
    products: (cps ?? []).filter((cp) => cp.product?.is_active),
  } as CollectionWithProducts
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("collections")
    .select("name, description")
    .eq("slug", params.slug)
    .single()

  return {
    title: data ? `${data.name} | ${storeConfig.brand.name}` : storeConfig.brand.name,
    description: data?.description ?? `Shop the ${data?.name} collection at ${storeConfig.brand.name}`,
  }
}

export default async function CollectionDetailPage({ params }: Props) {
  const collection = await getCollection(params.slug)
  if (!collection) notFound()

  const products = collection.products
    .map((cp) => cp.product)
    .filter(Boolean) as ProductWithCategory[]

  return (
    <>
      {/* Hero */}
      <section
        className="relative flex items-end justify-start min-h-[40vh] md:min-h-[50vh] px-4 sm:px-8 pb-10 overflow-hidden"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {collection.cover_image && (
          <>
            <Image
              src={collection.cover_image}
              alt={collection.name}
              fill
              className="object-cover opacity-40"
              priority
              sizes="100vw"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(6,18,34,0.9) 0%, rgba(6,18,34,0.3) 100%)" }}
            />
          </>
        )}

        <div className="relative z-10 max-w-3xl">
          <Link
            href="/collections"
            className="text-xs uppercase tracking-widest mb-4 inline-block transition-opacity hover:opacity-70"
            style={{ color: "var(--color-accent)" }}
          >
            ← All Collections
          </Link>
          <h1
            className="text-4xl md:text-6xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-heading)", lineHeight: 1.1 }}
          >
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-white/60 text-base md:text-lg max-w-xl">{collection.description}</p>
          )}
          <p className="text-white/40 text-sm mt-3">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      {/* Products grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-6">No products in this collection yet.</p>
            <Link
              href="/shop"
              className="inline-block text-sm font-semibold uppercase tracking-widest px-8 py-3 text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

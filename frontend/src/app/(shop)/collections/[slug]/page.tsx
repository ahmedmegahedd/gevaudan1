import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import ProductCard from "@/components/shop/ProductCard"
import { attachRatings } from "@/lib/reviews"
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

  const productsRaw = collection.products
    .map((cp) => cp.product)
    .filter(Boolean) as ProductWithCategory[]
  const products = await attachRatings(productsRaw)

  return (
    <>
      {/* Hero */}
      <section
        className="relative flex items-end justify-start min-h-[55vh] md:min-h-[65vh] px-4 sm:px-6 lg:px-10 pb-16 md:pb-20 pt-32 overflow-hidden"
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

        <div className="relative z-10 max-w-3xl mx-auto md:mx-0 w-full">
          <Link
            href="/collections"
            className="text-[11px] uppercase mb-8 inline-block hover:opacity-70"
            style={{
              color: "var(--color-accent)",
              letterSpacing: "0.25em",
            }}
          >
            ← All Collections
          </Link>
          <h1
            className="text-[36px] md:text-[56px] lg:text-[64px] text-white mb-6"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "0.02em",
            }}
          >
            {collection.name}
          </h1>
          {collection.description && (
            <p
              className="text-white/70 text-base md:text-lg max-w-xl"
              style={{ lineHeight: 1.8 }}
            >
              {collection.description}
            </p>
          )}
          <p
            className="text-[11px] uppercase mt-6"
            style={{
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.2em",
            }}
          >
            {products.length} {products.length !== 1 ? "Pieces" : "Piece"}
          </p>
        </div>
      </section>

      {/* Products grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <p
              className="text-base mb-8"
              style={{ color: "rgba(6,18,34,0.5)", lineHeight: 1.8 }}
            >
              No products in this collection yet.
            </p>
            <Link href="/shop" className="luxe-primary-btn">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

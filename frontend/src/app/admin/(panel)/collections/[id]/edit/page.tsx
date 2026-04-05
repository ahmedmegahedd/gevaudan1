import { notFound } from "next/navigation"
import { serverApi } from "@/lib/serverApi"
import CollectionForm from "@/components/admin/CollectionForm"
import CollectionProductAssigner from "@/components/admin/CollectionProductAssigner"
import type { Product, Category } from "@/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit Collection" }

interface Props {
  params: { id: string }
}

type ProductWithCategory = Product & { category?: Category }

export default async function EditCollectionPage({ params }: Props) {
  const [collection, products] = await Promise.all([
    serverApi.collectionById(params.id),
    serverApi.products(),
  ])

  if (!collection) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        Edit Collection
      </h1>

      <CollectionForm mode="edit" initialData={collection} />

      <CollectionProductAssigner
        collectionId={collection.id}
        allProducts={products as ProductWithCategory[]}
        initialAssigned={collection.products ?? []}
      />
    </div>
  )
}

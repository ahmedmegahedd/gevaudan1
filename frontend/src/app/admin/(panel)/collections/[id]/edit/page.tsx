import { notFound } from "next/navigation"
import { serverApi } from "@/lib/serverApi"
import CategoryForm from "@/components/admin/CategoryForm"
import CategoryProductManager from "@/components/admin/CategoryProductManager"
import type { Product } from "@/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit Category" }

interface Props {
  params: { id: string }
}

export default async function EditCategoryPage({ params }: Props) {
  const [categories, products] = await Promise.all([
    serverApi.categories(),
    serverApi.products(),
  ])

  const category = categories.find((c) => c.id === params.id)
  if (!category) notFound()

  const categoryProducts = products.filter((p) => p.category_id === params.id)
  const otherProducts = products.filter((p) => p.category_id !== params.id)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        Edit Category
      </h1>

      <CategoryForm mode="edit" initialData={category} />

      <CategoryProductManager
        categoryId={params.id}
        categoryProducts={categoryProducts as Product[]}
        otherProducts={otherProducts as Product[]}
      />
    </div>
  )
}

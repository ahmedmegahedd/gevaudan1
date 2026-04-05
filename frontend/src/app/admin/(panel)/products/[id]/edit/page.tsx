import { notFound } from "next/navigation"
import { serverApi } from "@/lib/serverApi"
import ProductForm from "@/components/admin/ProductForm"

export const dynamic = "force-dynamic"

export const metadata = { title: "Edit Product" }

interface Props {
  params: { id: string }
}

export default async function EditProductPage({ params }: Props) {
  const [product, categories] = await Promise.all([
    serverApi.product(params.id).catch(() => null),
    serverApi.categories("active=true"),
  ])

  if (!product) notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        Edit Product
      </h1>
      <ProductForm categories={categories} initialData={product} mode="edit" />
    </div>
  )
}

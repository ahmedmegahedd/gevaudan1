import { serverApi } from "@/lib/serverApi"
import ProductForm from "@/components/admin/ProductForm"

export const dynamic = "force-dynamic"

export const metadata = { title: "New Product" }

export default async function NewProductPage() {
  const categories = await serverApi.categories("active=true")

  return (
    <div className="max-w-4xl mx-auto">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        New Product
      </h1>
      <ProductForm categories={categories} mode="create" />
    </div>
  )
}

import CategoryForm from "@/components/admin/CategoryForm"

export const metadata = { title: "New Category" }

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        New Category
      </h1>
      <CategoryForm mode="create" />
    </div>
  )
}

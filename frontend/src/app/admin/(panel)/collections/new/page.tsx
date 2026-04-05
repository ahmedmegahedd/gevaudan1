import CollectionForm from "@/components/admin/CollectionForm"

export const metadata = { title: "New Collection" }

export default function NewCollectionPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        New Collection
      </h1>
      <CollectionForm mode="create" />
    </div>
  )
}

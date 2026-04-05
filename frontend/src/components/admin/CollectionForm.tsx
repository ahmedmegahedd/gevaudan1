"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { clientApi } from "@/lib/clientApi"
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants"
import { useToastStore } from "@/store/toastStore"
import type { Collection } from "@/types"

// ── Helpers ────────────────────────────────────────────────────

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function input(hasError: boolean) {
  return [
    "w-full border px-3 text-base focus:outline-none transition-colors bg-white",
    hasError ? "border-red-400" : "border-gray-300 focus:border-[var(--color-accent)]",
  ].join(" ") + " min-h-[48px]"
}

// ── Props ──────────────────────────────────────────────────────

export interface CollectionFormProps {
  initialData?: Collection
  mode: "create" | "edit"
}

// ── Component ──────────────────────────────────────────────────

export default function CollectionForm({ initialData, mode }: CollectionFormProps) {
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? "")
  const [slug, setSlug] = useState(initialData?.slug ?? "")
  const [slugManual, setSlugManual] = useState(mode === "edit")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order ?? 0)

  // Cover image state
  const [coverUrl, setCoverUrl] = useState<string | null>(initialData?.cover_image ?? null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Auto-slug from name
  useEffect(() => {
    if (!slugManual && name) {
      setSlug(slugify(name))
    }
  }, [name, slugManual])

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrors((p) => ({ ...p, cover: "Only JPG, PNG, or WebP accepted." }))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((p) => ({ ...p, cover: "Image must be under 5 MB." }))
      return
    }
    setErrors((p) => { const n = { ...p }; delete n.cover; return n })
    setCoverFile(file)
    const prev = URL.createObjectURL(file)
    setCoverPreview(prev)
    e.target.value = ""
  }

  function removeCover() {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
    setCoverUrl(null)
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Name is required"
    if (!slug.trim()) errs.slug = "Slug is required"
    if (!/^[a-z0-9-]+$/.test(slug)) errs.slug = "Slug: lowercase, numbers, hyphens only"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    // Upload cover image if new file selected
    let finalCoverUrl = coverUrl
    if (coverFile) {
      setUploading(true)
      const { data, error } = await clientApi.uploadImage(coverFile)
      setUploading(false)
      if (error || !data) {
        setErrors((p) => ({ ...p, cover: error ?? "Upload failed" }))
        setSaving(false)
        return
      }
      finalCoverUrl = data.url
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      cover_image: finalCoverUrl,
      is_active: isActive,
      display_order: displayOrder,
    }

    if (mode === "create") {
      const { data, error } = await clientApi.createCollection(payload)
      setSaving(false)
      if (error) {
        const isDuplicate = error.includes("duplicate") || error.includes("unique")
        setErrors({ slug: isDuplicate ? "This slug is already taken." : error })
        useToastStore.getState().addToast(error, "error")
        return
      }
      useToastStore.getState().addToast("Collection created", "success")
      // Redirect to edit page so product assignment is available
      router.push(`/admin/collections/${data!.id}/edit`)
    } else {
      const { error } = await clientApi.updateCollection(initialData!.id, payload)
      setSaving(false)
      if (error) {
        const isDuplicate = error.includes("duplicate") || error.includes("unique")
        setErrors({ slug: isDuplicate ? "This slug is already taken." : error })
        useToastStore.getState().addToast(error, "error")
        return
      }
      useToastStore.getState().addToast("Collection saved", "success")
      router.refresh()
    }
  }

  const currentImage = coverPreview ?? coverUrl
  const isSaving = saving || uploading

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* ── Basic Info ── */}
      <Section title="Basic Info">
        <Field label="Collection Name" error={errors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="e.g. Summer Essentials"
            className={input(!!errors.name)}
          />
        </Field>

        <Field label="Slug (URL identifier)" error={errors.slug}>
          <input
            value={slug}
            onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }}
            type="text"
            placeholder="summer-essentials"
            className={input(!!errors.slug)}
          />
          {slug && (
            <p className="text-xs text-gray-400 mt-1">
              Preview: <span className="font-mono">/collections/{slug}</span>
              {!slugManual && (
                <button
                  type="button"
                  className="ml-3 text-gray-400 underline text-xs"
                  onClick={() => setSlugManual(true)}
                >
                  Edit manually
                </button>
              )}
            </p>
          )}
        </Field>

        <Field label="Description" error={undefined}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe this collection…"
            className={input(false)}
          />
        </Field>
      </Section>

      {/* ── Cover Image ── */}
      <Section title="Cover Image">
        {currentImage ? (
          <div className="relative w-full max-w-xs aspect-video overflow-hidden bg-gray-100 group">
            <Image src={currentImage} alt="Cover" fill className="object-cover" sizes="320px" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="text-xs text-white bg-white/20 hover:bg-white/40 px-3 py-1.5 rounded cursor-pointer">
                Change
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  className="hidden"
                  onChange={handleCoverSelect}
                />
              </label>
              <button
                type="button"
                onClick={removeCover}
                className="text-xs text-white bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full max-w-xs aspect-video border-2 border-dashed cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
            style={{ borderColor: "#d1d5db" }}>
            <span className="text-gray-300 text-3xl mb-1">+</span>
            <span className="text-xs text-gray-400">Upload cover image</span>
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={handleCoverSelect}
            />
          </label>
        )}
        {errors.cover && <p className="text-xs text-red-500 mt-1">{errors.cover}</p>}
      </Section>

      {/* ── Settings ── */}
      <Section title="Settings">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Display Order" error={undefined}>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              min={0}
              className={input(false)}
            />
            <p className="text-xs text-gray-400 mt-1">Lower = shown first</p>
          </Field>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>Active</p>
            <p className="text-xs text-gray-400">Visible to customers</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: isActive ? "var(--color-accent)" : "#d1d5db" }}
            role="switch"
            aria-checked={isActive}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: isActive ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
        </div>
      </Section>

      {/* ── Submit ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-8 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-primary)", minHeight: "48px" }}
        >
          {uploading ? "Uploading image…" : saving ? "Saving…" : mode === "create" ? "Create Collection" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/collections")}
          className="flex items-center justify-center min-h-[44px] px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors border border-gray-200"
        >
          Cancel
        </button>
      </div>

      {mode === "create" && (
        <p className="text-xs text-gray-400">
          After creating the collection you&apos;ll be able to assign products to it.
        </p>
      )}
    </form>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border p-4 sm:p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
      <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 border-b pb-3"
        style={{ borderColor: "#f3f4f6" }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

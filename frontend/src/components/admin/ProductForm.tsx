"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import { clientApi } from "@/lib/clientApi"
import { storeConfig } from "@/config/store.config"
import { cartesian } from "@/lib/variantStock"
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants"
import { useToastStore } from "@/store/toastStore"
import type { Category, Product } from "@/types"

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  description: z.string().optional(),
  composition: z.string().optional(),
  measurements: z.string().optional(),
  model_info: z.string().optional(),
  price: z.preprocess((v) => Number(v), z.number().min(0)),
  category_id: z.string().optional(),
  stock: z.preprocess((v) => Number(v), z.number().int().min(0)),
  is_active: z.boolean(),
  is_featured: z.boolean(),
})

type FormValues = {
  name: string
  slug: string
  description?: string
  composition?: string
  measurements?: string
  model_info?: string
  price: number
  category_id?: string
  stock: number
  is_active: boolean
  is_featured: boolean
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageEntry =
  | { type: "existing"; url: string }
  | { type: "new"; file: File; preview: string }

interface VariantGroup {
  key: string   // e.g. "Size"
  value: string // comma-separated, e.g. "S, M, L, XL"
}

export interface ProductFormProps {
  categories: Category[]
  initialData?: Product
  mode: "create" | "edit"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function parseVariants(variants: Record<string, string[]>): VariantGroup[] {
  return Object.entries(variants).map(([key, vals]) => ({
    key,
    value: vals.join(", "),
  }))
}

function buildVariants(groups: VariantGroup[]): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const g of groups) {
    const key = g.key.trim()
    if (!key) continue
    result[key] = g.value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return result
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductForm({ categories, initialData, mode }: ProductFormProps) {
  const router = useRouter()
  const { currency } = storeConfig.delivery

  // Slug auto-generation: track whether the slug was manually edited
  const [slugManual, setSlugManual] = useState(mode === "edit")

  // Material field (stored as variants.material)
  const materialKey = initialData
    ? Object.keys(initialData.variants).find((k) => /^(material|materials|fabric)$/i.test(k))
    : undefined
  const [material, setMaterial] = useState(
    materialKey ? (initialData!.variants[materialKey] ?? []).join(", ") : ""
  )

  // Variant groups state — exclude material and size_guide keys (handled separately)
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>(
    initialData
      ? parseVariants(
          Object.fromEntries(
            Object.entries(initialData.variants).filter(
              ([k]) => !/^(material|materials|fabric|size_guide)$/i.test(k)
            )
          )
        )
      : []
  )

  // Size guide rows state
  interface SizeRow { size: string; col2: string; col3: string; col4: string }
  const [sizeGuideRows, setSizeGuideRows] = useState<SizeRow[]>(() => {
    const raw = initialData?.variants?.["size_guide"]
    if (!raw || raw.length === 0) return []
    const start = raw[0]?.startsWith("HEADER:") ? 1 : 0
    return raw.slice(start).map((r) => {
      const [size, col2, col3, col4] = r.split("|")
      return { size: size ?? "", col2: col2 ?? "", col3: col3 ?? "", col4: col4 ?? "" }
    })
  })
  const [sizeGuideHeaders, setSizeGuideHeaders] = useState<[string, string, string, string]>(() => {
    const raw = initialData?.variants?.["size_guide"]
    if (raw && raw[0]?.startsWith("HEADER:")) {
      const parts = raw[0].replace("HEADER:", "").split("|")
      return [parts[0] ?? "Size", parts[1] ?? "Bust (cm)", parts[2] ?? "Waist (cm)", parts[3] ?? "Hips (cm)"]
    }
    return ["Size", "Bust (cm)", "Waist (cm)", "Hips (cm)"]
  })

  // Variant stock state
  const [variantStock, setVariantStock] = useState<Record<string, number>>(
    (initialData?.variant_stock as Record<string, number> | null) ?? {}
  )

  // Per-color stock state (separate from combination-based variant_stock)
  const [stockByVariant, setStockByVariant] = useState<Record<string, number>>(
    (initialData?.stock_by_variant as Record<string, number> | null) ?? {}
  )

  // Images state: mix of existing URLs and new local files
  const [images, setImages] = useState<ImageEntry[]>(
    initialData
      ? initialData.images.map((url) => ({ type: "existing", url }))
      : []
  )
  const [imageError, setImageError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Color → Image mapping state
  const [colorImages, setColorImages] = useState<Record<string, string>>(
    (initialData?.color_images as Record<string, string> | null) ?? {}
  )

  // Color hex → human-readable display name (e.g. { "#FF0000": "Red" })
  const [colorNames, setColorNames] = useState<Record<string, string>>(
    (initialData?.color_names as Record<string, string> | null) ?? {}
  )

  // ── Form setup ──
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      composition: initialData?.composition ?? "",
      measurements: initialData?.measurements ?? "",
      model_info: initialData?.model_info ?? "",
      price: initialData?.price ?? 0,
      category_id: initialData?.category_id ?? "",
      stock: initialData?.stock ?? 0,
      is_active: initialData?.is_active ?? true,
      is_featured: initialData?.is_featured ?? false,
    },
  })

  const nameValue = watch("name")
  const slugValue = watch("slug")
  const isActive = watch("is_active")
  const isFeatured = watch("is_featured")

  // Auto-generate slug from name (unless manually overridden)
  useEffect(() => {
    if (!slugManual && nameValue) {
      setValue("slug", slugify(nameValue), { shouldValidate: true })
    }
  }, [nameValue, slugManual, setValue])

  // ── Image handling ──

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null)
    const files = Array.from(e.target.files ?? [])
    const remaining = 5 - images.length
    if (files.length > remaining) {
      setImageError(`You can upload up to 5 images total. ${remaining} slot(s) remaining.`)
      return
    }
    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setImageError("Only JPG, PNG, and WebP images are accepted.")
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setImageError("Each image must be under 5 MB.")
        return
      }
    }
    const newEntries: ImageEntry[] = files.map((file) => ({
      type: "new",
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages((prev) => [...prev, ...newEntries])
    e.target.value = "" // reset input so same file can be re-selected
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const entry = prev[index]
      if (entry.type === "new") URL.revokeObjectURL(entry.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  function moveImage(from: number, to: number) {
    setImages((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  async function uploadNewImages(): Promise<string[]> {
    const results: string[] = []
    for (const entry of images) {
      if (entry.type === "existing") {
        results.push(entry.url)
      } else {
        const { data, error } = await clientApi.uploadImage(entry.file)
        if (error || !data) throw new Error(error ?? "Upload failed")
        results.push(data.url)
      }
    }
    return results
  }

  // ── Variant handlers ──

  function addVariantGroup() {
    setVariantGroups((prev) => [...prev, { key: "", value: "" }])
  }

  function updateVariantKey(index: number, key: string) {
    setVariantGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, key } : g))
    )
  }

  function updateVariantValue(index: number, value: string) {
    setVariantGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, value } : g))
    )
  }

  function removeVariantGroup(index: number) {
    setVariantGroups((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Submit ──

  async function onSubmit(values: FormValues) {
    setImageError(null)
    setUploading(true)

    let imageUrls: string[]
    try {
      imageUrls = await uploadNewImages()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Image upload failed."
      setImageError(message)
      useToastStore.getState().addToast(message, "error")
      setUploading(false)
      return
    }

    setUploading(false)
    const variants = buildVariants(variantGroups)
    if (material.trim()) {
      variants["material"] = material.split(",").map((v) => v.trim()).filter(Boolean)
    }
    if (sizeGuideRows.length > 0) {
      const headerRow = `HEADER:${sizeGuideHeaders.join("|")}`
      variants["size_guide"] = [
        headerRow,
        ...sizeGuideRows
          .filter((r) => r.size.trim())
          .map((r) => `${r.size}|${r.col2}|${r.col3}|${r.col4}`),
      ]
    }

    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description?.trim() || null,
      composition: values.composition?.trim() || null,
      measurements: values.measurements?.trim() || null,
      model_info: values.model_info?.trim() || null,
      price: values.price,
      category_id: values.category_id || null,
      stock: values.stock,
      is_active: values.is_active,
      is_featured: values.is_featured,
      variants,
      images: imageUrls,
      variant_stock: Object.keys(variantStock).length > 0 ? variantStock : null,
      stock_by_variant:
        Object.keys(stockByVariant).length > 0 ? stockByVariant : {},
      color_images: Object.keys(colorImages).length > 0 ? colorImages : null,
      color_names: Object.keys(colorNames).length > 0 ? colorNames : {},
      // If variant_stock is set, total stock = sum of all variant stocks
      ...(Object.keys(variantStock).length > 0
        ? { stock: Object.values(variantStock).reduce((s, v) => s + v, 0) }
        : {}),
    }

    if (mode === "create") {
      const { error } = await clientApi.createProduct(payload)
      if (error) {
        setImageError(error)
        useToastStore.getState().addToast(error, "error")
        return
      }
    } else {
      const { error } = await clientApi.updateProduct(initialData!.id, payload)
      if (error) {
        setImageError(error)
        useToastStore.getState().addToast(error, "error")
        return
      }

      // Detect stock 0 → positive transition and notify the waitlist
      const prevStock = initialData!.stock ?? 0
      const newStock = (payload.stock as number | undefined) ?? values.stock ?? 0
      if (prevStock === 0 && newStock > 0) {
        try {
          const res = await fetch("/api/stock-notify/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: initialData!.id }),
          })
          const json = await res.json().catch(() => ({}))
          if (res.ok && typeof json.sent === "number" && json.sent > 0) {
            useToastStore
              .getState()
              .addToast(
                `Notified ${json.sent} subscriber${json.sent === 1 ? "" : "s"} that this product is back in stock`,
                "success"
              )
          }
        } catch {
          // Non-blocking — the product still saved; surface a soft warning
          useToastStore
            .getState()
            .addToast("Saved, but failed to send back-in-stock emails", "info")
        }
      }
    }

    useToastStore.getState().addToast("Product saved successfully", "success")
    router.push("/admin/products?success=true")
    router.refresh()
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const saving = isSubmitting || uploading

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">

      {/* ── Name + Slug ── */}
      <Section title="Basic Info">
        <Field label="Product Name" error={errors.name?.message}>
          <input
            {...register("name")}
            type="text"
            placeholder="e.g. Silk Evening Dress"
            className={input(!!errors.name)}
          />
        </Field>

        <Field label="Slug (URL-safe identifier)" error={errors.slug?.message}>
          <input
            {...register("slug")}
            type="text"
            placeholder="silk-evening-dress"
            className={input(!!errors.slug)}
            onChange={(e) => {
              setSlugManual(true)
              setValue("slug", e.target.value, { shouldValidate: true })
            }}
          />
          {slugValue && (
            <p className="text-xs text-gray-400 mt-1">
              Preview: <span className="font-mono">/shop/{slugValue}</span>
              {!slugManual && (
                <button
                  type="button"
                  className="ml-3 text-gray-400 underline"
                  onClick={() => setSlugManual(true)}
                >
                  Edit manually
                </button>
              )}
            </p>
          )}
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe the product…"
            className={input(false)}
          />
        </Field>

        <Field label="Composition" error={errors.composition?.message}>
          <textarea
            {...register("composition")}
            rows={3}
            placeholder="e.g. 95% Cotton, 5% Elastane"
            className={input(false)}
          />
        </Field>

        <Field label="Measurements" error={errors.measurements?.message}>
          <textarea
            {...register("measurements")}
            rows={3}
            placeholder="e.g. Length: 120cm, Bust: 92cm, Waist: 76cm"
            className={input(false)}
          />
        </Field>

        <Field label="Model Info" error={undefined}>
          <input
            {...register("model_info")}
            type="text"
            placeholder="The model is wearing size M, model height is 175cm"
            className={input(false)}
          />
        </Field>
      </Section>

      {/* ── Pricing & Inventory ── */}
      <Section title="Pricing & Inventory">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={`Price (${currency})`} error={errors.price?.message}>
            <input
              {...register("price")}
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              className={input(!!errors.price)}
            />
          </Field>

          <Field label="Stock" error={errors.stock?.message}>
            <input
              {...register("stock")}
              type="number"
              min={0}
              step={1}
              placeholder="0"
              className={input(!!errors.stock)}
            />
          </Field>
        </div>
      </Section>

      {/* ── Category ── */}
      <Section title="Category">
        <Field label="Category" error={undefined}>
          <select {...register("category_id")} className={input(false)}>
            <option value="">— No category —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* ── Variants ── */}
      <Section title="Variants">
        <Field label="Material / Fabric" error={undefined}>
          <input
            type="text"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="e.g. 100% Silk, Lining: 95% Polyester"
            className={input(false)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Shown in the &quot;Material &amp; Care&quot; section on the product page.
          </p>
        </Field>

        <p className="text-xs text-gray-400 mb-2">
          Add variant groups (e.g. &quot;Size&quot;, &quot;Color&quot;). For Color groups, use the color pickers below.
        </p>

        <div className="space-y-4">
          {variantGroups.map((group, i) => {
            const isColor = /colou?r/i.test(group.key)
            return (
              <div key={i} className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="w-full sm:w-32 shrink-0">
                  <input
                    type="text"
                    value={group.key}
                    onChange={(e) => updateVariantKey(i, e.target.value)}
                    placeholder="Group name"
                    className={`${input(false)} text-sm`}
                  />
                </div>
                <div className="flex-1 w-full">
                  {isColor ? (
                    <ColorPickerField
                      value={group.value}
                      onChange={(v) => updateVariantValue(i, v)}
                      stockMap={stockByVariant}
                      setStockMap={setStockByVariant}
                      nameMap={colorNames}
                      setNameMap={setColorNames}
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        value={group.value}
                        onChange={(e) => updateVariantValue(i, e.target.value)}
                        placeholder="S, M, L, XL"
                        className={`${input(false)} text-sm`}
                      />
                      {group.value && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {group.value.split(",").map((v) => v.trim()).filter(Boolean).map((v) => (
                            <span key={v} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "var(--color-accent)" }}>
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeVariantGroup(i)}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                  aria-label="Remove variant group"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addVariantGroup}
          className="mt-4 text-xs uppercase tracking-wider font-medium border px-4 py-2 min-h-[44px] transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
        >
          + Add Variant Group
        </button>
      </Section>

      {/* ── Size Guide ── */}
      <Section title="Size Guide">
        <p className="text-xs text-gray-400 mb-3">
          Editable size chart shown on the product page. Leave empty to use the default chart or hide it.
        </p>

        {/* Scrollable table editor */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: 420 }}>
            {/* Column headers */}
            <div className="flex gap-2 mb-2 items-center">
              {sizeGuideHeaders.map((h, i) => (
                <input
                  key={i}
                  type="text"
                  value={h}
                  onChange={(e) => {
                    const next = [...sizeGuideHeaders] as [string, string, string, string]
                    next[i] = e.target.value
                    setSizeGuideHeaders(next)
                  }}
                  className="flex-1 border px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-[var(--color-accent)] bg-[var(--color-primary)] text-white placeholder:text-white/40"
                  placeholder={["Size", "Col 2", "Col 3", "Col 4"][i]}
                />
              ))}
              {/* spacer to align with row delete button */}
              <div className="shrink-0 w-8" />
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {sizeGuideRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  {(["size", "col2", "col3", "col4"] as const).map((field) => (
                    <input
                      key={field}
                      type="text"
                      value={row[field]}
                      onChange={(e) => {
                        const next = [...sizeGuideRows]
                        next[i] = { ...next[i], [field]: e.target.value }
                        setSizeGuideRows(next)
                      }}
                      className="flex-1 border px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-accent)] bg-white"
                      style={{ borderColor: "#e5e7eb" }}
                      placeholder={field === "size" ? "e.g. M" : "e.g. 88–92"}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setSizeGuideRows((prev) => prev.filter((_, j) => j !== i))}
                    className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                    aria-label="Remove row"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSizeGuideRows((prev) => [...prev, { size: "", col2: "", col3: "", col4: "" }])}
          className="mt-3 text-xs uppercase tracking-wider font-medium border px-4 py-2 min-h-[40px] transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
        >
          + Add Row
        </button>

        {sizeGuideRows.length > 0 && (
          <button
            type="button"
            onClick={() => setSizeGuideRows([])}
            className="mt-2 ml-3 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Clear all rows
          </button>
        )}
      </Section>

      {/* ── Variant Stock — colors only ── */}
      {(() => {
        // Only build per-color stock rows. Other variant dimensions (Size, etc.)
        // are excluded so the table stays focused and small.
        const activeGroups = variantGroups.filter(
          (g) =>
            g.key.trim() &&
            g.value.trim() &&
            /colou?r/i.test(g.key.trim())
        )
        if (activeGroups.length === 0) return null

        const keys = activeGroups.map((g) => g.key.trim())
        const options = activeGroups.map((g) =>
          g.value.split(",").map((v) => v.trim()).filter(Boolean)
        )
        const combinations = cartesian(options)

        return (
          <Section title="Stock per Variant">
            <p className="text-xs text-gray-400 mb-3">
              Set stock for each variant combination. Total stock is calculated automatically.
              Leave all at 0 to use the single stock number above.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: 300 }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                    {keys.map((k) => (
                      <th key={k} className="px-3 py-2 text-left text-xs uppercase tracking-wider font-semibold">
                        {k}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider font-semibold w-24">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map((combo, i) => {
                    const stockKey = combo.join("|")
                    return (
                      <tr key={stockKey} style={{ backgroundColor: i % 2 === 0 ? "rgba(42,61,46,0.03)" : "transparent" }}>
                        {combo.map((val, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700">{val}</td>
                        ))}
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={variantStock[stockKey] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0)
                              setVariantStock((prev) => ({ ...prev, [stockKey]: val }))
                            }}
                            className="w-20 border px-2 py-1 text-sm focus:outline-none focus:border-[var(--color-accent)] bg-white"
                            style={{ borderColor: "#e5e7eb" }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {Object.keys(variantStock).length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Total stock: <span className="font-semibold">{Object.values(variantStock).reduce((s, v) => s + v, 0)}</span>
              </p>
            )}
          </Section>
        )
      })()}

      {/* ── Images ── */}
      <Section title="Images">
        <p className="text-xs text-gray-400 mb-4">
          Up to 5 images. First image is the main image. Drag to reorder (use ← → buttons).
          Accepted: JPG, PNG, WebP. Max 5 MB each.
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          {images.map((entry, i) => {
            const src = entry.type === "existing" ? entry.url : entry.preview
            return (
              <div key={i} className="relative group w-24 aspect-[3/4] bg-gray-100 overflow-hidden border" style={{ borderColor: "#e5e7eb" }}>
                <Image src={src} alt={`Image ${i + 1}`} fill className="object-cover" sizes="96px" />

                {/* Badge */}
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] uppercase tracking-wider font-bold text-white px-1.5 py-0.5"
                    style={{ backgroundColor: "var(--color-accent)" }}>
                    Main
                  </span>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0}
                      className="text-white text-xs bg-white/20 hover:bg-white/40 px-1.5 py-0.5 rounded disabled:opacity-30">
                      ←
                    </button>
                    <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === images.length - 1}
                      className="text-white text-xs bg-white/20 hover:bg-white/40 px-1.5 py-0.5 rounded disabled:opacity-30">
                      →
                    </button>
                  </div>
                  <button type="button" onClick={() => removeImage(i)}
                    className="text-white text-xs bg-red-500/80 hover:bg-red-500 px-2 py-0.5 rounded">
                    Remove
                  </button>
                </div>
              </div>
            )
          })}

          {/* Add image slot */}
          {images.length < 5 && (
            <label className="w-24 aspect-[3/4] border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              style={{ borderColor: "#d1d5db" }}>
              <span className="text-gray-300 text-3xl leading-none select-none">+</span>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          )}
        </div>

        {imageError && <p className="text-xs text-red-500">{imageError}</p>}
      </Section>

      {/* ── Color Images ── */}
      {(() => {
        const colorKey = variantGroups.find((g) => /colou?r/i.test(g.key.trim()))
        const colors = colorKey
          ? colorKey.value.split(",").map((v) => v.trim()).filter(Boolean)
          : []
        const uploadedUrls = images.map((e) => e.type === "existing" ? e.url : e.preview)
        if (colors.length === 0 || uploadedUrls.length === 0) return null
        return (
          <Section title="Color Images">
            <p className="text-xs text-gray-400 mb-4">
              Click an image to assign it to each color. Customers will see that image when they hover the color swatch.
            </p>
            <div className="space-y-4">
              {colors.map((color) => (
                <div key={color}>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--color-primary)" }}>
                    {color}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uploadedUrls.map((url, i) => {
                      const isSelected = colorImages[color] === url
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setColorImages((prev) =>
                              isSelected
                                ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== color))
                                : { ...prev, [color]: url }
                            )
                          }
                          className="relative w-16 aspect-[3/4] overflow-hidden border-2 transition-all"
                          style={{ borderColor: isSelected ? "var(--color-accent)" : "#e5e7eb" }}
                        >
                          <Image src={url} alt={color} fill className="object-cover" sizes="64px" />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )
      })()}

      {/* ── Visibility ── */}
      <Section title="Visibility">
        <div className="space-y-4">
          <ToggleField
            label="Active"
            description="Visible to customers in the shop"
            checked={isActive}
            onChange={(v) => setValue("is_active", v)}
          />
          <ToggleField
            label="Featured"
            description="Shown in the Featured section on the homepage"
            checked={isFeatured}
            onChange={(v) => setValue("is_featured", v)}
          />
        </div>
      </Section>

      {/* ── Submit ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-8 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-primary)", minHeight: "48px" }}
        >
          {saving
            ? uploading
              ? "Uploading images…"
              : "Saving…"
            : mode === "create"
              ? "Create Product"
              : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="flex items-center justify-center min-h-[44px] px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors border border-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border p-4 sm:p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
      <h2
        className="text-xs uppercase tracking-widest font-semibold text-gray-400 border-b pb-3"
        style={{ borderColor: "#f3f4f6" }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
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

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
          {label}
        </p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
        style={{ backgroundColor: checked ? "var(--color-accent)" : "#d1d5db" }}
        aria-checked={checked}
        role="switch"
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  )
}

function input(hasError: boolean) {
  return [
    "w-full border px-3 text-base focus:outline-none transition-colors bg-white",
    hasError
      ? "border-red-400"
      : "border-gray-300 focus:border-gray-600",
  ].join(" ") + " min-h-[48px]"
}

function ColorPickerField({
  value,
  onChange,
  stockMap,
  setStockMap,
  nameMap,
  setNameMap,
}: {
  value: string
  onChange: (v: string) => void
  stockMap?: Record<string, number>
  setStockMap?: (next: Record<string, number>) => void
  nameMap?: Record<string, string>
  setNameMap?: (next: Record<string, string>) => void
}) {
  const colors = value.split(",").map((c) => c.trim()).filter(Boolean)

  function updateColor(index: number, hex: string) {
    const oldHex = colors[index]
    const next = [...colors]
    next[index] = hex
    onChange(next.join(", "))

    // Migrate stock entry to the new hex key
    if (stockMap && setStockMap && oldHex && oldHex !== hex && oldHex in stockMap) {
      const nextMap = { ...stockMap }
      nextMap[hex] = nextMap[oldHex]
      delete nextMap[oldHex]
      setStockMap(nextMap)
    }

    // Migrate display-name entry to the new hex key
    if (nameMap && setNameMap && oldHex && oldHex !== hex && oldHex in nameMap) {
      const nextMap = { ...nameMap }
      nextMap[hex] = nextMap[oldHex]
      delete nextMap[oldHex]
      setNameMap(nextMap)
    }
  }

  function addColor() {
    onChange([...colors, "#000000"].join(", "))
  }

  function removeColor(index: number) {
    const removed = colors[index]
    onChange(colors.filter((_, i) => i !== index).join(", "))
    if (stockMap && setStockMap && removed && removed in stockMap) {
      const nextMap = { ...stockMap }
      delete nextMap[removed]
      setStockMap(nextMap)
    }
    if (nameMap && setNameMap && removed && removed in nameMap) {
      const nextMap = { ...nameMap }
      delete nextMap[removed]
      setNameMap(nextMap)
    }
  }

  function setStock(hex: string, raw: string) {
    if (!stockMap || !setStockMap) return
    const nextMap = { ...stockMap }
    if (raw === "") {
      delete nextMap[hex]
    } else {
      const n = Math.max(0, parseInt(raw, 10) || 0)
      nextMap[hex] = n
    }
    setStockMap(nextMap)
  }

  function setName(hex: string, raw: string) {
    if (!nameMap || !setNameMap) return
    const nextMap = { ...nameMap }
    const trimmed = raw.trim()
    if (trimmed === "") delete nextMap[hex]
    else nextMap[hex] = raw // preserve user spacing in input; trim on save
    setNameMap(nextMap)
  }

  const showStockInputs = !!stockMap && !!setStockMap
  const showNameInputs = !!nameMap && !!setNameMap

  return (
    <div className="flex flex-wrap items-start gap-3 min-h-[48px] border border-gray-300 px-3 py-3 bg-white">
      {colors.map((color, i) => (
        <div key={i} className="relative group flex flex-col items-center gap-1">
          <label
            className="relative w-9 h-9 rounded-full overflow-hidden cursor-pointer border-2 transition-transform hover:scale-110"
            style={{ borderColor: "#d1d5db" }}
            title={(nameMap?.[color] ?? "").trim() || color}
          >
            <span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => updateColor(i, e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
          <span className="text-[9px] font-mono text-gray-400 leading-none">{color}</span>
          {showNameInputs && (
            <input
              type="text"
              value={nameMap?.[color] ?? ""}
              onChange={(e) => setName(color, e.target.value)}
              placeholder="name"
              aria-label={`Display name for ${color}`}
              title="What customers see for this color (e.g. Burgundy)"
              className="w-20 border px-1 py-0.5 text-[10px] text-center focus:outline-none focus:border-[var(--color-accent)] bg-white"
              style={{ borderColor: "#e5e7eb" }}
              maxLength={32}
            />
          )}
          {showStockInputs && (
            <input
              type="number"
              min={0}
              step={1}
              value={stockMap![color] ?? ""}
              onChange={(e) => setStock(color, e.target.value)}
              placeholder="qty"
              aria-label={`Stock for ${color}`}
              title={`Stock for ${color}`}
              className="w-20 border px-1 py-0.5 text-[10px] text-center focus:outline-none focus:border-[var(--color-accent)] bg-white"
              style={{ borderColor: "#e5e7eb" }}
            />
          )}
          <button
            type="button"
            onClick={() => removeColor(i)}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
            aria-label="Remove color"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addColor}
        className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors text-lg leading-none mt-0.5"
        style={{ borderColor: "#d1d5db" }}
        aria-label="Add color"
      >
        +
      </button>
    </div>
  )
}

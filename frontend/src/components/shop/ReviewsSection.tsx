import { createClient } from "@/lib/supabase/server"
import Stars from "@/components/shop/Stars"
import ReviewForm from "@/components/shop/ReviewForm"
import type { Review } from "@/types"

interface ReviewsSectionProps {
  productId: string
}

export default async function ReviewsSection({ productId }: ReviewsSectionProps) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  const reviews = (data ?? []) as Review[]
  const count = reviews.length
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  const avg = count > 0 ? sum / count : 0

  // Bucket counts for breakdown bars (5 → 1)
  const buckets: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) buckets[r.rating] += 1
  }

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24"
      style={{ borderTop: "1px solid var(--divider-soft)" }}
    >
      <div className="section-title mb-12 md:mb-16">
        <h2
          className="text-[28px] md:text-[40px]"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Customer Reviews
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16">
        {/* ── Aggregate column ── */}
        <div className="md:col-span-2 space-y-8">
          {count === 0 ? (
            <div
              className="rounded-card p-8 card-shadow"
              style={{ backgroundColor: "#ffffff" }}
            >
              <p
                className="text-base"
                style={{ color: "rgba(61,20,25,0.55)", lineHeight: 1.8 }}
              >
                No reviews yet — be the first to review this product.
              </p>
            </div>
          ) : (
            <>
              <div
                className="rounded-card p-8 card-shadow"
                style={{ backgroundColor: "#ffffff" }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <Stars value={avg} size={24} ariaLabelValue={avg} />
                  <span
                    className="price-text text-3xl"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {avg.toFixed(1)}
                  </span>
                </div>
                <p
                  className="text-[11px] uppercase"
                  style={{ color: "rgba(61,20,25,0.5)", letterSpacing: "0.18em" }}
                >
                  {count} {count === 1 ? "review" : "reviews"}
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const c = buckets[star]
                  const pct = count > 0 ? (c / count) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span
                        className="w-12 shrink-0 text-[11px] font-medium"
                        style={{
                          color: "var(--color-primary)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {star} ★
                      </span>
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(61,20,25,0.08)" }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: "var(--color-accent)",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <span
                        className="w-8 shrink-0 text-right text-xs tabular-nums"
                        style={{ color: "rgba(61,20,25,0.55)" }}
                      >
                        {c}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Reviews list ── */}
        <div className="md:col-span-3 space-y-8 md:space-y-10">
          {reviews.length === 0 ? null : (
            <ul className="space-y-8 md:space-y-10">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="pb-8 md:pb-10"
                  style={{ borderBottom: "1px solid var(--divider-soft)" }}
                >
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <Stars value={r.rating} size={14} ariaLabelValue={r.rating} />
                    <span
                      className="text-sm"
                      style={{
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {r.display_name}
                    </span>
                    <span
                      className="text-[10px] uppercase ml-auto"
                      style={{
                        color: "rgba(61,20,25,0.4)",
                        letterSpacing: "0.18em",
                      }}
                    >
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p
                    className="text-base whitespace-pre-line"
                    style={{ color: "rgba(61,20,25,0.75)", lineHeight: 1.8 }}
                  >
                    {r.review_text}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <ReviewForm productId={productId} />
        </div>
      </div>
    </section>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

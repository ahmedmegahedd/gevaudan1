import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import PromoCodesClient from "./PromoCodesClient"
import type { PromoCode } from "@/types"

export const dynamic = "force-dynamic"

export default async function PromoCodesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            Promo Codes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.length ?? 0} codes total</p>
        </div>
        <Link
          href="/admin/promo-codes/new"
          className="px-5 h-10 flex items-center text-xs uppercase tracking-wider font-semibold text-white rounded-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          + New Promo Code
        </Link>
      </div>

      <PromoCodesClient codes={(data ?? []) as PromoCode[]} />
    </div>
  )
}

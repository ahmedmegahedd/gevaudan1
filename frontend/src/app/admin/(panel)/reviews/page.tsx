import { createClient } from "@/lib/supabase/server"
import ReviewsAdminClient from "./ReviewsAdminClient"
import type { Review } from "@/types"

export const dynamic = "force-dynamic"

export const metadata = { title: "Reviews" }

export default async function ReviewsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("reviews")
    .select("*, product:products(name, slug)")
    .order("created_at", { ascending: false })

  return <ReviewsAdminClient reviews={(data as Review[]) ?? []} />
}

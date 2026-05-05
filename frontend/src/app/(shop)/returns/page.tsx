import type { Metadata } from "next"
import { storeConfig } from "@/config/store.config"
import { createClient } from "@/lib/supabase/server"
import ReturnsClient from "./ReturnsClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Returns & Exchange | ${storeConfig.brand.name}`,
  description: `Start a return or exchange for your ${storeConfig.brand.name} order.`,
}

export default async function ReturnsPage() {
  const supabase = await createClient()

  // Fetch every in-stock active product so the customer can pick one for an exchange
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, price, images, stock")
    .eq("is_active", true)
    .gt("stock", 0)
    .order("name")

  const exchangeProducts = (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    slug: p.slug as string,
    price: p.price as number,
    images: (p.images ?? []) as string[],
  }))

  return <ReturnsClient exchangeProducts={exchangeProducts} />
}

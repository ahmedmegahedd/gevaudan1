import { redirect } from "next/navigation"
import PaymobIframe from "./PaymobIframe"

export const dynamic = "force-dynamic"

export const metadata = { title: "Payment" }

interface Props {
  searchParams: { orderId?: string }
}

export default function PaymentPage({ searchParams }: Props) {
  const orderId = searchParams.orderId
  if (!orderId) redirect("/checkout")
  return <PaymobIframe orderId={orderId} />
}

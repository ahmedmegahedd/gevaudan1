import { OrderTableSkeleton } from "@/components/ui/Skeleton"
export default function OrdersLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="h-8 w-32 bg-gray-200 animate-pulse mb-6" />
      <div className="bg-white border" style={{ borderColor: "#e5e7eb" }}>
        <OrderTableSkeleton rows={8} />
      </div>
    </div>
  )
}

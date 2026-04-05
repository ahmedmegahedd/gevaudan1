import { Suspense } from "react"
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard"

export const metadata = { title: "Analytics" }

function AnalyticsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 animate-pulse rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-sm" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 animate-pulse rounded-sm" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 bg-gray-200 animate-pulse rounded-sm" />
        <div className="h-48 bg-gray-200 animate-pulse rounded-sm" />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsDashboard />
    </Suspense>
  )
}

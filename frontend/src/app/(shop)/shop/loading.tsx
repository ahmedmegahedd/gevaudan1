import { ProductGridSkeleton } from "@/components/ui/Skeleton"

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-10 w-32 bg-gray-200 animate-pulse mb-8" />
      <div className="flex gap-10">
        <div className="w-56 space-y-4">
          <div className="h-4 w-24 bg-gray-200 animate-pulse" />
          {[1,2,3,4].map(i => <div key={i} className="h-4 w-20 bg-gray-200 animate-pulse" />)}
        </div>
        <div className="flex-1">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}

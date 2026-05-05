import { ProductGridSkeleton } from "@/components/ui/Skeleton"

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24">
      <div className="text-center mb-12 md:mb-20">
        <div className="h-14 w-40 bg-gray-200/40 animate-pulse mx-auto mb-4" />
        <div className="h-4 w-80 max-w-full bg-gray-200/40 animate-pulse mx-auto" />
      </div>
      <div className="flex flex-col md:flex-row gap-12 md:gap-16">
        <div className="w-64 space-y-4 hidden md:block">
          <div className="h-3 w-24 bg-gray-200/40 animate-pulse" />
          {[1,2,3,4].map(i => <div key={i} className="h-4 w-32 bg-gray-200/40 animate-pulse" />)}
        </div>
        <div className="flex-1">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}

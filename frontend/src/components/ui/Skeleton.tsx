// A flexible skeleton component for loading states
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ backgroundColor: "rgba(61,20,25,0.06)" }}
      aria-hidden="true"
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-card overflow-hidden card-shadow"
      style={{ backgroundColor: "#ffffff" }}
    >
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 lg:gap-20">
        <div className="md:col-span-3 space-y-5">
          <Skeleton className="aspect-[3/4] w-full rounded-card" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="w-24 aspect-square rounded-[2px]" />)}
          </div>
        </div>
        <div className="md:col-span-2 space-y-8">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[52px] w-full rounded-[2px]" />
        </div>
      </div>
    </div>
  )
}

export function OrderTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      ))}
    </div>
  )
}

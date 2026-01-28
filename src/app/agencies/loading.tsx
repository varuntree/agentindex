import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function AgenciesLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <Skeleton height="20px" width="100px" className="mb-6" />

      {/* Title skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-6">
        <Skeleton height="40px" width="400px" />
        <Skeleton height="20px" width="100px" />
      </div>

      {/* State filter tabs skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} height="40px" width="60px" rounded="rounded-full" />
        ))}
      </div>

      {/* Agency grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </main>
  );
}

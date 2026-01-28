import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function SuburbLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <Skeleton height="20px" width="280px" className="mb-6" />

      {/* Title skeleton */}
      <Skeleton height="40px" width="400px" className="mb-6" />

      {/* Market stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <Skeleton height="32px" width="100px" className="mb-2" />
            <Skeleton height="16px" width="120px" />
          </div>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton height="20px" width="120px" />
        <div className="flex gap-2">
          <Skeleton height="40px" width="100px" rounded="rounded-lg" />
          <Skeleton height="40px" width="100px" rounded="rounded-lg" />
        </div>
      </div>

      {/* Agent cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </main>
  );
}

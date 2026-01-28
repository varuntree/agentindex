import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function StateLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <Skeleton height="20px" width="200px" className="mb-6" />

      {/* Title skeleton */}
      <Skeleton height="40px" width="350px" className="mb-2" />
      <Skeleton height="20px" width="250px" className="mb-6" />

      {/* Search bar skeleton */}
      <Skeleton height="48px" width="100%" className="max-w-xl mb-8" rounded="rounded-lg" />

      {/* Suburb cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </main>
  );
}

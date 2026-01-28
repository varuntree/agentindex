import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function AgencyLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <Skeleton height="20px" width="200px" className="mb-6" />

      {/* Header skeleton */}
      <section className="mb-10">
        <Skeleton height="40px" width="320px" className="mb-4" />
        <div className="flex flex-wrap gap-4 mb-4">
          <Skeleton height="20px" width="140px" />
          <Skeleton height="20px" width="180px" />
          <Skeleton height="20px" width="100px" />
        </div>
        <Skeleton height="16px" width="300px" className="mb-6" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <Skeleton height="32px" width="80px" className="mb-2" />
              <Skeleton height="16px" width="100px" />
            </div>
          ))}
        </div>
      </section>

      {/* Agent Roster skeleton */}
      <section className="mb-10">
        <Skeleton height="28px" width="140px" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>

      {/* Recent Sales skeleton */}
      <section className="mb-10">
        <Skeleton height="28px" width="140px" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-200">
              <Skeleton height="20px" width="30%" />
              <Skeleton height="20px" width="15%" />
              <Skeleton height="20px" width="15%" />
              <Skeleton height="20px" width="15%" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

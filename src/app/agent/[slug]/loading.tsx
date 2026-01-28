import { Skeleton, SkeletonText, SkeletonAvatar } from "@/components/ui/skeleton";

export default function AgentLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <Skeleton height="20px" width="200px" className="mb-6" />

      {/* Header skeleton */}
      <section className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10">
        <SkeletonAvatar size="lg" className="w-[200px] h-[200px]" />
        <div className="flex-1 min-w-0">
          <Skeleton height="40px" width="280px" className="mb-2" />
          <Skeleton height="20px" width="200px" className="mb-4" />
          <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton height="28px" width="140px" rounded="rounded-full" />
            <Skeleton height="28px" width="100px" rounded="rounded-full" />
          </div>
          <div className="flex flex-wrap gap-4">
            <Skeleton height="20px" width="180px" />
            <Skeleton height="20px" width="140px" />
            <Skeleton height="36px" width="160px" rounded="rounded-lg" />
          </div>
        </div>
      </section>

      {/* Performance Stats skeleton */}
      <section className="mb-10">
        <Skeleton height="28px" width="180px" className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <Skeleton height="32px" width="80px" className="mb-2" />
              <Skeleton height="16px" width="100px" />
            </div>
          ))}
        </div>
      </section>

      {/* Suburbs skeleton */}
      <section className="mb-10">
        <Skeleton height="28px" width="160px" className="mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="32px" width={`${80 + i * 20}px`} rounded="rounded-full" />
          ))}
        </div>
      </section>

      {/* Sales History skeleton */}
      <section className="mb-10">
        <Skeleton height="28px" width="140px" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-200">
              <Skeleton height="20px" width="40%" />
              <Skeleton height="20px" width="15%" />
              <Skeleton height="20px" width="15%" />
              <Skeleton height="20px" width="10%" />
              <Skeleton height="20px" width="10%" />
            </div>
          ))}
        </div>
      </section>

      {/* Reviews skeleton */}
      <section className="mb-10">
        <Skeleton height="28px" width="100px" className="mb-4" />
        <SkeletonText lines={4} />
      </section>
    </main>
  );
}

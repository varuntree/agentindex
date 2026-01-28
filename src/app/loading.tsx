import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="bg-dots py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Skeleton height="64px" width="80%" className="mx-auto mb-4" />
          <Skeleton height="24px" width="60%" className="mx-auto mb-8" />
          <Skeleton height="56px" width="100%" className="max-w-2xl mx-auto" rounded="rounded-lg" />
        </div>
      </section>

      {/* Featured suburbs skeleton */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <Skeleton height="40px" width="300px" className="mx-auto mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>

      {/* How it works skeleton */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto">
          <Skeleton height="40px" width="240px" className="mx-auto mb-12" />
          <div className="grid md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton width="56px" height="56px" rounded="rounded-full" className="mx-auto mb-4" />
                <Skeleton height="24px" width="120px" className="mx-auto mb-2" />
                <SkeletonText lines={2} className="max-w-xs mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="py-12 bg-black px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4">
              <Skeleton height="32px" width="80px" className="mb-2 bg-gray-700" />
              <Skeleton height="16px" width="100px" className="bg-gray-700" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

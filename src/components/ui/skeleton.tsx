interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

function Skeleton({
  width,
  height,
  rounded = "rounded",
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white border-2 border-black rounded-lg p-6 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton width="48px" height="48px" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton height="16px" width="60%" rounded="rounded" />
          <Skeleton height="12px" width="40%" rounded="rounded" />
        </div>
      </div>
      <Skeleton height="12px" rounded="rounded" />
      <Skeleton height="12px" width="80%" rounded="rounded" />
      <div className="flex gap-2 pt-2">
        <Skeleton height="32px" width="100px" rounded="rounded-lg" />
        <Skeleton height="32px" width="100px" rounded="rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height="12px"
          width={i === lines - 1 ? "60%" : "100%"}
          rounded="rounded"
        />
      ))}
    </div>
  );
}

function SkeletonAvatar({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = { sm: "40px", md: "64px", lg: "80px" };
  const dim = sizeMap[size];

  return (
    <Skeleton
      width={dim}
      height={dim}
      rounded="rounded-full"
      className={className}
    />
  );
}

export { Skeleton, SkeletonCard, SkeletonText, SkeletonAvatar, type SkeletonProps };

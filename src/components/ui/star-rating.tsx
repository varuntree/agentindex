import { Star } from "lucide-react";

type StarSize = "sm" | "md" | "lg";

interface StarRatingProps {
  rating: number;
  size?: StarSize;
  showValue?: boolean;
  className?: string;
}

const sizeMap: Record<StarSize, { icon: number; text: string }> = {
  sm: { icon: 14, text: "text-xs" },
  md: { icon: 18, text: "text-sm" },
  lg: { icon: 22, text: "text-base" },
};

function StarRating({
  rating,
  size = "md",
  showValue = false,
  className = "",
}: StarRatingProps) {
  const { icon: iconSize, text: textClass } = sizeMap[size];
  const clampedRating = Math.min(5, Math.max(0, rating));

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={`Rating: ${clampedRating.toFixed(1)} out of 5 stars`}
      role="img"
    >
      {Array.from({ length: 5 }, (_, i) => {
        const starIndex = i + 1;
        const filled = clampedRating >= starIndex;
        const halfFilled =
          !filled && clampedRating > i && clampedRating < starIndex;

        return (
          <span key={i} className="relative inline-block">
            {/* Background empty star */}
            <Star
              size={iconSize}
              className="text-gray-300"
              fill="currentColor"
              strokeWidth={0}
            />
            {/* Filled overlay */}
            {(filled || halfFilled) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{
                  width: filled ? "100%" : `${(clampedRating - i) * 100}%`,
                }}
              >
                <Star
                  size={iconSize}
                  className="text-voqo-green"
                  fill="currentColor"
                  strokeWidth={0}
                />
              </span>
            )}
          </span>
        );
      })}
      {showValue && (
        <span className={`ml-1 font-medium text-gray-700 ${textClass}`}>
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export { StarRating, type StarRatingProps };

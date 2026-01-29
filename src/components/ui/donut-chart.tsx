"use client";

interface DonutChartData {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  className?: string;
}

const DEFAULT_COLORS = ["#26C169", "#3B82F6", "#F97316", "#A855F7"];

function DonutChart({ data, size = 160, className = "" }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  const strokeWidth = size * 0.2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedOffset = 0;

  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const dashLength = percentage * circumference;
    const dashOffset = circumference - accumulatedOffset;
    accumulatedOffset += dashLength;

    return {
      ...item,
      percentage,
      dashLength,
      dashOffset,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    };
  });

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div
        className="relative border-2 border-black rounded-full bg-white"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.dashLength} ${circumference}`}
              strokeDashoffset={segment.dashOffset}
              className="transition-all duration-300"
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 border border-black"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-gray-700">
              {segment.label}{" "}
              <span className="font-bold text-black">
                {Math.round(segment.percentage * 100)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DonutChart, type DonutChartProps, type DonutChartData };

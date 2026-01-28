import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  className?: string;
}

function StatCard({ icon: Icon, value, label, trend, className = "" }: StatCardProps) {
  return (
    <div
      className={`bg-white border-2 border-black rounded-lg p-5 text-center ${className}`}
    >
      <Icon className="w-6 h-6 text-voqo-green mx-auto mb-2" />
      <div className="text-3xl font-black text-black">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {trend && (
        <div
          className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${
            trend.direction === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend.direction === "up" ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend.value}
        </div>
      )}
    </div>
  );
}

export { StatCard, type StatCardProps };

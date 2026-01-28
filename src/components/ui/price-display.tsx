import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatCompactPrice } from "@/lib/utils/format";

interface PriceDisplayProps {
  value: number;
  compact?: boolean;
  change?: number;
  className?: string;
}

function PriceDisplay({
  value,
  compact = false,
  change,
  className = "",
}: PriceDisplayProps) {
  const formatted = compact ? formatCompactPrice(value) : formatCurrency(value);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-bold">{formatted}</span>
      {change !== undefined && change !== 0 && (
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-medium ${
            change > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {change > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      )}
    </span>
  );
}

export { PriceDisplay, type PriceDisplayProps };

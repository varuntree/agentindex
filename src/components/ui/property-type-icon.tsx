import { Home, Building2, Trees, Building } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PropertyType = "house" | "unit" | "land" | "townhouse";

interface PropertyTypeIconProps {
  type: PropertyType;
  size?: number;
  label?: boolean;
  className?: string;
}

const iconMap: Record<PropertyType, LucideIcon> = {
  house: Home,
  unit: Building2,
  land: Trees,
  townhouse: Building,
};

const labelMap: Record<PropertyType, string> = {
  house: "House",
  unit: "Unit",
  land: "Land",
  townhouse: "Townhouse",
};

function PropertyTypeIcon({
  type,
  size = 18,
  label = false,
  className = "",
}: PropertyTypeIconProps) {
  const Icon = iconMap[type];
  const text = labelMap[type];

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Icon size={size} />
      {label && <span className="text-sm">{text}</span>}
    </span>
  );
}

export { PropertyTypeIcon, type PropertyTypeIconProps, type PropertyType };

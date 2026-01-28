import { Check } from "lucide-react";

type BadgeVariant =
  | "license"
  | "propertyType"
  | "reviewType"
  | "saleMethod"
  | "verification";

type LicenseStatus = "active" | "expired" | "unknown";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  status?: LicenseStatus;
  className?: string;
}

const licenseColors: Record<LicenseStatus, string> = {
  active: "bg-green-100 text-green-800 border border-green-300",
  expired: "bg-red-100 text-red-800 border border-red-300",
  unknown: "bg-gray-100 text-gray-600 border border-gray-300",
};

const variantColors: Record<Exclude<BadgeVariant, "license" | "verification">, string> = {
  propertyType: "bg-blue-100 text-blue-800 border border-blue-300",
  reviewType: "bg-purple-100 text-purple-800 border border-purple-300",
  saleMethod: "bg-amber-100 text-amber-800 border border-amber-300",
};

function Badge({ variant, children, status = "unknown", className = "" }: BadgeProps) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";

  let colorClass: string;
  if (variant === "license") {
    colorClass = licenseColors[status];
  } else if (variant === "verification") {
    colorClass = "bg-green-100 text-green-800 border border-green-300";
  } else {
    colorClass = variantColors[variant];
  }

  return (
    <span className={`${base} ${colorClass} ${className}`}>
      {variant === "verification" && <Check className="w-3 h-3" />}
      {children}
    </span>
  );
}

export { Badge, type BadgeProps, type BadgeVariant, type LicenseStatus };

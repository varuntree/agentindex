import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const allItems: BreadcrumbItem[] = [{ label: "Home", href: "/" }, ...items];

  return (
    <nav
      className={`flex items-center gap-1.5 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {allItems.map((item, idx) => {
        const isLast = idx === allItems.length - 1;
        const isHome = idx === 0;

        return (
          <span key={idx} className="inline-flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            )}
            {isLast ? (
              <span className="font-bold text-black" aria-current="page">
                {isHome ? <Home className="w-4 h-4" /> : item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-voqo-green transition-colors"
              >
                {isHome ? <Home className="w-4 h-4" /> : item.label}
              </Link>
            ) : (
              <span className="text-gray-500">
                {isHome ? <Home className="w-4 h-4" /> : item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export { Breadcrumb, type BreadcrumbProps, type BreadcrumbItem };

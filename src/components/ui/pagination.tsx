import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  basePath?: string;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);
  return pages;
}

function buildHref(basePath: string, page: number): string {
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}page=${page}`;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  basePath,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  const pageButton = (
    page: number,
    label: React.ReactNode,
    isActive: boolean,
    isDisabled: boolean,
    key: string | number
  ) => {
    const base =
      "inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all";
    const activeClass = isActive
      ? "bg-voqo-green text-white border-2 border-black"
      : "bg-white text-black border border-gray-300 hover:bg-gray-100";
    const disabledClass = isDisabled ? "opacity-50 pointer-events-none" : "";
    const classes = `${base} ${activeClass} ${disabledClass}`;

    if (basePath && !isDisabled) {
      return (
        <Link key={key} href={buildHref(basePath, page)} className={classes}>
          {label}
        </Link>
      );
    }

    return (
      <button
        key={key}
        onClick={() => onPageChange?.(page)}
        disabled={isDisabled}
        className={`${classes} cursor-pointer`}
      >
        {label}
      </button>
    );
  };

  return (
    <nav
      className={`flex items-center gap-1 ${className}`}
      aria-label="Pagination"
    >
      {pageButton(
        currentPage - 1,
        <ChevronLeft className="w-4 h-4" />,
        false,
        currentPage <= 1,
        "prev"
      )}

      {pages.map((page, idx) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex items-center justify-center w-9 h-9 text-gray-400"
            >
              ...
            </span>
          );
        }
        return pageButton(page, page, page === currentPage, false, page);
      })}

      {pageButton(
        currentPage + 1,
        <ChevronRight className="w-4 h-4" />,
        false,
        currentPage >= totalPages,
        "next"
      )}
    </nav>
  );
}

export { Pagination, type PaginationProps };

import Link from "next/link";

interface SuburbBadgeProps {
  name: string;
  slug: string;
  state: string;
  isPrimary?: boolean;
  className?: string;
}

function SuburbBadge({
  name,
  slug,
  state,
  isPrimary = false,
  className = "",
}: SuburbBadgeProps) {
  const colorClass = isPrimary
    ? "bg-voqo-green text-white hover:bg-voqo-dark-green"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  const stateSlug = state.toLowerCase();

  return (
    <Link
      href={`/agents/${stateSlug}/${slug}`}
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium transition-colors ${colorClass} ${className}`}
    >
      {name}
    </Link>
  );
}

export { SuburbBadge, type SuburbBadgeProps };

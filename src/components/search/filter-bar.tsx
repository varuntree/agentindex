'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { label: 'Most Sales', value: 'sales' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Name A-Z', value: 'name' },
  { label: 'Quality Score', value: 'quality' },
] as const;

const PROPERTY_TYPES = ['House', 'Unit', 'Land', 'Townhouse'] as const;

interface FilterBarProps {
  totalResults: number;
  filteredResults?: number;
}

export default function FilterBar({ totalResults, filteredResults }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentSort = searchParams.get('sort') ?? 'sales';
  const activeTypes = searchParams.getAll('propertyType');

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        params.delete(key);
        if (value === null) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ sort: e.target.value });
  };

  const togglePropertyType = (type: string) => {
    const next = activeTypes.includes(type)
      ? activeTypes.filter((t) => t !== type)
      : [...activeTypes, type];
    updateParams({ propertyType: next.length > 0 ? next : null });
  };

  const clearAllFilters = () => {
    updateParams({ propertyType: null, sort: 'sales' });
  };

  const hasActiveFilters = activeTypes.length > 0 || currentSort !== 'sales';
  const isFiltered = filteredResults !== undefined && filteredResults !== totalResults;

  return (
    <div className="sticky top-16 z-40 bg-white border-b-2 border-black py-3">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
        {/* Sort dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="h-4 w-4 text-black" />
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="h-9 rounded-lg border-2 border-black bg-white px-3 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-voqo-green"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property type chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {PROPERTY_TYPES.map((type) => {
            const active = activeTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => togglePropertyType(type)}
                className={`px-3 py-1 rounded-full text-sm border-2 border-black cursor-pointer whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-voqo-green text-white'
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 rounded-full text-sm border-2 border-red-500 text-red-500 bg-white hover:bg-red-50 cursor-pointer whitespace-nowrap transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 shrink-0">
          {isFiltered
            ? `${filteredResults} of ${totalResults} agents`
            : `Showing ${totalResults} agents`}
        </p>
      </div>
    </div>
  );
}

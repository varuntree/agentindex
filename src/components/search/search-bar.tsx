'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, User, Building2, MapPin } from 'lucide-react';

type ResultType = 'agent' | 'agency' | 'suburb';

interface AutocompleteResult {
  type: ResultType;
  slug: string;
  label: string;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'h-9 text-sm pl-8 pr-3',
  md: 'h-10 text-sm pl-9 pr-3',
  lg: 'h-12 text-base pl-10 pr-4',
};

const ICON_SIZE_CLASSES: Record<string, string> = {
  sm: 'left-2.5 top-2.5',
  md: 'left-3 top-3',
  lg: 'left-3 top-3.5',
};

const ICON_SIZES: Record<string, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

const TYPE_ORDER: ResultType[] = ['agent', 'agency', 'suburb'];

const TYPE_LABELS: Record<ResultType, string> = {
  agent: 'Agents',
  agency: 'Agencies',
  suburb: 'Suburbs',
};

function TypeIcon({ type, size = 14 }: { type: ResultType; size?: number }) {
  switch (type) {
    case 'agent':
      return <User size={size} className="text-gray-400 shrink-0" />;
    case 'agency':
      return <Building2 size={size} className="text-gray-400 shrink-0" />;
    case 'suburb':
      return <MapPin size={size} className="text-gray-400 shrink-0" />;
  }
}

function getResultUrl(result: AutocompleteResult): string {
  switch (result.type) {
    case 'agent':
      return `/agent/${result.slug}`;
    case 'agency':
      return `/agency/${result.slug}`;
    case 'suburb': {
      // Suburb slugs are "name-state" format, e.g. "bondi-beach-nsw"
      // State is the last hyphen-separated segment
      const parts = result.slug.split('-');
      const state = parts.pop()!;
      const name = parts.join('-');
      return `/agents/${state}/${name}`;
    }
  }
}

export function SearchBar({
  placeholder = 'Search agents, suburbs, agencies...',
  className = '',
  size = 'md',
}: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Flat list for keyboard nav
  const flatResults = TYPE_ORDER.flatMap((type) =>
    results.filter((r) => r.type === type)
  );

  // Fetch autocomplete results
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setResults(json.data);
        setIsOpen(json.data.length > 0 || q.length >= 2);
        setHighlightIndex(-1);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setResults([]);
      setIsOpen(false);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced input handler
  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.length < 2) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        fetchResults(value);
      }, 200);
    },
    [fetchResults]
  );

  // Select a result
  const selectResult = useCallback(
    (result: AutocompleteResult) => {
      setIsOpen(false);
      setQuery('');
      setResults([]);
      setHighlightIndex(-1);
      router.push(getResultUrl(result));
    },
    [router]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || flatResults.length === 0) {
        if (e.key === 'Escape') {
          setIsOpen(false);
          inputRef.current?.blur();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : 0
          );
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : flatResults.length - 1
          );
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < flatResults.length) {
            selectResult(flatResults[highlightIndex]);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
        }
      }
    },
    [isOpen, flatResults, highlightIndex, selectResult]
  );

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  // Group results by type for rendering
  const groupedTypes = TYPE_ORDER.filter((type) =>
    results.some((r) => r.type === type)
  );

  // Track global index for highlight
  let globalIndex = -1;

  const iconSize = ICON_SIZES[size];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input wrapper */}
      <div className="relative">
        {/* Search icon or spinner */}
        <div
          className={`absolute ${ICON_SIZE_CLASSES[size]} pointer-events-none`}
        >
          {isLoading ? (
            <Loader2 size={iconSize} className="animate-spin text-gray-400" />
          ) : (
            <Search size={iconSize} className="text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || query.length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={[
            'w-full border-2 border-black rounded-lg transition-colors outline-none',
            'focus:ring-2 focus:ring-voqo-green focus:border-voqo-green',
            SIZE_CLASSES[size],
          ].join(' ')}
          role="combobox"
          aria-controls="search-listbox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="search-listbox"
          className="absolute z-50 mt-1 w-full bg-white border-2 border-black rounded-lg shadow-lg max-h-80 overflow-y-auto"
          role="listbox"
        >
          {flatResults.length === 0 && !isLoading ? (
            <div className="px-3 py-2.5 text-sm text-gray-500">
              No results found
            </div>
          ) : (
            groupedTypes.map((type) => {
              const typeResults = results.filter((r) => r.type === type);
              return (
                <div key={type}>
                  {/* Group header */}
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100 sticky top-0">
                    {TYPE_LABELS[type]}
                  </div>

                  {/* Items */}
                  {typeResults.map((result) => {
                    globalIndex++;
                    const idx = globalIndex;
                    const isHighlighted = idx === highlightIndex;

                    return (
                      <button
                        key={`${result.type}-${result.slug}`}
                        type="button"
                        role="option"
                        aria-selected={isHighlighted}
                        className={[
                          'w-full flex items-center gap-2 px-3 py-2 text-sm text-left cursor-pointer transition-colors',
                          isHighlighted
                            ? 'bg-gray-100'
                            : 'hover:bg-gray-50',
                        ].join(' ')}
                        onMouseEnter={() => setHighlightIndex(idx)}
                        onMouseDown={(e) => {
                          // Prevent input blur before click fires
                          e.preventDefault();
                        }}
                        onClick={() => selectResult(result)}
                      >
                        <TypeIcon type={result.type} size={14} />
                        <span className="truncate">{result.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

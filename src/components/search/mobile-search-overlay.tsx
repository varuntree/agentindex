'use client'

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User, Building2, MapPin, X, Clock, TrendingUp } from 'lucide-react'

type ResultType = 'agent' | 'agency' | 'suburb'

interface AutocompleteResult {
  type: ResultType
  slug: string
  label: string
}

interface MobileSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  topSuburbs?: { name: string; slug: string; state: string }[]
}

const RECENT_SEARCHES_KEY = 'agentindex_recent_searches'
const MAX_RECENT = 5

function TypeIcon({ type, size = 16 }: { type: ResultType; size?: number }) {
  switch (type) {
    case 'agent':
      return <User size={size} className="text-gray-400 shrink-0" />
    case 'agency':
      return <Building2 size={size} className="text-gray-400 shrink-0" />
    case 'suburb':
      return <MapPin size={size} className="text-gray-400 shrink-0" />
  }
}

function getResultUrl(result: AutocompleteResult): string {
  switch (result.type) {
    case 'agent':
      return `/agent/${result.slug}`
    case 'agency':
      return `/agency/${result.slug}`
    case 'suburb': {
      const parts = result.slug.split('-')
      const state = parts.pop()!
      const name = parts.join('-')
      return `/agents/${state}/${name}`
    }
  }
}

function getRecentSearches(): AutocompleteResult[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(result: AutocompleteResult) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentSearches()
    const filtered = existing.filter(
      (r) => !(r.type === result.type && r.slug === result.slug)
    )
    const updated = [result, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // ignore storage errors
  }
}

export function MobileSearchOverlay({
  isOpen,
  onClose,
  topSuburbs = [],
}: MobileSearchOverlayProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AutocompleteResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<AutocompleteResult[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load recent searches on mount
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Fetch autocomplete results
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)

    try {
      const res = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      )

      if (!res.ok) {
        setResults([])
        return
      }

      const data = await res.json()
      if (Array.isArray(data)) {
        setResults(data)
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setResults([])
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (value.length < 2) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      debounceRef.current = setTimeout(() => {
        fetchResults(value)
      }, 200)
    },
    [fetchResults]
  )

  const selectResult = useCallback(
    (result: AutocompleteResult) => {
      saveRecentSearch(result)
      setQuery('')
      setResults([])
      onClose()
      router.push(getResultUrl(result))
    },
    [router, onClose]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [onClose]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  if (!isOpen) return null

  const showResults = query.length >= 2
  const hasResults = results.length > 0

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b-2 border-black">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isLoading ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <Search size={18} className="text-gray-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search agents, suburbs, agencies..."
            className="w-full h-11 pl-10 pr-4 text-base border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-voqo-green"
            autoComplete="off"
          />
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close search"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showResults ? (
          /* Search Results */
          <div className="p-4">
            {hasResults ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.slug}`}
                    onClick={() => selectResult(result)}
                    className="w-full flex items-center gap-3 p-3 text-left border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <TypeIcon type={result.type} size={18} />
                    <span className="truncate">{result.label}</span>
                  </button>
                ))}
              </div>
            ) : !isLoading ? (
              <p className="text-center text-gray-500 py-8">No results found</p>
            ) : null}
          </div>
        ) : (
          /* Default Content: Recent + Top Suburbs */
          <div className="p-4 space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Recent Searches
                  </h3>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((result) => (
                    <button
                      key={`recent-${result.type}-${result.slug}`}
                      onClick={() => selectResult(result)}
                      className="w-full flex items-center gap-3 p-3 text-left border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <TypeIcon type={result.type} size={18} />
                      <span className="truncate">{result.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Suburbs */}
            {topSuburbs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Popular Suburbs
                  </h3>
                </div>
                <div className="space-y-2">
                  {topSuburbs.slice(0, 6).map((suburb) => (
                    <button
                      key={suburb.slug}
                      onClick={() =>
                        selectResult({
                          type: 'suburb',
                          slug: `${suburb.slug}-${suburb.state.toLowerCase()}`,
                          label: `${suburb.name}, ${suburb.state.toUpperCase()}`,
                        })
                      }
                      className="w-full flex items-center gap-3 p-3 text-left border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MapPin size={18} className="text-gray-400 shrink-0" />
                      <span>
                        {suburb.name}, {suburb.state.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {recentSearches.length === 0 && topSuburbs.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Start typing to search for agents, suburbs, or agencies
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

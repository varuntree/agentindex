export function cacheHeaders(maxAge: number): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
  };
}

// Presets
export const CACHE_SEARCH = 60;      // 1 minute
export const CACHE_LIST = 300;       // 5 minutes
export const CACHE_PROFILE = 3600;   // 1 hour
export const CACHE_NONE = 0;         // no cache (voice)

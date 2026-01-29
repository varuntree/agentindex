'use client';

/**
 * Client tools for ElevenLabs voice agent
 *
 * These tools are executed client-side when the voice agent calls them.
 * Tool names are case-sensitive and must match ElevenLabs dashboard config.
 *
 * IMPORTANT: Tool parameter schemas are defined in ElevenLabs dashboard, not here.
 * These are plain async functions that receive parameters from the agent.
 */

// ElevenLabs expects tools as simple async functions
// Using 'any' for params to match SDK expectations - actual validation is in dashboard
type ToolFunction = (params: any) => Promise<unknown> | unknown;

export type ClientTools = Record<string, ToolFunction>;

function sanitizeForJson(value: unknown, depth = 0, seen?: WeakSet<object>): unknown {
  if (depth > 6) return '[MaxDepth]';

  if (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function' || typeof value === 'symbol') return undefined;

  if (typeof value !== 'object') return String(value);

  const obj = value as object;
  const seenSet = seen ?? new WeakSet<object>();
  if (seenSet.has(obj)) return '[Circular]';
  seenSet.add(obj);

  // Common non-plain objects we never want to serialize deeply.
  if (typeof window !== 'undefined' && obj === window) return '[Window]';
  if (obj instanceof Error) return { name: obj.name, message: obj.message };
  if (obj instanceof URL) return obj.toString();
  if (typeof HTMLElement !== 'undefined' && obj instanceof HTMLElement) {
    return { tagName: obj.tagName, id: obj.id || undefined };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForJson(item, depth + 1, seenSet));
  }

  const proto = Object.getPrototypeOf(obj);
  const isPlain = proto === Object.prototype || proto === null;
  if (!isPlain) {
    // Last resort: avoid attempting to serialize class instances (can contain cycles).
    const name =
      (obj as { constructor?: { name?: string } }).constructor?.name ?? 'Object';
    return `[${name}]`;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = sanitizeForJson(v, depth + 1, seenSet);
    if (next !== undefined) out[k] = next;
  }
  return out;
}

function wrapTools(tools: ClientTools): ClientTools {
  const wrapped: ClientTools = {};
  for (const [name, fn] of Object.entries(tools)) {
    wrapped[name] = async (params) => {
      try {
        const result = await fn(params);
        return sanitizeForJson(result);
      } catch (e) {
        console.error(`[Tool] ${name} error:`, e);
        return sanitizeForJson({
          ok: false,
          error: e instanceof Error ? e.message : 'Tool error',
        });
      }
    };
  }
  return wrapped;
}

function toInternalHref(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // Disallow javascript: URLs entirely.
  if (/^javascript:/i.test(raw)) return null;

  // Relative path.
  if (raw.startsWith('/')) return raw;

  // Absolute URL: allow same-origin -> internal href.
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      // Get current host safely - only access window at runtime
      const currentHost = typeof window !== 'undefined' ? window.location.host : '';
      const allowedHosts = new Set<string>([
        currentHost,
        'agentindex.com.au',
        'www.agentindex.com.au',
      ]);
      if (allowedHosts.has(url.host)) return `${url.pathname}${url.search}${url.hash}`;
      return null;
    } catch {
      return null;
    }
  }

  // Tolerate common missing leading slash.
  if (/^(agent|agency|agents)\//.test(raw)) return `/${raw}`;

  return null;
}

async function fetchJson(url: string): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        typeof data?.error?.message === 'string'
          ? data.error.message
          : typeof data?.error === 'string'
            ? data.error
            : `Request failed (${res.status})`;
      return { ok: false, error: message };
    }

    // Some endpoints use { success: false, error: { message } } even with 200.
    if (data && typeof data === 'object' && data.success === false) {
      const message =
        typeof (data as any)?.error?.message === 'string'
          ? (data as any).error.message
          : 'Request failed';
      return { ok: false, error: message };
    }

    return { ok: true, data };
  } catch (e) {
    console.error('[Tool] fetchJson error:', e);
    return { ok: false, error: 'Network error' };
  }
}

/**
 * Navigator mode tools - site-wide navigation and search
 */
export const navigatorTools: ClientTools = {
  /**
   * Navigate to a specific page on the website
   */
  navigateToPage: async (params) => {
    const { path, href: hrefParam, url } = params as { path?: string; href?: string; url?: string };
    const raw = String(path ?? hrefParam ?? url ?? '');
    console.log('[Tool] navigateToPage:', raw);

    // IMPORTANT: avoid full page reloads (which drop the active ElevenLabs session).
    // Delegate to Next.js App Router navigation via a custom event handled by VoiceProvider.
    const internalHref = toInternalHref(raw);
    if (internalHref) {
      window.dispatchEvent(
        new CustomEvent('voice-navigate', {
          detail: { href: internalHref, replace: false, scroll: true },
        })
      );
      return { success: true, navigatedTo: internalHref, method: 'app-router' };
    }

    // Reject external/invalid paths rather than forcing a hard reload (which kills the session).
    return { success: false, error: 'Invalid or external path', navigatedTo: raw };
  },

  /**
   * Search for agents, agencies, or suburbs
   */
  searchAgents: async (params) => {
    const { query } = params as { query: string };
    console.log('[Tool] searchAgents:', query);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        return { error: 'Search failed', agents_found: 0 };
      }
      const data = await res.json();

      // Return object directly - ElevenLabs handles serialization
      return {
        agents_found: data?.agents?.length ?? 0,
        agencies_found: data?.agencies?.length ?? 0,
        suburbs_found: data?.suburbs?.length ?? 0,
        top_results: (data?.agents ?? [])
          .slice(0, 3)
          .map((a: Record<string, unknown>) => ({
            name: a.full_name,
            agency: a.agency_name,
            slug: a.slug,
            suburb: a.suburb,
          })),
      };
    } catch (err) {
      console.error('[Tool] searchAgents error:', err);
      return { error: 'Search failed', agents_found: 0 };
    }
  },

  /**
   * Apply filters on the current agent listing page
   */
  filterResults: async (params) => {
    const { sort, propertyType } = params as {
      sort?: string;
      propertyType?: string;
    };
    console.log('[Tool] filterResults:', { sort, propertyType });
    
    // Safely access window at runtime only
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not in browser environment' };
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    if (sort) urlParams.set('sort', sort);
    if (propertyType) urlParams.set('type', propertyType);
    const qs = urlParams.toString();
    const href = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;

    window.dispatchEvent(
      new CustomEvent('voice-navigate', {
        detail: { href, replace: true, scroll: false },
      })
    );

    return { success: true, filters: { sort, propertyType }, navigatedTo: href };
  },

  /**
   * Scroll to a section on the current page
   */
  scrollToSection: async (params) => {
    const { section } = params as { section: string };
    console.log('[Tool] scrollToSection:', section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      return { success: true, scrolledTo: section };
    }
    return { success: false, error: `Section "${section}" not found` };
  },

  /**
   * Switch from Navigator to Assistant mode for the current agent or agency
   */
  activateAssistant: async (params) => {
    const { slug, entityType } = params as { slug: string; entityType?: 'agent' | 'agency' | 'suburb' };
    console.log('[Tool] activateAssistant:', { slug, entityType });
    window.dispatchEvent(
      new CustomEvent('voice-mode-change', {
        detail: { mode: 'assistant', slug, entityType },
      })
    );
    return { success: true, switchingTo: 'assistant', slug };
  },

  /**
   * Highlight a specific agent's card on a listing page
   */
  highlightAgent: async (params) => {
    const { agentSlug } = params as { agentSlug: string };
    console.log('[Tool] highlightAgent:', agentSlug);
    const card = document.querySelector(`[data-agent-slug="${agentSlug}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-4', 'ring-voqo-green', 'ring-offset-2');
      setTimeout(() => {
        card.classList.remove('ring-4', 'ring-voqo-green', 'ring-offset-2');
      }, 5000);
      return { success: true, highlighted: agentSlug };
    }
    return { success: false, error: 'Agent card not found on this page' };
  },
};

/**
 * Assistant mode tools - minimal, conversation-focused
 */
export const assistantTools: ClientTools = {
  /**
   * Scroll to a section on the current page to show specific information
   */
  scrollToSection: async (params) => {
    const { section } = params as { section: string };
    console.log('[Tool] scrollToSection:', section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      return { success: true, scrolledTo: section };
    }
    return { success: false, error: `Section "${section}" not found` };
  },
};

/**
 * Data tools (DB-backed via public read-only API routes).
 *
 * These let the voice agent discover what data is available and fetch facts on-demand,
 * instead of relying on large prompt injections that become stale after navigation.
 */
export const dataTools: ClientTools = {
  getAgentProfile: async (params) => {
    const slug = String((params as any)?.slug ?? (params as any)?.agentSlug ?? '');
    console.log('[Tool] getAgentProfile:', slug);
    if (!slug || slug.length > 200) return { ok: false, error: 'Invalid agent slug' };

    const result = await fetchJson(`/api/agent/${encodeURIComponent(slug)}`);
    if (!result.ok) return result;

    const agent = result.data;
    return {
      ok: true,
      agent: {
        slug: agent.slug,
        full_name: agent.fullName,
        agency_name: agent.agency?.name ?? null,
        suburbs: (agent.suburbs ?? []).map((s: any) => s?.suburb?.name).filter(Boolean).slice(0, 12),
        ratings_average: agent.ratingsAverage ?? null,
        ratings_count: agent.ratingsCount ?? null,
        total_sales_count: agent.totalSalesCount ?? null,
        median_sale_price: agent.medianSalePrice ?? null,
        bio: agent.bio ?? null,
        stats: agent.stats ?? null,
      },
    };
  },

  getAgencyProfile: async (params) => {
    const slug = String((params as any)?.slug ?? (params as any)?.agencySlug ?? '');
    console.log('[Tool] getAgencyProfile:', slug);
    if (!slug || slug.length > 200) return { ok: false, error: 'Invalid agency slug' };

    const result = await fetchJson(`/api/agency/${encodeURIComponent(slug)}`);
    if (!result.ok) return result;

    const agency = result.data;
    return {
      ok: true,
      agency: {
        slug: agency.slug,
        name: agency.name,
        suburb: agency.suburb ?? null,
        state: agency.state ?? null,
        agent_count: agency.agentCount ?? null,
        avg_sale_price: agency.avgSalePrice ?? null,
        top_suburbs: agency.topSuburbs ?? [],
      },
    };
  },

  getSuburbProfile: async (params) => {
    const slug = String((params as any)?.slug ?? (params as any)?.suburbSlug ?? '');
    console.log('[Tool] getSuburbProfile:', slug);
    if (!slug || slug.length > 200) return { ok: false, error: 'Invalid suburb slug' };

    const result = await fetchJson(`/api/suburb/${encodeURIComponent(slug)}`);
    if (!result.ok) return result;

    const suburb = result.data;
    return {
      ok: true,
      suburb: {
        slug: suburb.slug,
        name: suburb.name,
        state: suburb.state,
        postcode: suburb.postcode,
        market_stats: suburb.market_stats ?? null,
        demographics: suburb.demographics ?? null,
        total_agents: suburb.total_agents ?? null,
        top_agents: (suburb.agents ?? []).slice(0, 10),
      },
    };
  },

  listAgents: async (params) => {
    const {
      suburb,
      agency,
      state,
      sort,
      propertyType,
      page,
      limit,
    } = (params ?? {}) as {
      suburb?: string;
      agency?: string;
      state?: string;
      sort?: string;
      propertyType?: string;
      page?: number;
      limit?: number;
    };

    // Build query string without using URL constructor (avoids circular window reference)
    const queryParams = new URLSearchParams();
    if (suburb) queryParams.set('suburb', suburb);
    if (agency) queryParams.set('agency', agency);
    if (state) queryParams.set('state', state);
    if (sort) queryParams.set('sort', sort);
    if (propertyType) queryParams.set('property_type', propertyType);
    if (page) queryParams.set('page', String(page));
    if (limit) queryParams.set('limit', String(limit));

    const qs = queryParams.toString();
    const apiPath = qs ? `/api/agents?${qs}` : '/api/agents';

    console.log('[Tool] listAgents:', apiPath);
    const result = await fetchJson(apiPath);
    if (!result.ok) return result;

    return {
      ok: true,
      total: result.data.total ?? null,
      page: result.data.page ?? null,
      pages: result.data.pages ?? null,
      suburb: result.data.suburb ?? null,
      agents: (result.data.agents ?? []).slice(0, 20),
    };
  },
};

/**
 * Combined tools for unified mode
 * This allows a single conversation to handle both navigation and assistance
 */
export const allTools: ClientTools = {
  ...navigatorTools,
  // Assistant scrollToSection is same as navigator, no need to override
  ...dataTools,
};

/**
 * Wrapped (safe) tools used by the app.
 * Ensures tool responses are JSON-serializable and never contain circular references.
 */
export const safeTools: ClientTools = wrapTools(allTools);

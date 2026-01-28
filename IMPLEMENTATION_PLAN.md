# AgentIndex Implementation Plan

Last updated: 2026-01-28

---

## Completed

- [x] **Phase 1** (1.1-1.15) — Next.js 15 scaffold, Tailwind 4, Drizzle config, fonts, layout, formatting utils
- [x] **Phase 2** (2.1-2.18) — Full Drizzle schema (7 tables), migrations, FTS5, DB connection, slug/json/data-quality utils, suburb seed (17,503 rows)
- [x] **Phase 3.5** (3.5.1-3.5.6) — Query helpers: agent/agency/suburb/search/stats queries
- [x] **Phase 4** (4.1-4.9) — All 8 API routes + response/cache utils
- [x] **Phase 5 partial** (5.1-5.13, 5.21-5.22) — Button, Card, Badge, Input, StarRating, Pagination, Skeleton, StatCard, AgentCard, AgentPhoto, SuburbBadge, PriceDisplay, PropertyTypeIcon, Table, Breadcrumb

## Key Learnings

- better-sqlite3 needs `serverExternalPackages` in next.config.ts
- pnpm 10 needs `pnpm.onlyBuiltDependencies` in package.json for native modules
- Tailwind 4 uses CSS @theme, no tailwind.config.js
- ESLint 9 flat config needs `@eslint/eslintrc` for FlatCompat
- Must exclude agent-ralph-ui/, agent-ralph/, ralph/ from ESLint
- FTS5 migration must be applied manually (not in Drizzle journal)
- lint script: `eslint .` (not `next lint`, deprecated in Next.js 15.5+)
- Using Next.js 15.x (not 14+), CSV for suburb data (not suburbs.json), pipeline/ directory (not scripts/)

---

## Phase 5 (remaining): Design System

- [ ] **5.14 SearchBar** — `src/components/search/search-bar.tsx`; 2px border input + Search icon; autocomplete dropdown grouped by type; keyboard nav (arrows/enter/esc); debounced 200ms fetch to /api/search/autocomplete; loading spinner; empty state
- [ ] **5.15 GlobalNav** — `src/components/navigation/global-nav.tsx`; sticky top-0 z-50 bg-white border-b; logo left, search center (desktop), nav links (Agents, Agencies), VoiceButton right; mobile hamburger + drawer
- [ ] **5.16 GlobalFooter** — `src/components/navigation/global-footer.tsx`; bg-gray-900 text-white; 4-col state links grid (top 5 suburbs each); "Powered by Voqo AI"; legal links; responsive
- [ ] **5.17 VoiceButton** — `src/components/voice/voice-button.tsx`; 56px circular voqo-green; Mic/Volume2/Loader2 icons per state; pulse animation idle; onClick opens VoicePanel
- [ ] **5.18 VoicePanel** — `src/components/voice/voice-panel.tsx`; mobile=bottom sheet, desktop=320px popover; states: idle/connecting/listening/speaking/error; 5-bar waveform; mode indicator
- [ ] **5.19 VoiceProvider** — `src/components/voice/voice-provider.tsx`; React Context; state: mode, isOpen, sessionId, status; actions: openVoice, closeVoice, switchMode; useVoice() hook
- [ ] **5.20 FilterBar** — `src/components/search/filter-bar.tsx`; sticky below nav; sort dropdown; property type multi-select chips; results count; horizontal scroll mobile; updates URL searchParams

---

## Phase 6: Pages

- [ ] **6.1 Homepage (`/`)** — Hero (H1 + SearchBar + voice CTA), Featured Suburbs grid (getTopSuburbs), How It Works 3-step, Stats Banner (black bg), Popular Agencies carousel; ISR 3600
- [ ] **6.2 Agent Profile (`/agent/[slug]/`)** — generateStaticParams; photo+name+agency header, 6 StatCards, suburbs served, sales Table (20/page), reviews section, similar agents carousel; ISR 86400
- [ ] **6.3 Suburb Listing (`/agents/[state]/[suburb-slug]/`)** — generateStaticParams; suburb header + market stats, FilterBar, AgentCard list (20/page), suburb stats paragraph, nearby suburbs; ISR 21600
- [ ] **6.4 Agency Profile (`/agency/[slug]/`)** — generateStaticParams; logo+name+contact header, agent roster 3-col grid, agency stats, recent sales Table; ISR 86400
- [ ] **6.5 All Agencies (`/agencies/`)** — state filter tabs, agency grid 4-col (logo+name+suburb+count), sort dropdown, pagination 24/page; ISR 21600
- [ ] **6.6 State Listing (`/agents/[state]/`)** — 8 states; state header + stats, suburb autocomplete, top suburbs grid 4-col (48/page); ISR 43200
- [ ] **6.7 All Agents (`/agents/`)** — 8 state cards in 4-col grid; static
- [ ] **6.8 404 page** — `src/app/not-found.tsx`; SearchBar + directory links
- [ ] **6.9 Error page** — `src/app/error.tsx`; error message + retry + home link
- [ ] **6.10 Loading skeletons** — global + route-specific loading.tsx files using Skeleton components

---

## Phase 7: SEO

- [ ] **7.1 Metadata utility** — `src/lib/seo/metadata.ts`; helpers per page type returning Next.js Metadata objects
- [ ] **7.2 Agent JSON-LD** — schema.org RealEstateAgent + aggregateRating + reviews
- [ ] **7.3 Suburb JSON-LD** — ItemList of agents + BreadcrumbList
- [ ] **7.4 Agency JSON-LD** — Organization + employees + aggregateRating
- [ ] **7.5 Homepage JSON-LD** — WebSite + SearchAction for sitelinks
- [ ] **7.6 Breadcrumbs** — integrate Breadcrumb component on all pages + BreadcrumbList schema
- [ ] **7.7 Sitemap** — `src/app/sitemap.ts`; dynamic, all agents/suburbs/agencies/static pages
- [ ] **7.8 robots.txt** — `src/app/robots.ts`; Allow /, Disallow /api/
- [ ] **7.9 Canonical tags** — every page; paginated/sorted pages canonical = page 1 default sort
- [ ] **7.10 OG image generation** — `src/app/api/og/route.tsx` via @vercel/og; agent/suburb/agency variants; 1200x630
- [ ] **7.11 Internal linking audit** — verify link density across all page types

---

## Phase 8: Voice Integration

- [ ] **8.0 Install @elevenlabs/react** — not yet in package.json
- [ ] **8.1 ElevenLabs agent template** — dashboard config: model, voice, security, client tools
- [ ] **8.2 Signed URL API** — extend 4.8 with Navigator/Assistant prompt building
- [ ] **8.3 Navigator client tools** — `src/lib/voice/navigator-tools.ts`; navigateToPage, searchAgents, filterResults, scrollToSection, activateAssistant, highlightAgent
- [ ] **8.4 Assistant client tools** — `src/lib/voice/assistant-tools.ts`; scrollToSection only
- [ ] **8.5 Wire VoiceProvider to SDK** — useConversation() from @elevenlabs/react; mic permissions; session lifecycle; mode switching; 5-min timeout
- [ ] **8.6 Navigator system prompt** — `src/lib/voice/prompts.ts`; site stats context, nav instructions, tool examples, Australian English
- [ ] **8.7 Assistant system prompts** — 3 variants: agent profile, agency receptionist, suburb expert; all include AI disclosure
- [ ] **8.8 Context data fetchers** — `src/lib/voice/context.ts`; buildAgentContext, buildAgencyContext, buildSuburbContext
- [ ] **8.9 Voice UI states** — wire VoicePanel states + waveform visualizer via byte frequency data
- [ ] **8.10 Mobile voice** — bottom sheet, slide-up, large tap targets, safe-area padding, swipe-down close

---

## Phase 3: Data Pipeline

- [ ] **3.1 Zod schemas** — `pipeline/schemas/`; AgencyOutput, AgentOutput, SaleOutput, ReviewOutput
- [ ] **3.2 Pipeline orchestrator** — `pipeline/scripts/pipeline.ts`; CLI args (--location, --agencies, --discover-agencies, --limit); Claude Agent SDK query(); pipeline_runs tracking
- [ ] **3.3 Agency Researcher** — WebSearch+WebFetch; Sonnet; find agencies in location; return AgencyOutput[]
- [ ] **3.4 Agent Researcher** — deep-dive single agent; sales, reviews, bio, contact; return AgentOutput
- [ ] **3.5 License Verifier** — NSW Fair Trading lookup; return license details
- [ ] **3.6 Sales Historian** — multi-source sales (Domain, agency pages, RateMyAgent); return SaleOutput[]
- [ ] **3.7 Review Aggregator** — RateMyAgent, Google Business, testimonials; return ReviewOutput[]
- [ ] **3.8 Data storage** — `pipeline/scripts/store.ts`; transaction upsert, data quality scores, denormalized counts
- [ ] **3.9 Rate limiter** — max 10 concurrent, 30 req/min per domain, exponential backoff
- [ ] **3.10 Dedup module** — agency/agent/sale matching; address normalization; merge strategy
- [ ] **3.11 Image downloader** — parallel download to public/images/; 10 concurrent, 5s timeout
- [ ] **3.12 First pipeline run** — Bondi Beach NSW, --discover-agencies --limit 5
- [ ] **3.13 Expand suburbs** — Bondi Junction, Bronte, Coogee, etc.; target 20+ agencies, 200+ agents

---

## Unresolved Questions

1. **ElevenLabs agent** — created in dashboard yet? Required for Phase 8.
2. **ElevenLabs LLM** — gpt-4o-mini (~$0.005/min, faster) or claude-3-5-sonnet (~$0.015/min, better reasoning)?
3. **@elevenlabs/react** — must install before Phase 8.

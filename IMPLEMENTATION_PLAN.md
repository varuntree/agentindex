# IMPLEMENTATION PLAN

> Last updated: 2026-01-29 18:00
> Current phase: 6/8 — Pages (polish remaining)
> Progress: 70 completed / 92 total tasks

> **prompt_build** and **prompt_plan**: Read `AGENTS.md` at the beginning of every conversation before taking any action. It contains critical build fixes and gotchas.

---

## Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Tech Stack | **Complete** | Next.js 15.5.7, React 19, Tailwind 4, TS 5 |
| Phase 2: Data Model | **~95%** | 7 tables, 3 FTS5, 27 indexes; minor constraint gaps |
| Phase 3: Data Pipeline | **~80%** | Core orchestrator + 5 sub-agents; missing config/utils |
| Phase 4: API Routes | **Complete** | All 7 endpoints implemented with caching |
| Phase 5: UI Components | **~85%** | 32 components; missing 3 cards + 2 charts |
| Phase 6: Pages | **~80%** | All 7 routes; UI polish remaining |
| Phase 7: SEO | **Complete** | Sitemap, JSON-LD, meta, OG images, robots.ts |
| Phase 8: Voice | **~95%** | Full integration; minor CSS polish |
| Phase 9: Testing | **Not Started** | No test framework |

---

## CRITICAL BLOCKERS

None. All blocking items resolved.

---

## MVP Scope Notes

**Skipping for MVP** (data optimization later):
- Demographics data sourcing (ABS) — fields exist, show "N/A" or hide
- Market stats sourcing (YoY, clearance rate, rental yield) — use placeholder/sample values
- market_share_suburb calculation — skip display
- Image downloading — use direct URLs (already implemented)

---

## PHASE 6: Pages (Active)

### TASK-001: Agent header agency logo
- **Status:** `pending`
- **Scope:** Add 40px agency logo next to agent name in header section
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: navigate to `/agent/[slug]`, verify agency logo visible

### TASK-002: Agent header social links
- **Status:** `pending`
- **Scope:** Add LinkedIn, Facebook, Instagram, website icon links to agent header
- **Files:** `src/app/agent/[slug]/page.tsx`, `src/components/ui/social-links.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: verify social icons render with correct hrefs

### TASK-003: Agent property type donut chart
- **Status:** `pending`
- **Blocked by:** TASK-014
- **Scope:** Add donut chart showing property type breakdown (house/unit/land/townhouse)
- **Files:** `src/app/agent/[slug]/page.tsx`, `src/components/ui/donut-chart.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: verify chart renders with correct percentages

### TASK-004: Agent sales filters ✓
- **Status:** `complete`
- **Scope:** Add sort dropdown + property type + date range filters to sales history table
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify filter controls work, URL params update

### TASK-005: Agent sales mobile cards ✓
- **Status:** `complete`
- **Scope:** Add card layout for sales on mobile (< 768px), keep table on desktop
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: resize to 375px, verify card layout

### TASK-006: Agent sales property details ✓
- **Status:** `complete`
- **Scope:** Add property images, beds/baths/parking icons, sale method badge to sales rows
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify icons + badges render

### TASK-007: Agent reviews sub-ratings chart
- **Status:** `pending`
- **Blocked by:** TASK-015
- **Scope:** Add horizontal bar chart for sub-ratings (Communication, Knowledge, Negotiation, etc.)
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: verify bar chart renders with correct values

### TASK-008: Agent reviews metadata
- **Status:** `pending`
- **Scope:** Add "Would Hire Again" %, buyer/seller badge, verified badge to review cards
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: verify badges render on review cards

### TASK-009: Agency stats section
- **Status:** `pending`
- **Blocked by:** TASK-015
- **Scope:** Add performance grid + property type bar chart to agency profile
- **Files:** `src/app/agency/[slug]/page.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: verify stats section renders

### TASK-010: State page sort controls
- **Status:** `pending`
- **Scope:** Add sort controls for suburbs (Agent Count, Name A-Z, Median Price)
- **Files:** `src/app/agents/[state]/page.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: verify sort dropdown works

### TASK-011: Agencies page sort controls
- **Status:** `pending`
- **Scope:** Add sort controls (Name A-Z, Agent Count, Sales Count, State)
- **Files:** `src/app/agencies/page.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: verify sort dropdown works

### TASK-012: Agencies page card stats
- **Status:** `pending`
- **Scope:** Add total sales value, avg price to agency cards
- **Files:** `src/app/agencies/page.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: verify stats display on cards

---

## PHASE 5: UI Components

### TASK-013: Mobile search overlay
- **Status:** `pending`
- **Scope:** Add fullscreen mobile search overlay with recent searches, top suburbs
- **Files:** `src/components/search/mobile-search-overlay.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Playwright: resize to 375px, verify overlay opens from nav

### TASK-014: DonutChart component
- **Status:** `pending`
- **Scope:** Create reusable donut chart for property type breakdown
- **Files:** `src/components/ui/donut-chart.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Component renders with test data

### TASK-015: BarChart component
- **Status:** `pending`
- **Scope:** Create horizontal bar chart for sub-ratings display
- **Files:** `src/components/ui/bar-chart.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Component renders with test data

### TASK-016: Form primitives
- **Status:** `pending`
- **Scope:** Add Textarea, Select, Checkbox, Radio form components
- **Files:** `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`, `src/components/ui/checkbox.tsx`, `src/components/ui/radio.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] All components render with focus states

### TASK-017: FilterBar clear button
- **Status:** `pending`
- **Scope:** Add "Clear All" button to FilterBar when filters active
- **Files:** `src/components/search/filter-bar.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Button appears when filters active, clears all on click

### TASK-018: FilterBar property chips
- **Status:** `pending`
- **Scope:** Add property type filter chips (House, Unit, Land, Townhouse) to suburb page
- **Files:** `src/components/search/filter-bar.tsx`, `src/app/agents/[state]/[suburb-slug]/page.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Chips toggle and filter agent list

### TASK-019: Button border spec
- **Status:** `pending`
- **Scope:** Change button border from 2px to 3px per spec
- **Files:** `src/components/ui/button.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Visual: border is 3px

### TASK-020: Pagination border fix
- **Status:** `pending`
- **Scope:** Fix inactive pagination buttons to use border-2 (not border-1)
- **Files:** `src/components/ui/pagination.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Visual: all buttons have consistent 2px border

### TASK-021: Skeleton border fix
- **Status:** `pending`
- **Scope:** Change skeleton border from gray-200 to black per spec
- **Files:** `src/components/ui/skeleton.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Visual: skeleton has black border

### TASK-022: AgentCard icons
- **Status:** `pending`
- **Scope:** Add Home/TrendingUp icons for stats, use 3-col grid layout
- **Files:** `src/components/agent/agent-card.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Visual: icons render, 3-col layout

### TASK-023: AgentCard review count
- **Status:** `pending`
- **Scope:** Add review count to rating display ("4.2 (24)" format)
- **Files:** `src/components/agent/agent-card.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Visual: rating shows count in parentheses

### TASK-024: AgentCard location stat
- **Status:** `pending`
- **Scope:** Add state/location stat column per spec
- **Files:** `src/components/agent/agent-card.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm build` passes
  - [ ] Visual: location stat visible

---

## PHASE 3: Data Pipeline

### TASK-025: Pipeline config file
- **Status:** `pending`
- **Scope:** Add `pipeline-config.json` support with locations[], enrichment{}, rate_limits{}, quality{}
- **Files:** `pipeline/config/schema.ts`, `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Config file loads and validates

### TASK-026: Pipeline CLI utilities
- **Status:** `pending`
- **Scope:** Add `pnpm pipeline:validate`, `pipeline:report`, `pipeline:retry`, `pipeline:dedupe` commands
- **Files:** `pipeline/scripts/*.ts`, `package.json`
- **Verification:**
  - [ ] All commands run without error
  - [ ] Help text displays

### TASK-027: License verification
- **Status:** `pending`
- **Scope:** Add NSW Fair Trading license verification integration
- **Files:** `pipeline/agents/license-verifier.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Test with known license number

### TASK-028: Domain rate limiter
- **Status:** `pending`
- **Scope:** Add `DomainRateLimiter` class (30 req/domain/min per spec)
- **Files:** `pipeline/utils/rate-limiter.ts`, `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Rate limiting logs visible

### TASK-029: Transaction wrapper
- **Status:** `pending`
- **Scope:** Wrap storage operations in `db.transaction()` for atomicity
- **Files:** `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Rollback on error

### TASK-030: Merge strategy
- **Status:** `pending`
- **Scope:** Implement data conflict merge (prefer non-null, longer text, unique arrays)
- **Files:** `pipeline/utils/merge.ts`, `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Unit test passes

### TASK-031: Multi-location flag
- **Status:** `pending`
- **Scope:** Add `--locations` flag for multi-location processing
- **Files:** `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [ ] `pnpm pipeline:run --locations "Sydney,Melbourne"` works

### TASK-032: Enrich-only command
- **Status:** `pending`
- **Scope:** Add `pnpm pipeline:enrich` for enrichment-only runs
- **Files:** `pipeline/scripts/enrich.ts`, `package.json`
- **Verification:**
  - [ ] Command runs on existing agents

### TASK-033: Claude structured output
- **Status:** `pending`
- **Scope:** Use Claude SDK `structuredOutput` param instead of manual JSON extraction
- **Files:** `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Output validates against Zod schema

---

## PHASE 8: Voice Polish

### TASK-034: Voice CSS animation
- **Status:** `pending`
- **Scope:** Rename `voice-bar` to `animate-wave`, use height animation (not scaleY)
- **Files:** `src/app/globals.css`, `src/components/voice/AudioWaveform.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Visual: bars animate with height

### TASK-035: Remove unused VoiceButton
- **Status:** `pending`
- **Scope:** Delete VoiceButton.tsx if VoicePanel handles button rendering
- **Files:** `src/components/voice/VoiceButton.tsx`
- **Verification:**
  - [ ] `pnpm build` passes
  - [ ] No import errors

### TASK-036: Voice usage tracking
- **Status:** `pending`
- **Scope:** Add `logVoiceSession()` to database with session duration
- **Files:** `src/lib/voice/tracking.ts`, `src/components/voice/VoiceProvider.tsx`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Session logged to DB

### TASK-037: Voice state colors
- **Status:** `pending`
- **Scope:** Use green (bg-green-500) for listening, blue for speaking
- **Files:** `src/components/voice/VoicePanel.tsx`
- **Verification:**
  - [ ] Visual: colors match spec

### TASK-038: Voice listening status
- **Status:** `pending`
- **Scope:** Add separate "listening" status distinct from "connected" (5 states total)
- **Files:** `src/components/voice/VoiceProvider.tsx`, `src/lib/voice/types.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Status changes during conversation

### TASK-039: Voice context snake_case
- **Status:** `pending`
- **Scope:** Change voice context field names to snake_case per spec
- **Files:** `src/lib/voice/context.ts`, `src/lib/voice/types.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] API response uses snake_case

---

## PHASE 2: Schema Alignment

### TASK-040: pipelineRuns notNull
- **Status:** `pending`
- **Scope:** Add notNull constraint to pipelineRuns.startedAt
- **Files:** `src/lib/db/schema.ts`, `drizzle/migrations/`
- **Verification:**
  - [ ] `pnpm db:generate` creates migration
  - [ ] `pnpm db:migrate` applies

### TASK-041: agent_suburbs index
- **Status:** `pending`
- **Scope:** Add missing index `agent_suburbs_agent_id_idx` (spec line 369)
- **Files:** `src/lib/db/schema.ts`
- **Verification:**
  - [ ] `pnpm db:generate` creates migration
  - [ ] Index visible in DB

### TASK-042: Sales index rename
- **Status:** `pending`
- **Scope:** Rename `sales_agent_sale_date_idx` → `sales_agent_date_idx` per spec
- **Files:** `src/lib/db/schema.ts`
- **Verification:**
  - [ ] Index renamed in DB

### TASK-043: isPrimary boolean mode
- **Status:** `pending`
- **Scope:** Change agent_suburbs.isPrimary from integer to `{ mode: 'boolean' }`
- **Files:** `src/lib/db/schema.ts`
- **Verification:**
  - [ ] `pnpm typecheck` passes
  - [ ] Queries return boolean

---

## PHASE 9: Testing

### TASK-044: Install test framework
- **Status:** `pending`
- **Scope:** Install Vitest + @testing-library/react
- **Files:** `package.json`, `vitest.config.ts`
- **Verification:**
  - [ ] `pnpm test` runs

### TASK-045: Configure test scripts
- **Status:** `pending`
- **Blocked by:** TASK-044
- **Scope:** Add test, test:watch, test:coverage scripts to package.json
- **Files:** `package.json`
- **Verification:**
  - [ ] All scripts run

### TASK-046: Query function tests
- **Status:** `pending`
- **Blocked by:** TASK-044
- **Scope:** Write unit tests for core query functions
- **Files:** `src/lib/db/__tests__/queries.test.ts`
- **Verification:**
  - [ ] `pnpm test` passes

### TASK-047: Component tests
- **Status:** `pending`
- **Blocked by:** TASK-044
- **Scope:** Write tests for critical UI components (Button, Card, AgentCard)
- **Files:** `src/components/__tests__/*.test.tsx`
- **Verification:**
  - [ ] `pnpm test` passes

### TASK-048: E2E Playwright tests
- **Status:** `pending`
- **Scope:** Add E2E tests for critical user flows
- **Files:** `e2e/*.spec.ts`, `playwright.config.ts`
- **Verification:**
  - [ ] `pnpm test:e2e` passes

### TASK-049: CI test runner
- **Status:** `pending`
- **Blocked by:** TASK-044
- **Scope:** Set up GitHub Actions for test runs
- **Files:** `.github/workflows/test.yml`
- **Verification:**
  - [ ] CI runs on PR

---

## Completed Phases (Verified 2026-01-29)

### Phase 1: Next.js Foundation ✓
- [x] Next.js 15.5.7 with App Router
- [x] React 19.0.0
- [x] TypeScript 5.7.0 (strict mode)
- [x] Tailwind CSS 4.0.0 with @theme CSS variables
- [x] Google Fonts: Montserrat, Inter, Fraunces
- [x] Path aliases: `@/*` -> `./src/*`
- [x] ESLint configured
- [x] better-sqlite3 in serverExternalPackages
- [x] pnpm.onlyBuiltDependencies configured

### Phase 2: Database Schema (Core) ✓
- [x] 7 tables: agencies, agents, suburbs, agentSuburbs, sales, reviews, pipelineRuns
- [x] Drizzle ORM 0.38.0 with SQLite
- [x] FTS5 virtual tables: agents_fts, agencies_fts, suburbs_fts (manual SQL)
- [x] Auto-sync triggers for FTS tables
- [x] 17,503 suburbs seeded from Matthew Proctor CSV
- [x] WAL mode, foreign keys enabled
- [x] 27 indexes across all tables

### Phase 3: Data Pipeline (Core) ✓
- [x] `pipeline/scripts/pipeline.ts` v2 CLI with multi-phase architecture
- [x] `pipeline/agents/skills.ts` 3 specialized skill prompts
- [x] `pipeline/agents/index.ts` 3 sub-agent prompts (Sales, Review, License)
- [x] `pipeline/schemas/index.ts` Zod schemas with nullable fields
- [x] Retry logic with exponential backoff (3 retries)
- [x] Parallel agent enrichment (configurable concurrency)
- [x] Pipeline run tracking in `pipeline_runs` table
- [x] Sample data seeder for MVP demos

### Phase 3.5: Query Helpers ✓
- [x] Agent: getAgentBySlug, getAgentsList, getSimilarAgents, getAgentCount, getAgentsBySuburb, getAgentComputedStats
- [x] Agency: getAgencyBySlug, getAgenciesList, getAgencyCount, getTopAgencies, getAgencyRecentSales, getAgencyEnrichment
- [x] Suburb: getSuburbBySlug, getSuburbsList, getNearbySuburbs, getTopSuburbs, getTopAgentsInSuburb, getSuburbMarketStats, getSuburbPricesByType, getNotableSalesInSuburb
- [x] Search: searchFTS, autocompleteFTS (with FTS5 prefix matching)
- [x] Stats: getSiteStats, getStateStats

### Phase 4: API Routes ✓
- [x] GET /api/search — Full-text search with type filtering
- [x] GET /api/search/autocomplete — Prefix suggestions (min 2 chars)
- [x] GET /api/agents — Paginated list with filters (suburb, agency, state, property_type)
- [x] GET /api/agent/[slug] — Single agent with computed stats, sales, reviews
- [x] GET /api/agency/[slug] — Single agency with agents, recent sales, enrichment
- [x] GET /api/suburb/[slug] — Suburb market data, demographics, agents, pagination
- [x] POST /api/voice/signed-url — ElevenLabs signed URL with context overrides
- [x] POST /api/revalidate — ISR trigger with auth
- [x] GET /api/og — Dynamic OG image generation

### Phase 5: UI Components (Core) ✓
- [x] Core: Button (4 variants), Card, Badge (5 variants), Input, StarRating (3 sizes), Pagination, Skeleton, StatCard, Table
- [x] Domain: AgentCard, AgentPhoto (4 sizes), SuburbBadge, PriceDisplay, PropertyTypeIcon
- [x] Layout: Breadcrumb, SearchBar (with autocomplete), FilterBar, GlobalNav (responsive), GlobalFooter (dynamic suburbs)
- [x] Voice: VoiceProvider, VoicePanel (4 states), VoiceButton, AudioWaveform, VoiceContextSetter, VoiceLayoutWrapper, HeroVoiceButton, SuburbVoiceButton, AgencyVoiceButton

### Phase 6: Pages (Core) ✓
- [x] Home page (`/`) with hero, featured suburbs, how-it-works, stats, popular agencies carousel
- [x] Agent profile (`/agent/[slug]`) with stats, sales (20/page), reviews (10/page), similar agents
- [x] Suburb listing (`/agents/[state]/[suburb-slug]`) with market overview, price table, notable sales, agents (20/page), nearby suburbs
- [x] Agency profile (`/agency/[slug]`) with agent roster, top suburbs, recent sales (20)
- [x] Agencies list (`/agencies`) with state filtering, pagination (24/page)
- [x] State listing (`/agents/[state]`) with suburb grid (48/page)
- [x] Agents hub (`/agents`) with state cards
- [x] Loading skeletons for all dynamic pages
- [x] Global error boundary

### Phase 6: Pages (Polish - 2026-01-29) ✓
- [x] Agent profile: sales sort/filter (date, price high/low, property type)
- [x] Agent profile: mobile card layout for sales
- [x] Agent profile: property images, beds/baths/parking icons, sale method badges
- [x] Agency profile: logo display (6.4.1)
- [x] Agency profile: agent roster sort controls (6.4.4)
- [x] Agency profile: top suburbs covered table (6.4.6)
- [x] Agency profile: recent sales with agent attribution (6.4.7)
- [x] Suburb page: market overview paragraph (6.3.5)
- [x] Suburb page: price by property type table (6.3.6)
- [x] Suburb page: notable recent sales cards (6.3.7)

### Phase 7: SEO ✓
- [x] sitemap.ts — Split into index + 4 sub-sitemaps
- [x] Sitemap priorities: suburbs 0.9, agents 0.8, agencies 0.7, static 0.5
- [x] robots.ts — Allow crawlers, block /api/*
- [x] JSON-LD: RealEstateAgent, Organization, Review, AggregateRating, BreadcrumbList, ItemList
- [x] Metadata helpers: agentMetadata, suburbMetadata, agencyMetadata, stateMetadata
- [x] Title templates per spec
- [x] OG image generation via @vercel/og
- [x] Canonical tags on all pages

### Phase 8: Voice Integration (Core) ✓
- [x] @elevenlabs/react integration with useConversation
- [x] Voice types, prompts, context builders, tools in `src/lib/voice/`
- [x] VoiceProvider with session management + 5min timeout
- [x] VoicePanel with all UI states (idle, connecting, connected, error)
- [x] VoiceLayoutWrapper for page type detection
- [x] VoiceContextSetter for personalized labels
- [x] 6 Navigator tools + 1 Assistant tool
- [x] Signed URL generation with context overrides
- [x] Mode switching via custom events

---

## Key Learnings

- better-sqlite3 needs `serverExternalPackages` in next.config.ts
- pnpm 10: `pnpm.onlyBuiltDependencies` in package.json for native modules
- Tailwind 4: CSS @theme, no tailwind.config.js
- ESLint 9: `eslint .` not `next lint`
- FTS5: manual SQL via db.exec() (not in Drizzle journal)
- Next.js 15: params/searchParams are Promises — must await
- Voice: VoiceProvider must wrap app in layout.tsx
- ElevenLabs: POST to `get-signed-url` (hyphen not underscore)
- Pipeline: exclude from tsconfig.json to avoid Next.js build conflicts
- Claude Agent SDK: query() returns AsyncGenerator, iterate with `for await`
- SQLite ALTER TABLE: run manually when drizzle-kit push would delete FTS tables

### Build Environment
- **NODE_ENV**: Only use `development`, `production`, or `test` — non-standard values cause webpack chunk mismatches
- **Corrupted .next cache**: Run `rm -rf .next && pnpm build` for strange webpack errors

### SSR & Static Generation
- **Browser-only libraries**: Use `dynamic(() => import(...), { ssr: false })` for @elevenlabs/react
- **React APIs in shared components**: Need `'use client'` directive for forwardRef, useRef, useState

---

## Build Status

Last verified: 2026-01-29

- [x] TypeScript: `pnpm typecheck` passes
- [x] ESLint: `pnpm lint` passes
- [x] Build: `pnpm build` passes (21 routes)
- [ ] Tests: No test suite (Phase 9)
- [x] Sample data seeded
- [x] Voice working end-to-end

---

## Decisions Made

| # | Question | Decision |
|---|----------|----------|
| 1 | Image storage | Direct URLs (no download) |
| 2 | Pipeline hosting | Local |
| 3 | Response wrapper | Flatten (remove `{success,data}`) |
| 4 | Demographics | Skip for MVP |
| 5 | Market stats | Skip for MVP |
| 6 | Timestamps | Keep integer |
| 7 | Column naming | Keep `lat/lng` |
| 8 | Computed stats | Query-time calculation |
| 9 | market_share | Skip for MVP |
| 10 | GlobalNav links | Keep current (Agents/Agencies) |

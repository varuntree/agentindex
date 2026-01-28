# AgentIndex Implementation Plan

> **prompt_build** and **prompt_plan**: Read `AGENTS.md` at the beginning of every conversation before taking any action. It contains critical build fixes and gotchas.

Last updated: 2026-01-29 — Comprehensive audit complete via 25 parallel agents (re-verified)

---

## Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Next.js Setup | **Complete** | Next.js 15, React 19, Tailwind 4, TypeScript 5 |
| Phase 2: Database Schema | **~95%** | 7 tables, FTS5, minor naming/constraint gaps |
| Phase 3: Data Pipeline | **~70%** | Core works, missing image/config/utils/transactions |
| Phase 3.5: Query Helpers | **~75%** | Core queries done, missing computed stats + enrichment |
| Phase 4: API Routes | **~90%** | Endpoints work, response shape + field deviations |
| Phase 5: UI Components | **~70%** | 19 components, border/font/layout spec gaps |
| Phase 6: Pages | **~70%** | All pages exist, section gaps (suburb page improved) |
| Phase 7: SEO | **Complete** | Sitemap split, JSON-LD enhanced, metadata titles updated |
| Phase 8: Voice Integration | **~95%** | Working, minor CSS + tracking polish |
| Phase 9: Testing & QA | **NOT STARTED** | No test framework |

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

## HIGH PRIORITY — API & Data (Phase 3.5 + 4)

### API Response Shape (affects all consumers)

- [x] **4.5** — All endpoints: Flatten responses (remove `{success,data}` wrapper, return data directly)
- [ ] **4.6** — `/api/agents`: Fix sort param values (spec: `sales_count`/`avg_price`/`name`; impl: `rating`/`sales`/`name`/`quality`)
- [ ] **4.7** — `/api/agents`: Add `suburb` context object when filtering by suburb
- [ ] **4.8** — `/api/agents`: Fix pagination field name (`totalPages` → `pages` per spec)
- [ ] **4.9** — `/api/voice/signed-url`: Change request body to use separate slug fields (`agentSlug`, `agencySlug`, `suburbSlug`) per spec
- [x] **4.3** — `/api/suburb/[slug]`: Add `demographics`, `agents` list, `pagination` params

**Playwright verify:** `fetch('/api/agents?suburb=bondi-beach-nsw')` → check response includes suburb stats.

### Query Enrichment (Phase 3.5)

- [x] **3.5.1** — `getSuburbMarketStats`: Add YoY price change, clearance rate, rental yield, avg days on market
- [x] **3.5.2** — `getSuburbMarketStats`: Add demographics (population, median_age, median_income)
- [ ] **3.5.3** — Agent profile: Add computed stats object (median_sale_price, avg_days_on_market, sales_last_6_months, min/max_sale_price)
- [ ] **3.5.4** — `getAgencyBySlug`: Return logoUrl, avgSalePrice, topSuburbs array, market_share_suburb
- [ ] **3.5.5** — Agency: Add recent_sales query with agent attribution (not agent aggregates)
- [ ] **3.5.6** — Agent list: Add per-suburb sales stats (sales_count_suburb, avg_sale_price_suburb)
- [ ] **3.5.7** — Search results: Add photo_url, suburbs[], total_sales_count, avg_sale_price to agent results
- [ ] **3.5.8** — Suburb context: Add salesCount12mo, medianDom12mo to voice context builder

---

## HIGH PRIORITY — Pages (Phase 6)

### Homepage (`/`)

- [x] **6.1.1** — Add "Popular Agencies" carousel section (spec 1.5: 8 agency logos)
- [x] **6.1.2** — Suburb cards: Add median price + postcode display
- [x] **6.1.3** — Hero: Add Voice Navigator button ("Ask me to find an agent")
- [x] **6.1.4** — Stats: Add green vertical separators between stats
- [x] **6.1.5** — How It Works: Rename steps to match spec (Search/Browse Data/Talk vs Search/Compare/Connect)

**Playwright verify:** Navigate to `/`, screenshot, verify carousel + suburb card fields + voice button.

### Agent Profile (`/agent/[slug]`)

- [ ] **6.2.1** — Header: Add agency logo (40px height)
- [ ] **6.2.2** — Header: Add social links (LinkedIn, Facebook, Instagram, website)
- [ ] **6.2.3** — Stats: Add property type breakdown donut chart
- [ ] **6.2.4** — Sales: Add sort dropdown + property type/date filters
- [ ] **6.2.5** — Sales: Add card layout for mobile (currently table everywhere)
- [ ] **6.2.6** — Sales: Add property images, beds/baths/parking icons, sale method badge
- [ ] **6.2.7** — Reviews: Add sub-ratings bar chart (Communication, Knowledge, Negotiation, Responsiveness, Marketing)
- [ ] **6.2.8** — Reviews: Add "Would Hire Again" %, buyer/seller badge, verified badge
- [ ] **6.2.9** — Reviews: Add pagination (currently shows all, spec: 10/page)
- [ ] **6.2.10** — Voice button: Change label to "Talk to [FirstName]'s Assistant"
- [ ] **6.2.11** — Stats: Rename "Total Sales" to "Properties Sold (12mo)", add "Sale Price Accuracy"
- [ ] **6.2.12** — Similar agents heading: "Similar Agents in [Primary Suburb]", add review count to cards

**Playwright verify:** Navigate to `/agent/[slug]`, screenshot, verify logo + social links + charts + sales filters.

### Suburb Listing (`/agents/[state]/[suburb-slug]`)

- [x] **6.3.1** — Header: Add postcode in heading ✅ (verified present)
- [x] **6.3.2** — Header: Add YoY price change indicators (+X% arrow) ✅ (verified present)
- [x] **6.3.3** — Header: Add Avg Days on Market, Total Sales 12mo, Clearance Rate stats ✅ (6 stats present)
- [ ] **6.3.4** — Header: Add Voice button ("Help me find an agent in [Suburb]")
- [ ] **6.3.5** — Add Suburb Stats section: market overview text paragraph (150 words)
- [ ] **6.3.6** — Add Suburb Stats section: median price by property type table (Houses/Apartments/Townhouses/Land)
- [ ] **6.3.7** — Add Suburb Stats section: 3 notable recent sales with cards
- [ ] **6.3.8** — Header: Add agent count subtitle ("X real estate agents" below h1)

**Playwright verify:** Navigate to `/agents/nsw/bondi-beach-nsw`, screenshot, verify stats section present.

### Agency Profile (`/agency/[slug]`)

- [ ] **6.4.1** — Header: Display agency logo (currently missing, spec: 300x150px)
- [ ] **6.4.2** — Header: Add Voice Receptionist button ("Talk to [Agency] Reception")
- [ ] **6.4.3** — Header: Add Avg Sale Price stat (4th stat card)
- [ ] **6.4.4** — Agent Roster: Add sort controls (Sales Count, Rating, Name)
- [ ] **6.4.5** — Add Agency Stats section: performance grid + property type bar chart
- [ ] **6.4.6** — Add Agency Stats section: Top 10 suburbs covered table
- [ ] **6.4.7** — Recent Sales: Show individual property sales (not agent aggregates) with columns: property+image, agent, price, date, type

**Playwright verify:** Navigate to `/agency/[slug]`, screenshot, verify logo + voice button + stats section.

### State/Agencies Pages

- [ ] **6.5.1** — State page: Add sort controls for suburbs (Agent Count, Name A-Z, Median Price)
- [ ] **6.5.2** — Agencies page: Add sort controls (Name A-Z, Agent Count, Sales Count, State)
- [ ] **6.5.3** — Agencies page: Add agency stats to cards (total sales value, avg price)

---

## HIGH PRIORITY — Components (Phase 5)

### Navigation

- [x] **5.1** — GlobalNav: Add Voice Navigator button ("Ask Navigator")
- [ ] **5.10** — GlobalFooter: Add About section with tagline + description (50 words)
- [ ] **5.11** — GlobalFooter: Add Contact link to legal section
- [ ] **5.4** — GlobalFooter: Make suburb links dynamic from DB (currently hardcoded)
- [x] **5.13** — ~~GlobalNav: Add Suburbs/About links~~ → Keep current nav (decision made)

**Playwright verify:** Screenshot nav, verify voice button + all links. Screenshot footer, verify About section.

### Missing Components

- [ ] **5.5** — Add mobile search overlay component (fullscreen, large input, recent searches, top suburbs)
- [ ] **5.6** — Add form primitives: Textarea, Select, Checkbox, Radio
- [ ] **5.2** — FilterBar: Add "Clear All" button
- [ ] **5.3** — FilterBar: Add property type chips on suburb page
- [ ] **5.14** — Add DonutChart component for property type breakdown
- [ ] **5.15** — Add BarChart component for sub-ratings display

### Spec Alignment

- [ ] **5.12** — Button: Change border from 2px to 3px per spec
- [ ] **5.9** — Pagination: Fix border consistency (inactive uses `border` 1px, should be `border-2`)
- [x] **5.7** — StatCard: Change font from text-3xl to text-4xl per spec
- [ ] **5.16** — Skeleton: Change border from border-gray-200 to border-black per spec
- [ ] **CQ.2** — AgentCard: Add Home/TrendingUp icons for stats, 3-col grid layout
- [ ] **CQ.3** — AgentCard: Add review count in rating display (show "4.2 (24)" format)
- [ ] **CQ.4** — AgentCard: Add state/location stat column per spec

**Playwright verify:** Screenshot button, pagination, stat card; compare border/font to spec.

---

## ~~HIGH PRIORITY — SEO (Phase 7)~~ **COMPLETE**

### Sitemap

- [x] **7.1** — Split sitemap into index + 4 files: agents, suburbs, agencies, pages
- [x] **7.2** — Fix changefreq: suburbs weekly, agents/agencies monthly, static yearly
- [x] **7.10** — Fix priorities: static pages 0.5 (not 1.0), agencies 0.7/monthly

### JSON-LD Schemas

- [x] **7.3** — Agent: Add `url`, `jobTitle: "Real Estate Agent"`, `worksFor.url`, `review` array
- [x] **7.4** — Agent: Change `areaServed` from `Place` to `City` type
- [x] **7.5** — Agent: Fix `reviewCount` vs `ratingCount` inconsistency
- [x] **7.6** — Agency: Add `aggregateRating`, `employee` array, full `areaServed` list
- [x] **7.7** — Suburb ItemList: Add agent `aggregateRating` + `url` to each ListItem
- [x] **7.11** — Add BreadcrumbList schema to agent/agency pages (uses new helpers)

### Metadata

- [x] **7.8** — Suburb title: Add "Best", year (2026), postcode per spec
- [x] **7.9** — Homepage SearchAction: Fix URL (`/search?q=` not `/agents?q=`)
- [x] **7.12** — Agent title: Add agency name, fix separator
- [x] **7.13** — Agency title: Fix format
- [x] **7.14** — State title: Add year (2026)

---

## MEDIUM PRIORITY — Pipeline (Phase 3)

- [x] **3.1** — ~~Image download system~~ → Using direct URLs (decision made)
- [ ] **3.4** — Add config file support (`pipeline-config.json` with locations[], enrichment{}, rate_limits{}, quality{})
- [ ] **3.3** — Add CLI utility commands: `pnpm pipeline:validate`, `pnpm pipeline:report`, `pnpm pipeline:retry`, `pnpm pipeline:dedupe`
- [ ] **3.2** — Add license verification integration (NSW Fair Trading)
- [ ] **3.5** — Add per-domain rate limiting via `DomainRateLimiter` class (spec: 30 req/domain/min)
- [ ] **3.6** — Wrap storage operations in `db.transaction()` for atomicity
- [ ] **3.7** — Implement merge strategy for data conflicts (prefer non-null, longer text, unique arrays)
- [ ] **3.8** — Add `--locations` flag for multi-location processing
- [ ] **3.9** — Add `pnpm pipeline:enrich` command for enrichment-only runs
- [ ] **3.10** — Use Claude SDK `structuredOutput` param instead of manual JSON extraction

---

## MEDIUM PRIORITY — Voice Polish (Phase 8)

- [ ] **8.5** — CSS: Rename `voice-bar` to `animate-wave`, use height animation per spec (currently uses scaleY transform)
- [ ] **8.6** — Remove unused VoiceButton.tsx (VoicePanel handles button rendering)
- [ ] **8.7** — Add usage tracking: `logVoiceSession()` to database with session duration
- [ ] **8.8** — VoicePanel: Use green (bg-green-500) for listening state, blue for speaking (currently uses bg-primary for both)
- [ ] **8.9** — Add separate "listening" status distinct from "connected" (spec: 5 states, impl: 4)
- [ ] **8.10** — Voice context field names: use snake_case per spec (currently camelCase, non-breaking but inconsistent)

---

## MEDIUM PRIORITY — Schema Alignment (Phase 2)

- [x] **2.1** — ~~Rename lat/lng~~ → Keep as-is (decision made)
- [x] **2.2** — ~~Timestamp storage~~ → Keep integer mode (decision made)
- [ ] **2.3** — Add notNull constraint to pipelineRuns.startedAt
- [ ] **2.4** — Add missing index: `agent_suburbs_agent_id_idx` (spec line 369)
- [ ] **2.5** — Fix index name: `sales_agent_sale_date_idx` → `sales_agent_date_idx` per spec
- [ ] **2.6** — agent_suburbs.isPrimary: Change from plain integer to `{ mode: 'boolean' }`

---

## LOW PRIORITY — Testing (Phase 9)

- [ ] **9.1** — Install Vitest + @testing-library/react
- [ ] **9.2** — Configure test scripts in package.json
- [ ] **9.3** — Write unit tests for query functions
- [ ] **9.4** — Write component tests for critical UI
- [ ] **9.5** — Add E2E tests with Playwright
- [ ] **9.6** — Set up CI test runner

---

## Completed Phases (Verified)

### Phase 1: Next.js Foundation
- [x] Next.js 15.1.0 with App Router
- [x] React 19.0.0
- [x] TypeScript 5.7.0 (strict mode)
- [x] Tailwind CSS 4.0.0 with @theme CSS variables
- [x] Google Fonts: Montserrat, Inter, Fraunces
- [x] Path aliases: `@/*` -> `./src/*`
- [x] ESLint configured
- [x] better-sqlite3 in serverExternalPackages

### Phase 2: Database Schema
- [x] 7 tables: agencies, agents, suburbs, agentSuburbs, sales, reviews, pipelineRuns
- [x] Drizzle ORM 0.38.0 with SQLite
- [x] FTS5 virtual tables: agents_fts, agencies_fts, suburbs_fts (manual SQL)
- [x] Auto-sync triggers for FTS tables
- [x] 17,503 suburbs seeded from Matthew Proctor CSV
- [x] WAL mode, foreign keys enabled
- [x] Comprehensive indexes

### Phase 3: Data Pipeline (Core)
- [x] `pipeline/scripts/pipeline.ts` v2 CLI with multi-phase architecture
- [x] `pipeline/agents/skills.ts` specialized skill prompts
- [x] `pipeline/schemas/index.ts` Zod schemas with nullable fields
- [x] Retry logic with exponential backoff (3 retries)
- [x] Parallel agent enrichment (configurable concurrency)
- [x] Pipeline run tracking in `pipeline_runs` table
- [x] Sample data seeder for MVP demos

### Phase 3.5: Query Helpers (Core)
- [x] Agent queries: getAgentBySlug, getAgentsList, getSimilarAgents, getAgentCount
- [x] Agency queries: getAgencyBySlug, getAgenciesList, getAgencyCount, getTopAgencies
- [x] Suburb queries: getSuburbBySlug, getSuburbsList, getNearbySuburbs, getTopSuburbs, getTopAgentsInSuburb
- [x] Search queries: searchFTS, autocompleteFTS (with FTS5 fallback)
- [x] Stats queries: getSiteStats, getStateStats, getSuburbMarketStats (partial)

### Phase 4: API Routes (Core)
- [x] GET /api/search — Full-text search
- [x] GET /api/search/autocomplete — Prefix suggestions
- [x] GET /api/agents — Paginated list with filters
- [x] GET /api/agent/[slug] — Single agent with relations
- [x] GET /api/agency/[slug] — Single agency with agents
- [x] GET /api/suburb/[slug] — Suburb market data (partial)
- [x] POST /api/voice/signed-url — ElevenLabs signed URL with overrides
- [x] POST /api/revalidate — ISR trigger with auth
- [x] GET /api/og — Dynamic OG image generation

### Phase 5: UI Components (Core)
- [x] Core: Button, Card, Badge, Input, StarRating, Pagination, Skeleton, StatCard
- [x] Domain: AgentCard, AgentPhoto, SuburbBadge, PriceDisplay, PropertyTypeIcon, Table
- [x] Layout: Breadcrumb, SearchBar, FilterBar, GlobalNav, GlobalFooter
- [x] Voice: VoiceProvider, VoicePanel, VoiceButton, AudioWaveform, VoiceContextSetter, VoiceLayoutWrapper, HeroVoiceButton

### Phase 6: Pages (Core)
- [x] Home page (`/`) with hero, featured suburbs, how-it-works, stats, popular agencies carousel
- [x] Agent profile (`/agent/[slug]`) with sales, reviews, similar agents
- [x] Suburb listing (`/agents/[state]/[suburb-slug]`) with filters, pagination, nearby suburbs
- [x] Agency profile (`/agency/[slug]`) with agent roster
- [x] Agencies list (`/agencies`) with state filtering
- [x] State listing (`/agents/[state]`) with suburb grid
- [x] Agents hub (`/agents`) with state cards
- [x] Loading skeletons for all dynamic pages
- [x] Global error boundary

### Phase 7: SEO (Complete)
- [x] sitemap.ts — Split into index + 4 sub-sitemaps (static, agents, suburbs, agencies)
- [x] Sitemap priorities: suburbs 0.9, agents 0.8, agencies 0.7, static 0.5
- [x] Sitemap changefreq: suburbs weekly, agents/agencies monthly, static yearly
- [x] robots.ts — Allow crawlers, block /api/*
- [x] JSON-LD: RealEstateAgent with url, jobTitle, worksFor.url, review array, City areaServed
- [x] JSON-LD: Agency with aggregateRating, employee array, areaServed list
- [x] JSON-LD: Suburb ItemList with agent aggregateRating + url
- [x] JSON-LD: BreadcrumbList on agent/agency/suburb pages (new helpers)
- [x] JSON-LD: Homepage SearchAction URL fixed (/search?q=)
- [x] Metadata helpers: agentMetadata, suburbMetadata, agencyMetadata, stateMetadata
- [x] Metadata titles: Agent "[Name] — Real Estate Agent | [Agency] | AgentIndex"
- [x] Metadata titles: Suburb "Best Real Estate Agents in [Suburb], [State] [Postcode] — 2026 | AgentIndex"
- [x] Metadata titles: Agency "[Agency] — Agents, Reviews & Sales | AgentIndex"
- [x] Metadata titles: State "Real Estate Agents in [State] — 2026 | AgentIndex"
- [x] OG image generation via @vercel/og
- [x] Canonical tags on all pages
- [x] metadataBase configured

### Phase 8: Voice Integration
- [x] @elevenlabs/react integration with useConversation
- [x] Voice types, prompts, context builders, tools
- [x] VoiceProvider with session management + 5min timeout
- [x] VoicePanel with all UI states (idle, connecting, connected, error)
- [x] VoiceLayoutWrapper for page type detection
- [x] VoiceContextSetter for personalized labels
- [x] 6 Navigator tools + 1 Assistant tool
- [x] Mode switching via custom events
- [x] ElevenLabs agent configured (ID: agent_1201kg32hgw3ebvskwnngc4qcy8w)

---

## Key Learnings

- better-sqlite3 needs `serverExternalPackages` in next.config.ts
- pnpm 10: `pnpm.onlyBuiltDependencies` in package.json for native modules
- Tailwind 4: CSS @theme, no tailwind.config.js
- ESLint 9: `eslint .` not `next lint`
- FTS5: manual SQL via db.exec() (not in Drizzle journal)
- Next.js 15: params/searchParams are Promises — must await
- SuburbBadge: route must be `/agents/{state}/{slug}`
- Voice: VoiceProvider must wrap app in layout.tsx
- ElevenLabs: POST to `get-signed-url` (hyphen not underscore)
- VoiceLayoutWrapper: client wrapper using usePathname() for page detection
- Pipeline: exclude from tsconfig.json to avoid Next.js build conflicts
- Claude Agent SDK: query() returns AsyncGenerator, iterate with `for await`
- Sample data seeder: MVP demos while AI pipeline is refined
- SQLite ALTER TABLE for adding columns: run manually when drizzle-kit push would delete FTS tables

### Build Environment
- **NODE_ENV**: Only use `development`, `production`, or `test` — non-standard values cause webpack chunk mismatches, corrupted cache, and `.nft.json` trace errors
- **Corrupted .next cache**: When seeing strange webpack errors (`Cannot find module './15.js'`, `pages-manifest.json` not found), run `rm -rf .next && pnpm build`

### SSR & Static Generation
- **Browser-only libraries**: Libraries like `@elevenlabs/react` that use WebSocket, MediaDevices, etc. must be dynamically imported with `ssr: false` to avoid `useRef` null errors during prerender
- **React APIs in shared components**: Components using `forwardRef`, `useRef`, `useState` need `'use client'` directive even if they don't directly call hooks
- **Client wrappers for SSR-safe voice**: Created HeroVoiceButton client component to handle voice interactions in SSR contexts (hero sections, static pages)

### Config Files
- **pnpm-workspace.yaml**: Must be valid YAML; `onlyBuiltDependencies` belongs in `package.json` under `pnpm` key, not in workspace file
- **agent-ralph-ui isolation**: Separate Vite project must be excluded from pnpm workspace, tsconfig.json, eslint, and Next.js output tracing to prevent build contamination

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

## Current Database State

| Entity | Count | Status |
|--------|-------|--------|
| Suburbs | 17,503 | Seeded from CSV |
| Agents | 7 | Sample data |
| Agencies | 3 | Sample data |
| Sales | 14 | Sample data |
| Reviews | 12 | Sample data |
| FTS Tables | 3 | Populated |

---

## Decisions Made

| # | Question | Decision |
|---|----------|----------|
| 1 | Image storage | Direct URLs (no download, already implemented) |
| 2 | Pipeline hosting | Local |
| 3 | Response wrapper | Flatten (remove `{success,data}` wrapper) |
| 4 | Demographics | Skip for MVP, hide section |
| 5 | Market stats | Skip for MVP |
| 6 | Timestamps | Keep integer (works fine) |
| 7 | Column naming | Keep `lat/lng` (works fine) |
| 8 | Computed stats | Query-time calculation |
| 9 | market_share | Skip for MVP |
| 10 | GlobalNav links | Keep current (Agents/Agencies) |

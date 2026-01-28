# AgentIndex Implementation Plan

Last updated: 2026-01-29 — Comprehensive audit complete via 25 parallel agents

---

## Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Next.js Setup | **Complete** | Next.js 15, React 19, Tailwind 4, TypeScript 5 |
| Phase 2: Database Schema | **Complete** | 7 tables, FTS5, 17,503 suburbs seeded |
| Phase 3: Data Pipeline | **~70%** | Core pipeline works, missing image/config/utils |
| Phase 3.5: Query Helpers | **~75%** | Core queries done, missing computed stats + enrichment |
| Phase 4: API Routes | **~95%** | Endpoints work, response shape deviations |
| Phase 5: UI Components | **~75%** | 19 components, missing primitives + spec alignment |
| Phase 6: Pages | **~65%** | All pages exist, significant section gaps |
| Phase 7: SEO | **~70%** | Core SEO done, sitemap/JSON-LD gaps |
| Phase 8: Voice Integration | **~95%** | Working, minor polish needed |
| Phase 9: Testing & QA | **NOT STARTED** | No test framework |

---

## CRITICAL BLOCKERS

None. All blocking items resolved.

---

## HIGH PRIORITY — API & Data (Phase 3.5 + 4)

### API Response Shape (affects all consumers)

- [ ] **4.5** — All endpoints: Decide on response wrapper (`{success,data}` vs flat per spec)
- [ ] **4.6** — `/api/agents`: Fix sort param values (spec: `sales_count`/`avg_price`/`name`; impl: `rating`/`sales`/`name`/`quality`)
- [ ] **4.7** — `/api/agents`: Add `suburb` context object when filtering by suburb
- [x] **4.3** — `/api/suburb/[slug]`: Add `demographics`, `agents` list, `pagination` params

**Playwright verify:** `fetch('/api/agents?suburb=bondi-beach-nsw')` → check response includes suburb stats.

### Query Enrichment (Phase 3.5)

- [x] **3.5.1** — `getSuburbMarketStats`: Add YoY price change, clearance rate, rental yield, avg days on market
- [x] **3.5.2** — `getSuburbMarketStats`: Add demographics (population, median_age, median_income)
- [ ] **3.5.3** — Agent profile: Add computed stats object (median_sale_price, avg_days_on_market, sales_last_6_months)
- [ ] **3.5.4** — `getAgencyBySlug`: Return logoUrl, avgSalePrice, topSuburbs array
- [ ] **3.5.5** — Agency: Add recent_sales query with agent attribution (not agent aggregates)
- [ ] **3.5.6** — Agent list: Add per-suburb sales stats (sales_count_suburb, avg_sale_price_suburb)
- [ ] **3.5.7** — Search results: Add photo_url, suburbs[], total_sales_count, avg_sale_price to agent results

---

## HIGH PRIORITY — Pages (Phase 6)

### Homepage (`/`)

- [ ] **6.1.1** — Add "Popular Agencies" carousel section (spec 1.5: 8 agency logos)
- [ ] **6.1.2** — Suburb cards: Add median price + postcode display
- [ ] **6.1.3** — Hero: Add Voice Navigator button ("Ask me to find an agent")
- [ ] **6.1.4** — Stats: Add green vertical separators between stats

**Playwright verify:** Navigate to `/`, screenshot, verify carousel + suburb card fields + voice button.

### Agent Profile (`/agent/[slug]`)

- [ ] **6.2.1** — Header: Add agency logo (40px height)
- [ ] **6.2.2** — Header: Add social links (LinkedIn, Facebook, Instagram, website)
- [ ] **6.2.3** — Stats: Add property type breakdown donut chart
- [ ] **6.2.4** — Sales: Add sort dropdown + property type/date filters
- [ ] **6.2.5** — Sales: Add card layout for mobile (currently table everywhere)
- [ ] **6.2.6** — Sales: Add property images, beds/baths/parking icons, sale method badge
- [ ] **6.2.7** — Reviews: Add sub-ratings bar chart (Communication, Knowledge, Negotiation)
- [ ] **6.2.8** — Reviews: Add "Would Hire Again" %, buyer/seller badge, verified badge
- [ ] **6.2.9** — Reviews: Add pagination (currently shows all)
- [ ] **6.2.10** — Voice button: Change label to "Talk to [FirstName]'s Assistant"

**Playwright verify:** Navigate to `/agent/[slug]`, screenshot, verify logo + social links + charts + sales filters.

### Suburb Listing (`/agents/[state]/[suburb-slug]`)

- [ ] **6.3.1** — Header: Add postcode in heading
- [ ] **6.3.2** — Header: Add YoY price change indicators (+X% arrow)
- [ ] **6.3.3** — Header: Add Avg Days on Market, Total Sales 12mo, Price Range stats
- [ ] **6.3.4** — Header: Add Voice button ("Help me find an agent in [Suburb]")
- [ ] **6.3.5** — Add Suburb Stats section: market overview text paragraph
- [ ] **6.3.6** — Add Suburb Stats section: median price by property type table
- [ ] **6.3.7** — Add Suburb Stats section: 3 notable recent sales

**Playwright verify:** Navigate to `/agents/nsw/bondi-beach-nsw`, screenshot, verify postcode + YoY + stats section.

### Agency Profile (`/agency/[slug]`)

- [ ] **6.4.1** — Header: Display agency logo (currently missing)
- [ ] **6.4.2** — Header: Add Voice Receptionist button ("Talk to [Agency] Reception")
- [ ] **6.4.3** — Agent Roster: Add sort controls (Sales Count, Rating, Name)
- [ ] **6.4.4** — Add Agency Stats section: performance grid + property type bar chart
- [ ] **6.4.5** — Add Agency Stats section: Top 10 suburbs covered table
- [ ] **6.4.6** — Recent Sales: Show individual property sales (not agent aggregates)

**Playwright verify:** Navigate to `/agency/[slug]`, screenshot, verify logo + voice button + stats section.

### State/Agencies Pages

- [ ] **6.5.1** — State page: Add sort controls for suburbs
- [ ] **6.5.2** — Agencies page: Add stats display per agency card

---

## HIGH PRIORITY — Components (Phase 5)

### Navigation

- [ ] **5.1** — GlobalNav: Add Voice Navigator button ("Ask Navigator")
- [ ] **5.10** — GlobalFooter: Add About section with tagline + description
- [ ] **5.11** — GlobalFooter: Add Contact link to legal section
- [ ] **5.4** — GlobalFooter: Make suburb links dynamic from DB (currently hardcoded)

**Playwright verify:** Screenshot nav, verify voice button visible. Screenshot footer, verify About section.

### Missing Components

- [ ] **5.5** — Add mobile search overlay component
- [ ] **5.6** — Add form primitives: Textarea, Select, Checkbox, Radio
- [ ] **5.2** — FilterBar: Add "Clear All" button
- [ ] **5.3** — FilterBar: Add property type chips on suburb page

### Spec Alignment

- [ ] **5.12** — Button: Change border from 2px to 3px per spec
- [ ] **5.9** — Pagination: Fix border consistency (inactive uses 1px, should be 2px)
- [ ] **5.7** — StatCard: Change font from text-3xl to text-4xl
- [ ] **CQ.2** — AgentCard: Change layout from flex to grid per spec
- [ ] **CQ.3** — AgentCard: Add agency logo, action buttons, all icons per spec

**Playwright verify:** Screenshot button, pagination, stat card; compare border/font to spec.

---

## HIGH PRIORITY — SEO (Phase 7)

### Sitemap

- [ ] **7.1** — Split sitemap into index + 4 files: agents, suburbs, agencies, pages
- [ ] **7.2** — Fix changefreq: suburbs weekly, agents/agencies monthly, static yearly

### JSON-LD Schemas

- [ ] **7.3** — Agent: Add `url`, `jobTitle`, `worksFor.url`, `review` array
- [ ] **7.4** — Agent: Change `areaServed` from `Place` to `City` type
- [ ] **7.5** — Agent: Fix `reviewCount` vs `ratingCount` inconsistency
- [ ] **7.6** — Agency: Add `aggregateRating`, `employee` array, `areaServed`
- [ ] **7.7** — Suburb ItemList: Add agent `aggregateRating` to each ListItem

### Metadata

- [ ] **7.8** — Suburb title: Add "Best", year (2026), postcode per spec
- [ ] **7.9** — Homepage SearchAction: Fix URL (`/search?q=` not `/agents?q=`)

---

## MEDIUM PRIORITY — Pipeline (Phase 3)

- [ ] **3.1** — Add image download system (agent photos, agency logos)
- [ ] **3.4** — Add config file support (pipeline-config.json)
- [ ] **3.3** — Add CLI utility commands: `validate`, `report`, `retry`, `dedupe`
- [ ] **3.2** — Add license verification integration
- [ ] **3.5** — Add per-domain rate limiting (spec: 30 req/domain/min)
- [ ] **3.6** — Wrap storage operations in transaction
- [ ] **3.7** — Implement merge strategy for data conflicts (preserve best quality)

---

## MEDIUM PRIORITY — Voice Polish (Phase 8)

- [ ] **8.5** — CSS: Rename `voice-bar` to `animate-wave`, use height animation per spec
- [ ] **8.6** — Remove unused VoiceButton.tsx (VoicePanel handles button)
- [ ] **8.7** — Add usage tracking: `logVoiceSession()` to database
- [ ] **8.8** — VoicePanel: Use green (bg-green-500) for listening state, not bg-primary

---

## MEDIUM PRIORITY — Schema Alignment (Phase 2)

- [ ] **2.1** — Decide: Rename lat/lng to latitude/longitude for clarity?
- [ ] **2.2** — Decide: Timestamp storage mode (integer vs text)?
- [ ] **2.3** — Add notNull constraint to pipelineRuns.startedAt

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
- [x] Agency queries: getAgencyBySlug, getAgenciesList, getAgencyCount
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
- [x] Voice: VoiceProvider, VoicePanel, VoiceButton, AudioWaveform, VoiceContextSetter, VoiceLayoutWrapper

### Phase 6: Pages (Core)
- [x] Home page (`/`) with hero, featured suburbs, how-it-works, stats
- [x] Agent profile (`/agent/[slug]`) with sales, reviews, similar agents
- [x] Suburb listing (`/agents/[state]/[suburb-slug]`) with filters, pagination, nearby suburbs
- [x] Agency profile (`/agency/[slug]`) with agent roster
- [x] Agencies list (`/agencies`) with state filtering
- [x] State listing (`/agents/[state]`) with suburb grid
- [x] Agents hub (`/agents`) with state cards
- [x] Loading skeletons for all dynamic pages
- [x] Global error boundary

### Phase 7: SEO (Core)
- [x] sitemap.ts — Dynamic generation from database
- [x] robots.ts — Allow crawlers, block /api/*
- [x] JSON-LD: RealEstateAgent, BreadcrumbList, WebSite, ItemList schemas
- [x] Metadata helpers for all page types
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

## Unresolved Questions

1. **Image storage** — Use local `public/` or external CDN (S3, Cloudflare R2)?
2. **Pipeline hosting** — Run locally, in CI, or as background job?
3. **Response wrapper** — Keep `{success,data}` wrapper or flatten per spec?
4. **Demographics data** — Where to source (ABS, external API)?
5. **Market stats** — Where to source YoY, clearance rate, rental yield?

# AgentIndex Implementation Plan

Last updated: 2026-01-29 — Voice API fixes (4.1, 4.4, CQ.1) complete

---

## Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Next.js Setup | **Complete** | Next.js 15, React 19, Tailwind 4, TypeScript 5 |
| Phase 2: Database Schema | **Complete** | 7 tables, FTS5, 17,503 suburbs seeded |
| Phase 3: Data Pipeline | **Working** | v2 pipeline complete, missing CLI utils + image system |
| Phase 3.5: Query Helpers | **~90%** | Core queries done, missing market stats fields |
| Phase 4: API Routes | **~90%** | Voice endpoint fixed, suburb endpoint needs work |
| Phase 5: UI Components | **~80%** | 19 components, gaps in spec alignment + missing primitives |
| Phase 6: Pages | **~75%** | All pages exist, missing sections per spec |
| Phase 7: SEO | **~85%** | Core SEO done, sitemap/JSON-LD gaps |
| Phase 8: Voice Integration | **Complete** | ElevenLabs agent configured, 6 client tools registered |
| Phase 9: Testing & QA | **NOT STARTED** | No test framework installed |

---

## CRITICAL BLOCKERS

### Phase 8.3 ElevenLabs Setup (COMPLETE)
**Status:** ElevenLabs Conversational AI agent configured and verified.

- [x] **8.3.1** — Navigate to ElevenLabs dashboard (elevenlabs.io)
- [x] **8.3.2** — Create Conversational AI agent "AgentIndex Voice Agent" (ID: agent_1201kg32hgw3ebvskwnngc4qcy8w)
- [x] **8.3.3** — Configure: LLM=gpt-4o, auth enabled, overrides enabled (System prompt, First message)
- [x] **8.3.4** — Register 6 client tools (navigateToPage, searchAgents, filterResults, scrollToSection, activateAssistant, highlightAgent)
- [x] **8.3.5** — Copy Agent ID + API key to `.env.local`
- [x] **8.3.6** — Verify: POST /api/voice/signed-url returns signedUrl with overrides

---

## HIGH PRIORITY GAPS

### API Response Deviations (Phase 4 fixes)

- [x] **4.1** — `/api/voice/signed-url`: Add missing `sessionId`, `expiresAt` fields
- [x] **4.2** — `/api/voice/signed-url`: Already POST per spec
- [ ] **4.3** — `/api/suburb/[slug]`: Add `demographics` object, `agents` list, `pagination`
- [x] **4.4** — Update `src/lib/voice/elevenlabs.ts`: Use POST not GET (also fixed URL path: `get-signed-url` not `get_signed_url`)

**Playwright verify:** Inspect network tab for response shape after changes.

### Page Implementation Gaps (Phase 6 fixes)

#### Homepage (`/`)
- [ ] **6.1.1** — Add "Popular Agencies" carousel (spec section 1.5)
- [ ] **6.1.2** — Suburb cards: add median price + postcode display

**Playwright verify:** Screenshot homepage, verify carousel + suburb card fields.

#### Agent Profile (`/agent/[slug]`)
- [ ] **6.2.1** — Add social links section (LinkedIn, email, phone)
- [ ] **6.2.2** — Add property type breakdown chart
- [ ] **6.2.3** — Add sales sort/filter controls
- [ ] **6.2.4** — Add review sub-ratings (communication, knowledge, negotiation)

**Playwright verify:** Screenshot agent page, verify all sections present.

#### Suburb Listing (`/agents/[state]/[suburb-slug]`)
- [ ] **6.3.1** — Add market overview text paragraph
- [ ] **6.3.2** — Add price-by-property-type table
- [ ] **6.3.3** — Add notable sales section
- [ ] **6.3.4** — Add postcode display in header
- [ ] **6.3.5** — Add Voice button integration

**Playwright verify:** Screenshot suburb page, verify market data sections.

#### Agency Profile (`/agency/[slug]`)
- [ ] **6.4.1** — Display agency logo (currently missing)
- [ ] **6.4.2** — Add Agency Stats section (avgSalePrice, topSuburbs, etc.)
- [ ] **6.4.3** — Replace agent summary with actual Recent Sales list

**Playwright verify:** Screenshot agency page, verify logo + stats + sales.

#### State/Agencies Pages (minor)
- [ ] **6.5.1** — State page: Add sort controls
- [ ] **6.5.2** — Agencies page: Add stats display per agency

### Component Gaps (Phase 5 fixes)

- [ ] **5.1** — GlobalNav: Add Voice Navigator button
- [ ] **5.2** — FilterBar: Add "Clear All" button
- [ ] **5.3** — FilterBar: Add property type chips on suburb page
- [ ] **5.4** — GlobalFooter: Make suburb links dynamic from DB (currently hardcoded)
- [ ] **5.5** — Add mobile search overlay component
- [ ] **5.6** — Add missing form primitives: Textarea, Select, Checkbox, Radio

**Playwright verify:** Screenshot nav, filter bar, footer; verify buttons/links.

### SEO Gaps (Phase 7 fixes)

- [ ] **7.1** — Split sitemap into multiple files: agents, suburbs, agencies, pages
- [ ] **7.2** — Change agent/agency changefreq from weekly to monthly
- [ ] **7.3** — JSON-LD Agent: Add reviews array
- [ ] **7.4** — JSON-LD Agency: Add employees array, employee ratings

### Data/Query Gaps (Phase 3.5 fixes)

- [ ] **3.5.1** — `getSuburbMarketStats`: Add YoY price change, clearance rate, rental yield
- [ ] **3.5.2** — `getSuburbMarketStats`: Add demographics object
- [ ] **3.5.3** — Agent list query: Add detailed aggregations per spec
- [ ] **3.5.4** — `getAgencyBySlug`: Return logoUrl, avgSalePrice, topSuburbs

### Pipeline Gaps (Phase 3 fixes)

- [ ] **3.1** — Add image download system (agent photos, agency logos)
- [ ] **3.2** — Add license verification integration in pipeline flow
- [ ] **3.3** — Add CLI utility commands: `validate`, `report`, `retry`, `dedupe`
- [ ] **3.4** — Add config file support (pipeline.config.json)

### Code Quality

- [x] **CQ.1** — Remove 7 console.log debug statements from VoiceProvider.tsx
- [ ] **CQ.2** — AgentCard: Change layout from flex to grid per spec
- [ ] **CQ.3** — AgentCard: Add missing icons per spec

---

## MEDIUM PRIORITY

### UI Polish (Phase 5)

- [ ] **5.7** — StatCard: Change font from text-3xl to text-4xl per spec
- [ ] **5.8** — Button: Change border-radius from rounded-lg to rounded-md
- [ ] **5.9** — Pagination: Fix inactive border style per spec

**Playwright verify:** Screenshot components, compare to spec.

### DB Schema Alignment (Phase 2)

- [ ] **2.1** — Consider renaming lat/lng to latitude/longitude for clarity
- [ ] **2.2** — Consider timestamp storage mode (integer vs text)

---

## LOW PRIORITY (Phase 9)

### Testing Framework Setup

- [ ] **9.1** — Install test framework (Vitest or Jest)
- [ ] **9.2** — Install @testing-library/react
- [ ] **9.3** — Configure test scripts in package.json
- [ ] **9.4** — Write unit tests for query functions
- [ ] **9.5** — Write component tests for critical UI
- [ ] **9.6** — Add E2E tests with Playwright
- [ ] **9.7** — Set up CI test runner

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
- [x] FTS5 virtual tables: agents_fts, agencies_fts, suburbs_fts
- [x] Auto-sync triggers for FTS tables
- [x] 17,503 suburbs seeded from Matthew Proctor CSV
- [x] WAL mode, foreign keys enabled
- [x] Comprehensive indexes on query patterns

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
- [x] Suburb queries: getSuburbBySlug, getSuburbsList, getNearbySuburbs, getTopSuburbs
- [x] Search queries: searchFTS, autocompleteFTS (with FTS5 fallback handling)
- [x] Stats queries: getSiteStats, getStateStats, getSuburbMarketStats (partial)

### Phase 4: API Routes (Core)
- [x] GET /api/search — Full-text search across entities
- [x] GET /api/search/autocomplete — Prefix-based suggestions
- [x] GET /api/agents — Paginated agent list with filters
- [x] GET /api/agent/[slug] — Single agent with relations
- [x] GET /api/agency/[slug] — Single agency with agents
- [x] GET /api/suburb/[slug] — Suburb market data (partial)
- [x] GET /api/voice/signed-url — ElevenLabs signed URL (needs POST + fields)
- [x] POST /api/revalidate — ISR trigger with auth
- [x] GET /api/og — Dynamic OG image generation

### Phase 5: UI Components (Core)
- [x] Core: Button, Card, Badge, Input, StarRating, Pagination, Skeleton, StatCard
- [x] Domain: AgentCard, AgentPhoto, SuburbBadge, PriceDisplay, PropertyTypeIcon, Table
- [x] Layout: Breadcrumb, SearchBar, FilterBar, GlobalNav, GlobalFooter
- [x] Voice: VoiceProvider, VoicePanel, VoiceButton, AudioWaveform

### Phase 6: Pages (Core)
- [x] Home page (`/`) with hero, featured suburbs, how-it-works, stats
- [x] Agent profile (`/agent/[slug]`) with sales, reviews, similar agents
- [x] Suburb listing (`/agents/[state]/[suburb-slug]`) with filters, pagination
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
- [x] metadataBase configured (agentindex.com.au)

### Phase 8: Voice (Complete)
- [x] @elevenlabs/react v0.13.1 installed
- [x] Voice types, prompts, context builders, tools
- [x] VoiceProvider, VoicePanel, VoiceButton, AudioWaveform components
- [x] VoiceLayoutWrapper integrated into layout.tsx
- [x] Page-specific VoiceContextSetter on agent/agency/suburb pages
- [x] getTopAgentsInSuburb query for suburb voice context
- [x] ElevenLabs agent "AgentIndex Voice Agent" (gpt-4o, 6 client tools)

---

## Key Learnings

- better-sqlite3 needs `serverExternalPackages` in next.config.ts
- pnpm 10: `pnpm.onlyBuiltDependencies` in package.json for native modules
- Tailwind 4: CSS @theme, no tailwind.config.js
- ESLint 9: `eslint .` not `next lint` (deprecated)
- FTS5 migration: manual SQL via db.exec() (not in Drizzle journal)
- Next.js 15: params/searchParams are Promises — must await
- SuburbBadge: route must be `/agents/{state}/{slug}` not `/suburb/{slug}`
- Voice: VoiceProvider must wrap app in layout.tsx to activate
- @elevenlabs/react clientTools type: `Record<string, (params) => Promise<string|number|void>|...>`
- ElevenLabs signed URL: POST endpoint with agent_id in body
- VoiceLayoutWrapper pattern: client wrapper using usePathname() to detect page context
- Pipeline directory must be excluded from tsconfig.json to avoid Next.js build conflicts
- Claude Agent SDK query() returns AsyncGenerator, iterate with `for await`
- SDK options: allowedTools, maxTurns, maxBudgetUsd (no direct 'model' param at top level)
- next.config.ts webpack watchOptions: exclude non-Next.js directories
- AgentPhoto component: needs null checks for firstName/lastName
- Sample data seeder approach: MVP demos while AI pipeline is refined

---

## Build Status

Last verified: 2026-01-29

- [x] TypeScript: `pnpm typecheck` passes
- [x] ESLint: `pnpm lint` passes
- [x] Build: `pnpm build` passes (21 routes)
- [ ] Tests: No test suite (Phase 9)
- [x] Sample data: Seeded via scripts/seed-sample-data.ts
- [x] Voice code: Complete (Phase 8.0-8.2, 8.4)
- [x] Voice active: ElevenLabs configured (Phase 8.3)

---

## Current Database State

| Entity | Count | Status |
|--------|-------|--------|
| Suburbs | 17,503 | Seeded from CSV |
| Agents | 7 | Sample data seeded |
| Agencies | 3 | Sample data seeded |
| Sales | 14 | Sample data seeded |
| Reviews | 12 | Sample data seeded |
| FTS Tables | 3 | Ready (populated) |

---

## Unresolved Questions

1. ~~**ElevenLabs agent** — Created in dashboard yet?~~ RESOLVED: Agent ID `agent_1201kg32hgw3ebvskwnngc4qcy8w`
2. ~~**ElevenLabs LLM** — gpt-4o or claude-3-5-sonnet?~~ RESOLVED: Using gpt-4o
3. **Image storage** — Use local `public/` or external CDN (S3, Cloudflare R2)?
4. **Pipeline hosting** — Run locally, in CI, or as background job?
5. ~~**API spec** — Should voice endpoint use GET or POST?~~ RESOLVED: POST (fixed elevenlabs.ts)

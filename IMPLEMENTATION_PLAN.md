# AgentIndex Implementation Plan

Last updated: 2026-01-28 — comprehensive audit with code verification

---

## Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Next.js Setup | **Complete** | Next.js 15, React 19, Tailwind 4, TypeScript 5 |
| Phase 2: Database Schema | **Complete** | 7 tables, FTS5, 17,503 suburbs seeded |
| Phase 3: Data Pipeline | **NOT STARTED** | Empty `pipeline/` directory - critical blocker |
| Phase 3.5: Query Helpers | **Complete** | 20+ query functions |
| Phase 4: API Routes | **Complete** | 8 API endpoints implemented |
| Phase 5: UI Components | **Complete** | 19 components, all typed |
| Phase 6: Pages | **Complete** | 7 page types with loading skeletons |
| Phase 7: SEO | **Complete** | JSON-LD, sitemap, OG images, canonical tags |
| Phase 8: Voice Integration | **~80% Complete** | Code exists but NOT ACTIVE in app |
| Phase 9: Testing & QA | **NOT STARTED** | No test framework installed |

---

## Critical Path

**BLOCKER:** Phase 3 (Data Pipeline) must complete before Phase 8 (Voice) can demonstrate value. Voice assistants need real agent data for context injection. Without data, the MVP cannot be demonstrated.

**Priority Order:**
1. **Phase 3: Data Pipeline** — CRITICAL, no agents/agencies/sales data exists
2. **Phase 8.X: Voice Activation** — Code exists but not wired into app
3. **Phase 9: Testing** — Quality assurance before launch

---

## Completed Phases (Verified)

### Phase 1: Next.js Foundation ✓
- [x] Next.js 15.1.0 with App Router
- [x] React 19.0.0
- [x] TypeScript 5.7.0 (strict mode)
- [x] Tailwind CSS 4.0.0 with @theme CSS variables
- [x] Google Fonts: Montserrat, Inter, Fraunces
- [x] Path aliases: `@/*` → `./src/*`
- [x] ESLint configured
- [x] better-sqlite3 in serverExternalPackages

### Phase 2: Database Schema ✓
- [x] 7 tables: agencies, agents, suburbs, agentSuburbs, sales, reviews, pipelineRuns
- [x] Drizzle ORM 0.38.0 with SQLite
- [x] FTS5 virtual tables: agents_fts, agencies_fts, suburbs_fts
- [x] Auto-sync triggers for FTS tables
- [x] 17,503 suburbs seeded from Matthew Proctor CSV
- [x] WAL mode, foreign keys enabled
- [x] Comprehensive indexes on query patterns

### Phase 3.5: Query Helpers ✓
- [x] Agent queries: getAgentBySlug, getAgentsList, getSimilarAgents, getAgentCount
- [x] Agency queries: getAgencyBySlug, getAgenciesList, getAgencyCount
- [x] Suburb queries: getSuburbBySlug, getSuburbsList, getNearbySuburbs, getTopSuburbs
- [x] Search queries: searchFTS, autocompleteFTS (with FTS5 fallback handling)
- [x] Stats queries: getSiteStats, getStateStats, getSuburbMarketStats

### Phase 4: API Routes ✓
- [x] GET /api/search — Full-text search across entities
- [x] GET /api/search/autocomplete — Prefix-based suggestions
- [x] GET /api/agents — Paginated agent list with filters
- [x] GET /api/agent/[slug] — Single agent with relations
- [x] GET /api/agency/[slug] — Single agency with agents
- [x] GET /api/suburb/[slug] — Suburb market data
- [x] POST /api/voice/signed-url — ElevenLabs signed URL (functional)
- [x] POST /api/revalidate — ISR trigger with auth
- [x] GET /api/og — Dynamic OG image generation

### Phase 5: UI Components ✓
- [x] Core: Button, Card, Badge, Input, StarRating, Pagination, Skeleton, StatCard
- [x] Domain: AgentCard, AgentPhoto, SuburbBadge, PriceDisplay, PropertyTypeIcon, Table
- [x] Layout: Breadcrumb, SearchBar, FilterBar, GlobalNav, GlobalFooter
- [x] Voice: VoiceProvider, VoicePanel, VoiceButton, AudioWaveform

### Phase 6: Pages ✓
- [x] Home page (`/`) with hero, featured suburbs, how-it-works, stats
- [x] Agent profile (`/agent/[slug]`) with sales, reviews, similar agents
- [x] Suburb listing (`/agents/[state]/[suburb-slug]`) with filters, pagination
- [x] Agency profile (`/agency/[slug]`) with agent roster, recent sales
- [x] Agencies list (`/agencies`) with state filtering
- [x] State listing (`/agents/[state]`) with suburb grid
- [x] Agents hub (`/agents`) with state cards
- [x] Loading skeletons for all dynamic pages
- [x] Global error boundary

### Phase 7: SEO ✓
- [x] sitemap.ts — Dynamic generation from database
- [x] robots.ts — Allow crawlers, block /api/*
- [x] JSON-LD: RealEstateAgent, BreadcrumbList, WebSite, ItemList schemas
- [x] Metadata helpers for all page types
- [x] OG image generation via @vercel/og
- [x] Canonical tags on all pages
- [x] metadataBase configured (agentindex.com.au)

---

## Remaining Work (Priority Order)

### Phase 3: Data Pipeline (NOT STARTED) — CRITICAL

**Status:** Directory structure exists but ALL files are empty/missing.
**Blocker:** Without agent data, the MVP cannot demonstrate value.
**Estimated effort:** 3-5 days

#### 3.1 Create Pipeline Directory Structure
- [ ] **3.1.1** — Create `src/pipeline/` directory (currently doesn't exist)
- [ ] **3.1.2** — Create subdirectories: `schemas/`, `agents/`, `storage/`, `utils/`, `scripts/`

#### 3.2 Zod Output Schemas
**Files to create:** `src/pipeline/schemas/`

- [ ] **3.2.1** — Create `agency.ts` with `AgencyOutput` schema
  - name, slug, logoUrl, description, phone, email, website
  - address, suburb, state, postcode, latitude, longitude
  - googleRating, googleReviewsCount
  - agents: AgentOutput[]
  - dataQualityScore (0-100)

- [ ] **3.2.2** — Create `agent.ts` with `AgentOutput` schema
  - firstName, lastName, slug, photoUrl, bio
  - phone, email, licenseNumber, licenseStatus
  - yearsExperience, languages[], specializations[], propertyTypes[]
  - suburbsServed[], ratings, salesLast12Months
  - sales: SaleOutput[], reviews: ReviewOutput[]
  - dataQualityScore

- [ ] **3.2.3** — Create `sale.ts` with `SaleOutput` schema
  - propertyAddress, suburb, state, postcode, propertyType
  - bedrooms, bathrooms, parking, landSize
  - salePrice, listingPrice, saleDate, listingDate
  - saleMethod, daysOnMarket
  - propertyImages[], sourceUrl

- [ ] **3.2.4** — Create `review.ts` with `ReviewOutput` schema
  - reviewerName, reviewerType, overallRating
  - subRatings (communication, knowledge, negotiation)
  - wouldHireAgain, reviewText, reviewDate
  - source, sourceUrl

- [ ] **3.2.5** — Create `index.ts` barrel export

#### 3.3 Pipeline Orchestrator (Claude Agent SDK)
**Reference:** `ai_docs/claude-agent-sdk.md`
**Files to create:** `src/pipeline/`

- [ ] **3.3.1** — Create `config.ts` — Pipeline configuration types
  - TargetLocation, AgencyList, RunConfig
  - Rate limits, concurrency settings
  - Cost estimation helpers

- [ ] **3.3.2** — Create `orchestrator.ts` — Main pipeline execution
  - Uses Claude Agent SDK `query()` function
  - Spawns sub-agents for parallel research
  - Coordinates Phase 1 (agency discovery) → Phase 2 (enrichment)
  - Implements Promise.allSettled for resilience
  - Tracks pipeline run in database

#### 3.4 Sub-Agents
**Files to create:** `src/pipeline/agents/`

- [ ] **3.4.1** — Create `agency-researcher.ts`
  - Research agency website, team page, contact details
  - Use WebSearch + WebFetch tools
  - Return AgencyOutput with nested partial agents

- [ ] **3.4.2** — Create `agent-researcher.ts`
  - Deep-dive single agent: sales history, reviews
  - Cross-reference multiple sources
  - Return enriched AgentOutput

- [ ] **3.4.3** — Create `license-verifier.ts`
  - Query NSW Fair Trading public register
  - Verify license status, dates, conditions
  - Return verification data

- [ ] **3.4.4** — Create `sales-historian.ts`
  - Aggregate sales from agency sites, Domain, RateMyAgent
  - Normalize address formats
  - Return SaleOutput[]

- [ ] **3.4.5** — Create `review-aggregator.ts`
  - Collect from RateMyAgent, Google, agency sites
  - Normalize rating scales
  - Return ReviewOutput[]

- [ ] **3.4.6** — Create `index.ts` barrel export

#### 3.5 Storage Layer
**Files to create:** `src/pipeline/storage/`

- [ ] **3.5.1** — Create `insert.ts`
  - Batch upsert functions for each entity type
  - Uses Drizzle `onConflictDoUpdate`
  - Transaction wrapper for atomic operations

- [ ] **3.5.2** — Create `merge.ts`
  - Entity deduplication logic
  - Merge strategy (prefer non-null, longer values)
  - Update pipeline_runs table after each run

- [ ] **3.5.3** — Create `index.ts` barrel export

#### 3.6 Utilities
**Files to create:** `src/pipeline/utils/`

- [ ] **3.6.1** — Create `rate-limiter.ts`
  - Per-domain rate limiting (30 req/min per domain)
  - Global concurrency limiter (10 parallel agents)
  - Queue system with wait slots

- [ ] **3.6.2** — Create `dedupe.ts`
  - Agency matching: name.lower() + suburb.lower()
  - Agent matching: firstName + lastName + agencyId
  - Sale matching: normalizeAddress() + saleDate
  - Address normalization (expand abbreviations, remove punctuation)

- [ ] **3.6.3** — Create `image-downloader.ts`
  - Download agent photos to `public/images/agents/`
  - Download agency logos to `public/images/agencies/`
  - 10 concurrent downloads max
  - Skip existing files

- [ ] **3.6.4** — Create `index.ts` barrel export

#### 3.7 CLI Scripts
**Files to create:** `src/pipeline/scripts/`

- [ ] **3.7.1** — Create `run.ts` — Main pipeline execution
  ```bash
  pnpm pipeline:run --location "Bondi Beach, NSW" --agencies "Ray White,McGrath"
  pnpm pipeline:run --location "Bondi Beach" --discover-agencies --limit 10
  ```

- [ ] **3.7.2** — Create `enrich.ts` — Enrichment pass for low-quality records
  ```bash
  pnpm pipeline:enrich --entity agents --where "dataQualityScore < 50"
  ```

- [ ] **3.7.3** — Create `dedupe.ts` — Deduplication utility
  ```bash
  pnpm pipeline:dedupe --dry-run
  ```

- [ ] **3.7.4** — Add npm scripts to package.json

#### 3.8 Bondi Beach MVP Run
- [ ] **3.8.1** — Create `pipeline-config.bondi.json` targeting Bondi Beach agencies
- [ ] **3.8.2** — Run pipeline for top 10 Bondi Beach agencies:
  - Ray White Bondi Beach
  - McGrath Estate Agents Bondi
  - Belle Property Bondi Beach
  - LJ Hooker Bondi Beach
  - Raine & Horne Bondi Beach
  - Richardson & Wrench Bondi Beach
  - PPD Real Estate
  - Laing+Simmons Bondi Beach
  - First National Bondi Beach
  - Century 21 Bondi Beach
- [ ] **3.8.3** — Validate 200+ agents collected
- [ ] **3.8.4** — Verify avg data quality score >= 60
- [ ] **3.8.5** — Verify images downloaded to public/images/

**Playwright verify:** Start dev server, visit `/agents/nsw/bondi-beach`, confirm agent cards render with photos, ratings, sales counts.

**Success Metrics:**
| Metric | Target |
|--------|--------|
| Agencies covered | 20+ |
| Agents collected | 200+ |
| Avg data quality score | 60+ |
| Pipeline success rate | 90%+ |
| Runtime per agency | <5 min |
| Sales per agent (avg) | 5+ |
| Reviews per agent (avg) | 3+ |

---

### Phase 8: Voice Integration (80% Complete → Activation Needed)

**Status:** All code exists but VoiceProvider is NOT integrated into app layout.
**Blocker:** Phase 3 must complete first (voice needs agent data for context).

#### 8.0 Already Implemented ✓
- [x] VoiceProvider.tsx — Context provider with useConversation hook
- [x] VoicePanel.tsx — Floating UI with states (idle, connecting, connected, error)
- [x] VoiceButton.tsx — Simple button with pulse animation
- [x] AudioWaveform.tsx — 5-bar animated waveform
- [x] /api/voice/signed-url — Full endpoint with context fetching
- [x] src/lib/voice/* — Types, prompts, context builders, tools
- [x] @elevenlabs/react installed (v0.13.1)
- [x] Environment variables documented (.env.example)

#### 8.1 Integrate VoiceProvider into App
- [ ] **8.1.1** — Update `src/app/layout.tsx` to wrap app with `<VoiceProvider>`
- [ ] **8.1.2** — Pass default pageType and slug from layout
- [ ] **8.1.3** — Verify voice button appears on all pages

**Playwright verify:** Start dev server, visit `/`, confirm floating voice button visible in bottom-right corner.

#### 8.2 Page-Specific Voice Context
- [ ] **8.2.1** — Update `/agent/[slug]/page.tsx` to pass agent context to VoiceProvider
- [ ] **8.2.2** — Update `/agency/[slug]/page.tsx` to pass agency context
- [ ] **8.2.3** — Update `/agents/[state]/[suburb-slug]/page.tsx` to pass suburb context
- [ ] **8.2.4** — Verify mode label changes ("Talk to Navigator" vs "Talk to [Agent Name]")

**Playwright verify:** Visit `/agent/john-smith`, confirm voice button says "Talk to John Smith's Assistant".

#### 8.3 ElevenLabs Dashboard Setup
- [ ] **8.3.1** — Create agent template in ElevenLabs dashboard
- [ ] **8.3.2** — Configure voice settings (Australian accent, professional tone)
- [ ] **8.3.3** — Enable "Allow overrides" in security settings
- [ ] **8.3.4** — Register client tools: navigateToPage, searchAgents, filterResults, scrollToSection, activateAssistant, highlightAgent
- [ ] **8.3.5** — Configure LLM (gpt-4o or claude-3-5-sonnet)
- [ ] **8.3.6** — Add ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID to .env.local

#### 8.4 Voice Context Improvements
- [ ] **8.4.1** — Fix suburb context missing `topAgents` (currently returns empty array)
  - Add database query to fetch top agents by sales in suburb
  - Located in `/api/voice/signed-url/route.ts` line 265

#### 8.5 Missing Components (Low Priority)
- [ ] **8.5.1** — Create `src/components/voice/MobileVoiceSheet.tsx` — Full-width bottom sheet on mobile
- [ ] **8.5.2** — Create `src/components/voice/VoiceError.tsx` — Dedicated error component

**Playwright verify:** Test on 375px viewport, confirm voice panel uses bottom sheet layout.

---

### Phase 9: Testing & Quality (NOT STARTED)

**Status:** No testing framework installed. No test files exist.
**Priority:** After Phase 3 and 8 are complete.

#### 9.1 Unit Tests Setup
- [ ] **9.1.1** — Install Vitest: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom`
- [ ] **9.1.2** — Create `vitest.config.ts`
- [ ] **9.1.3** — Add `"test": "vitest"` script to package.json
- [ ] **9.1.4** — Create `src/__tests__/` directory

#### 9.2 Query Helper Tests
- [ ] **9.2.1** — Create `src/__tests__/db/queries.test.ts`
- [ ] **9.2.2** — Test getAgentBySlug (found, not found)
- [ ] **9.2.3** — Test getAgentsList (pagination, filters, sorting)
- [ ] **9.2.4** — Test searchFTS (query, type filter, empty results)
- [ ] **9.2.5** — Test autocompleteFTS (prefix matching, limit)

#### 9.3 API Route Tests
- [ ] **9.3.1** — Create `src/__tests__/api/search.test.ts`
- [ ] **9.3.2** — Create `src/__tests__/api/agent.test.ts`
- [ ] **9.3.3** — Create `src/__tests__/api/agency.test.ts`

#### 9.4 Playwright E2E Setup
- [ ] **9.4.1** — Install Playwright: `pnpm add -D @playwright/test`
- [ ] **9.4.2** — Create `playwright.config.ts`
- [ ] **9.4.3** — Create `e2e/` directory

#### 9.5 E2E Tests
- [ ] **9.5.1** — Create `e2e/home.spec.ts`
  - Visit `/`, verify hero section renders
  - Verify search bar functional
  - Verify navigation links work
- [ ] **9.5.2** — Create `e2e/agent-profile.spec.ts`
  - Visit `/agent/[slug]`, verify profile renders
  - Verify sales section loads
  - Verify reviews section loads
- [ ] **9.5.3** — Create `e2e/suburb-listing.spec.ts`
  - Visit `/agents/nsw/bondi-beach`, verify agent cards render
  - Verify pagination works
  - Verify filter/sort works
- [ ] **9.5.4** — Create `e2e/search.spec.ts`
  - Type in search bar, verify autocomplete
  - Submit search, verify results
- [ ] **9.5.5** — Create `e2e/voice.spec.ts`
  - Click voice button, verify connecting state
  - Verify mode labels on different pages

#### 9.6 generateStaticParams Population
**Note:** Currently all dynamic pages return empty arrays for generateStaticParams, relying on ISR. This is acceptable for MVP but could be improved.

- [ ] **9.6.1** — Update `/agent/[slug]/page.tsx` generateStaticParams
  - Return top 100 agents by sales count for pre-rendering
- [ ] **9.6.2** — Update `/agency/[slug]/page.tsx` generateStaticParams
  - Return all agencies
- [ ] **9.6.3** — Update `/agents/[state]/[suburb-slug]/page.tsx` generateStaticParams
  - Return top 50 suburbs by agent count

#### 9.7 Error Handling Improvements
- [ ] **9.7.1** — Add error logging to sitemap.ts catch blocks (currently silent)
- [ ] **9.7.2** — Consider Sentry or similar for production error tracking
- [ ] **9.7.3** — Review console.log statements in voice components (keep or remove for production)

---

## Files to Create Summary

### Phase 3: Data Pipeline (~25 files)
```
src/pipeline/
├── orchestrator.ts
├── config.ts
├── schemas/
│   ├── agency.ts
│   ├── agent.ts
│   ├── sale.ts
│   ├── review.ts
│   └── index.ts
├── agents/
│   ├── agency-researcher.ts
│   ├── agent-researcher.ts
│   ├── license-verifier.ts
│   ├── sales-historian.ts
│   ├── review-aggregator.ts
│   └── index.ts
├── storage/
│   ├── insert.ts
│   ├── merge.ts
│   └── index.ts
├── utils/
│   ├── rate-limiter.ts
│   ├── dedupe.ts
│   ├── image-downloader.ts
│   └── index.ts
└── scripts/
    ├── run.ts
    ├── enrich.ts
    └── dedupe.ts
```

### Phase 8: Voice (Files to Modify)
```
src/app/layout.tsx                           # Add VoiceProvider wrapper
src/app/agent/[slug]/page.tsx               # Add voice context props
src/app/agency/[slug]/page.tsx              # Add voice context props
src/app/agents/[state]/[suburb-slug]/page.tsx # Add voice context props
src/app/api/voice/signed-url/route.ts       # Fix topAgents query
```

### Phase 9: Testing (~15 files)
```
vitest.config.ts
playwright.config.ts
src/__tests__/
├── db/
│   └── queries.test.ts
├── api/
│   ├── search.test.ts
│   ├── agent.test.ts
│   └── agency.test.ts
└── components/
    └── (optional component tests)
e2e/
├── home.spec.ts
├── agent-profile.spec.ts
├── suburb-listing.spec.ts
├── search.spec.ts
└── voice.spec.ts
```

---

## Key Learnings (Preserved)

- better-sqlite3 needs `serverExternalPackages` in next.config.ts
- pnpm 10: `pnpm.onlyBuiltDependencies` in package.json for native modules
- Tailwind 4: CSS @theme, no tailwind.config.js
- ESLint 9: `eslint .` not `next lint` (deprecated)
- FTS5 migration: manual SQL via db.exec() (not in Drizzle journal)
- Next.js 15: params/searchParams are Promises — must await
- SuburbBadge: route must be `/agents/{state}/{slug}` not `/suburb/{slug}`
- Voice: VoiceProvider must wrap app in layout.tsx to activate

---

## Unresolved Questions

1. **ElevenLabs agent** — Created in dashboard yet? Required for Phase 8.
2. **ElevenLabs LLM** — gpt-4o or claude-3-5-sonnet?
3. **Claude Agent SDK** — Verify package name `@anthropic-ai/claude-agent-sdk` before Phase 3.
4. **Image storage** — Use local `public/` or external CDN (S3, Cloudflare R2)?
5. **Pipeline hosting** — Run locally, in CI, or as background job?

---

## Build Status

Last verified: 2026-01-28

- [x] TypeScript: `pnpm typecheck` passes
- [x] ESLint: `pnpm lint` passes
- [x] Build: `pnpm build` passes
- [ ] Tests: No test suite (Phase 9)
- [ ] Pipeline: Not implemented (Phase 3)
- [ ] Voice active: Code exists but not integrated (Phase 8)

---

## Current Database State

| Entity | Count | Status |
|--------|-------|--------|
| Suburbs | 17,503 | Seeded from CSV |
| Agents | 0 | Awaiting pipeline |
| Agencies | 0 | Awaiting pipeline |
| Sales | 0 | Awaiting pipeline |
| Reviews | 0 | Awaiting pipeline |
| FTS Tables | 3 | Ready (empty) |

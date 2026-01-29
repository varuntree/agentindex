# IMPLEMENTATION PLAN

> Last updated: 2026-01-29 21:30
> Current phase: 6/8 — Pages (polish remaining)
> Progress: 94 completed / 92 total tasks

> **prompt_build** and **prompt_plan**: Read `AGENTS.md` at the beginning of every conversation before taking any action. It contains critical build fixes and gotchas.

---

## Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Tech Stack | **Complete** | Next.js 15.5.7, React 19, Tailwind 4, TS 5 |
| Phase 2: Data Model | **Complete** | 7 tables, 3 FTS5, 27 indexes; all constraints aligned |
| Phase 3: Data Pipeline | **~80%** | Core orchestrator + 5 sub-agents; missing config/utils |
| Phase 4: API Routes | **Complete** | All 7 endpoints implemented with caching |
| Phase 5: UI Components | **Complete** | All components: charts, forms, cards, filters |
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

### TASK-001: Agent header agency logo ✓
- **Status:** `completed`
- **Scope:** Add 40px agency logo next to agent name in header section
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Already implemented at lines 242-259 with h-10 (40px)
- **Feedback:** Already implemented. Logo displays at 40px (h-10) next to agent name when agency.logoUrl exists.

### TASK-002: Agent header social links ✓
- **Status:** `completed`
- **Scope:** Add LinkedIn, Facebook, Instagram, website icon links to agent header
- **Files:** `src/app/agent/[slug]/page.tsx`, `src/components/ui/social-links.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify social icons render with correct hrefs
- **Feedback:** Implemented SocialLinks component with LinkedIn, Facebook, Instagram, Website icons. Renders in agent header when URLs present.

### TASK-003: Agent property type donut chart ✓
- **Status:** `completed`
- **Scope:** Add donut chart showing property type breakdown (house/unit/land/townhouse)
- **Files:** `src/app/agent/[slug]/page.tsx`, `src/components/ui/donut-chart.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify chart renders with correct percentages
- **Feedback:** Integrated DonutChart in agent page stats section. Shows property type distribution from sales data.

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

### TASK-007: Agent reviews sub-ratings chart ✓
- **Status:** `completed`
- **Scope:** Add horizontal bar chart for sub-ratings (Communication, Knowledge, Negotiation, etc.)
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify bar chart renders with correct values
- **Feedback:** Integrated BarChart in reviews section. Shows Communication, Knowledge, Negotiation, Professionalism ratings.

### TASK-008: Agent reviews metadata ✓
- **Status:** `completed`
- **Scope:** Add "Would Hire Again" %, buyer/seller badge, verified badge to review cards
- **Files:** `src/app/agent/[slug]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify badges render on review cards
- **Feedback:** Added wouldHireAgain %, reviewerType badge (Buyer/Seller), verified checkmark to review cards.

### TASK-009: Agency stats section ✓
- **Status:** `completed`
- **Scope:** Add performance grid + property type bar chart to agency profile
- **Files:** `src/app/agency/[slug]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify stats section renders
- **Feedback:** Added agency stats grid with agent count, total sales, avg price. BarChart shows property type distribution.

### TASK-010: State page sort controls ✓
- **Status:** `complete`
- **Scope:** Add sort controls for suburbs (Agent Count, Name A-Z, Median Price)
- **Files:** `src/app/agents/[state]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify sort controls work with URL params

### TASK-011: Agencies page sort controls ✓
- **Status:** `complete`
- **Scope:** Add sort controls (Name A-Z, Agent Count, Sales Count, State)
- **Files:** `src/app/agencies/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify sort controls work with URL params

### TASK-012: Agencies page card stats ✓
- **Status:** `completed`
- **Scope:** Add total sales value, avg price to agency cards
- **Files:** `src/app/agencies/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Playwright: verify stats display on cards
- **Feedback:** Agency cards now show total sales value and avg price alongside agent count.

---

## PHASE 5: UI Components

### TASK-013: Mobile search overlay ✓
- **Status:** `completed`
- **Scope:** Add fullscreen mobile search overlay with recent searches, top suburbs
- **Files:** `src/components/search/mobile-search-overlay.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Component created with localStorage recent searches
- **Feedback:** Fullscreen overlay with autocomplete, recent searches (localStorage), and top suburbs section.

### TASK-014: DonutChart component ✓
- **Status:** `completed`
- **Scope:** Create reusable donut chart for property type breakdown
- **Files:** `src/components/ui/donut-chart.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Component renders with test data
- **Feedback:** Created SVG-based DonutChart with color-coded segments, legend, and percentage labels.

### TASK-015: BarChart component ✓
- **Status:** `completed`
- **Scope:** Create horizontal bar chart for sub-ratings display
- **Files:** `src/components/ui/bar-chart.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Component renders with test data
- **Feedback:** Created BarChart with horizontal bars, labels, and value display. Used in agent reviews and agency stats.

### TASK-016: Form primitives ✓
- **Status:** `completed`
- **Scope:** Add Textarea, Select, Checkbox, Radio form components
- **Files:** `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`, `src/components/ui/checkbox.tsx`, `src/components/ui/radio.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] All components created with focus states
- **Feedback:** Created all four form primitives with forwardRef, error states, and accessibility.

### TASK-017: FilterBar clear button ✓
- **Status:** `completed`
- **Scope:** Add "Clear All" button to FilterBar when filters active
- **Files:** `src/components/search/filter-bar.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Button appears when filters active, clears all on click
- **Feedback:** Added Clear All button that appears when propertyType filters or non-default sort active.

### TASK-018: FilterBar property chips ✓
- **Status:** `completed`
- **Scope:** Add property type filter chips (House, Unit, Land, Townhouse) to suburb page
- **Files:** `src/components/search/filter-bar.tsx`, `src/app/agents/[state]/[suburb-slug]/page.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Chips toggle and filter agent list
- **Feedback:** Already implemented. Property type chips toggle via URL params.

### TASK-019: Button border spec ✓
- **Status:** `completed`
- **Scope:** Change button border from 2px to 3px per spec
- **Files:** `src/components/ui/button.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Visual: border is 3px
- **Feedback:** Changed border-2 → border-[3px] for primary, secondary, destructive variants.

### TASK-020: Pagination border fix ✓
- **Status:** `completed`
- **Scope:** Fix inactive pagination buttons to use border-2 (not border-1)
- **Files:** `src/components/ui/pagination.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Visual: all buttons have consistent 2px border
- **Feedback:** Changed inactive buttons from border border-gray-300 → border-2 border-black.

### TASK-021: Skeleton border fix ✓
- **Status:** `completed`
- **Scope:** Change skeleton border from gray-200 to black per spec
- **Files:** `src/components/ui/skeleton.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Visual: skeleton has black border
- **Feedback:** Changed SkeletonCard border-gray-200 → border-black.

### TASK-022: AgentCard icons ✓
- **Status:** `completed`
- **Scope:** Add Home/TrendingUp icons for stats, use 3-col grid layout
- **Files:** `src/components/agent/agent-card.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Visual: icons render, 3-col layout
- **Feedback:** Already implemented. Home, TrendingUp, MapPin icons with grid-cols-3.

### TASK-023: AgentCard review count ✓
- **Status:** `completed`
- **Scope:** Add review count to rating display ("4.2 (24)" format)
- **Files:** `src/components/agent/agent-card.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Visual: rating shows count in parentheses
- **Feedback:** Already implemented. Shows ({ratingsCount}) after star rating.

### TASK-024: AgentCard location stat ✓
- **Status:** `completed`
- **Scope:** Add state/location stat column per spec
- **Files:** `src/components/agent/agent-card.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Visual: location stat visible
- **Feedback:** Already implemented. MapPin icon with state from primary suburb.

---

## PHASE 3: Data Pipeline

### TASK-025: Pipeline config file ✓
- **Status:** `completed`
- **Scope:** Add `pipeline-config.json` support with locations[], enrichment{}, rate_limits{}, quality{}
- **Files:** `pipeline/config/schema.ts`, `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Config file loads and validates
- **Feedback:** Created Zod schema with full validation. Added --config flag to CLI. Config merges with CLI args (CLI overrides). Tracks explicit CLI args to avoid overwriting user intent.

### TASK-026: Pipeline CLI utilities ✓
- **Status:** `completed`
- **Scope:** Add `pnpm pipeline:validate`, `pipeline:report`, `pipeline:retry`, `pipeline:dedupe` commands
- **Files:** `pipeline/scripts/*.ts`, `package.json`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] All commands run without error
  - [x] Help text displays
- **Feedback:** Created 4 CLI scripts (validate, report, retry, dedupe). Adapted to actual schema (pipelineRuns uses completedAt, integer IDs, errorLog text).

### TASK-027: License verification ✓
- **Status:** `completed`
- **Scope:** Add NSW Fair Trading license verification integration
- **Files:** `pipeline/agents/license-verifier.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
- **Feedback:** Created LicenseOutputSchema, buildLicenseVerificationPrompt, parseLicenseResponse. Agent searches service.nsw.gov.au for license data.

### TASK-028: Domain rate limiter ✓
- **Status:** `completed`
- **Scope:** Add `DomainRateLimiter` class (30 req/domain/min per spec)
- **Files:** `pipeline/utils/rate-limiter.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
- **Feedback:** Created DomainRateLimiter with sliding window, waitForSlot(), verbose logging. Exported singleton for easy integration.

### TASK-029: Transaction wrapper ✓
- **Status:** `completed`
- **Scope:** Wrap storage operations in `db.transaction()` for atomicity
- **Files:** `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] All storage ops use tx
- **Feedback:** Wrapped storeAgencyWithAgents in db.transaction(). Updated storeAgent, linkAgentToSuburbs, storeSale, storeReview to accept tx?: DbClient and use tx ?? db pattern. Errors auto-rollback.

### TASK-030: Merge strategy ✓
- **Status:** `completed`
- **Scope:** Implement data conflict merge (prefer non-null, longer text, unique arrays)
- **Files:** `pipeline/utils/merge.ts`, `pipeline/utils/index.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] Functions exported
- **Feedback:** Created merge utilities: mergeValue, mergeText, mergeArrays, mergeNumber, mergeDate, mergeObjects, mergeAgentData, mergeAgencyData. Barrel export in utils/index.ts.

### TASK-031: Multi-location flag ✓
- **Status:** `completed`
- **Scope:** Add `--locations` flag for multi-location processing
- **Files:** `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] CLI help shows --locations flag
- **Feedback:** Added locations?: string[] to CLIArgs. Parse --locations as comma-separated list. Discovery iterates all locations and deduplicates agency names.

### TASK-032: Enrich-only command ✓
- **Status:** `completed`
- **Scope:** Add `pnpm pipeline:enrich` for enrichment-only runs
- **Files:** `pipeline/scripts/enrich.ts`, `package.json`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] Script added to package.json
- **Feedback:** Created enrich.ts with --agent, --agency, --min-quality, --max-quality, --limit, --focus flags. Targets low-quality agents by default. Uses transactions for updates.

### TASK-033: Claude structured output ✓
- **Status:** `completed`
- **Scope:** Use Claude SDK `structuredOutput` param instead of manual JSON extraction
- **Files:** `pipeline/scripts/pipeline.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
- **Feedback:** Added outputFormat option to query() with JSON schema from Zod. Uses z.toJSONSchema() if available, falls back to manual extraction. SDK returns validated data in structured_output field.

---

## PHASE 8: Voice Polish

### TASK-034: Voice CSS animation
- **Status:** `completed`
- **Scope:** Rename `voice-bar` to `animate-wave`, use height animation (not scaleY)
- **Files:** `src/app/globals.css`, `src/components/voice/AudioWaveform.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Visual: bars animate with height (8px → 24px)
- **Feedback:** Changed keyframes from scaleY transform to height-based animation. Removed inline animationDelay from component since CSS handles staggering.

### TASK-035: Remove unused VoiceButton
- **Status:** `completed`
- **Scope:** Delete VoiceButton.tsx if VoicePanel handles button rendering
- **Files:** `src/components/voice/VoiceButton.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] No import errors
- **Feedback:** VoiceButton was unused — VoicePanel renders buttons inline. Deleted file and removed export from index.ts.

### TASK-036: Voice usage tracking
- **Status:** `completed`
- **Scope:** Add `logVoiceSession()` to database with session duration
- **Files:** `src/lib/voice/tracking.ts`, `src/components/voice/VoiceProvider.tsx`, `src/app/api/voice/track/route.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Session logged to DB via /api/voice/track endpoint
- **Feedback:** tracking.ts and track/route.ts already existed. Added tracking calls to VoiceProvider: track start after signed-url, track end on disconnect/error/timeout.

### TASK-037: Voice state colors
- **Status:** `completed`
- **Scope:** Use green (bg-green-500) for listening, blue for speaking
- **Files:** `src/components/voice/VoicePanel.tsx`, `src/components/voice/AudioWaveform.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Visual: green for listening, blue for speaking
- **Feedback:** Updated VoicePanel icon circle and AudioWaveform bars to use green-500 when listening, blue-500 when speaking.

### TASK-038: Voice listening status
- **Status:** `completed`
- **Scope:** Add separate "listening" status distinct from "connected" (5 states total)
- **Files:** `src/components/voice/VoiceProvider.tsx`, `src/lib/voice/types.ts`, `src/components/voice/VoicePanel.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] Status: idle → connecting → listening ↔ speaking → idle/error
- **Feedback:** Changed VoiceStatus to 5 states: idle, connecting, listening, speaking, error. VoiceProvider updates status based on conversation.isSpeaking. VoicePanel derives visual state from status, removed isSpeaking prop.

### TASK-039: Voice context snake_case
- **Status:** `completed`
- **Scope:** Change voice context field names to snake_case per spec
- **Files:** `src/lib/voice/types.ts`, `src/lib/voice/context.ts`, `src/app/api/voice/signed-url/route.ts`, `src/components/voice/VoiceContextSetter.tsx`, `src/components/voice/VoicePanel.tsx`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
  - [x] API response uses snake_case
- **Feedback:** Converted 17+ fields from camelCase to snake_case. Updated types, context builders, and signed-url route. Also updated VoiceSessionRequest (page_type, voice_mode, etc.) and VoiceEntityInfo (assistant_label).

---

## PHASE 2: Schema Alignment

### TASK-040: pipelineRuns notNull ✓
- **Status:** `completed`
- **Scope:** Add notNull constraint to pipelineRuns.startedAt
- **Files:** `src/lib/db/schema.ts`, `drizzle/migrations/`
- **Verification:**
  - [x] `pnpm db:generate` creates migration
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
- **Feedback:** Added .notNull() to startedAt. Migration 0002_black_scourge.sql generated.

### TASK-041: agent_suburbs index ✓
- **Status:** `completed`
- **Scope:** Add missing index `agent_suburbs_agent_id_idx` (spec line 369)
- **Files:** `src/lib/db/schema.ts`
- **Verification:**
  - [x] `pnpm db:generate` creates migration
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
- **Feedback:** Added index("agent_suburbs_agent_id_idx").on(table.agentId) to agentSuburbs table.

### TASK-042: Sales index rename ✓
- **Status:** `completed`
- **Scope:** Rename `sales_agent_sale_date_idx` → `sales_agent_date_idx` per spec
- **Files:** `src/lib/db/schema.ts`
- **Verification:**
  - [x] Index renamed in schema
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
- **Feedback:** Renamed index from sales_agent_sale_date_idx to sales_agent_date_idx.

### TASK-043: isPrimary boolean mode ✓
- **Status:** `completed`
- **Scope:** Change agent_suburbs.isPrimary from integer to `{ mode: 'boolean' }`
- **Files:** `src/lib/db/schema.ts`, `scripts/seed-sample-data.ts`
- **Verification:**
  - [x] `pnpm typecheck` passes
  - [x] `pnpm build` passes
- **Feedback:** Changed to { mode: "boolean" } with default(false). Also fixed seed script to use boolean instead of 1/0.

### TASK-050: Add social URL fields to agent schema ✓
- **Status:** `completed`
- **Scope:** Add linkedinUrl, facebookUrl, instagramUrl (nullable text) to agents table
- **Files:** `src/lib/db/schema.ts`, drizzle migration
- **Verification:**
  - [x] `pnpm db:generate` creates migration
  - [x] `pnpm db:migrate` applies
  - [x] Fields exist in agents table
- **Feedback:** Added linkedinUrl, facebookUrl, instagramUrl to agents schema. Migration applied successfully.

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

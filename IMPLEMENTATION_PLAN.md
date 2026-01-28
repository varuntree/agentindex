# AgentIndex Implementation Plan

Last updated: 2026-01-28 — Phase 8.1 completed

---

## Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Next.js Setup | **Complete** | Next.js 15, React 19, Tailwind 4, TypeScript 5 |
| Phase 2: Database Schema | **Complete** | 7 tables, FTS5, 17,503 suburbs seeded |
| Phase 3: Data Pipeline | **In Progress** | Sample data seeded, AI pipeline needs refinement |
| Phase 3.5: Query Helpers | **Complete** | 20+ query functions |
| Phase 4: API Routes | **Complete** | 8 API endpoints implemented |
| Phase 5: UI Components | **Complete** | 19 components, all typed |
| Phase 6: Pages | **Complete** | 7 page types with loading skeletons |
| Phase 7: SEO | **Complete** | JSON-LD, sitemap, OG images, canonical tags |
| Phase 8: Voice Integration | **~95% Complete** | Layout integration done (8.1), ElevenLabs config pending |
| Phase 8.1: Layout Integration | **Complete** | VoiceLayoutWrapper created, auto-detects context |
| Phase 9: Testing & QA | **NOT STARTED** | No test framework installed |

---

## Critical Path

**BLOCKER:** Phase 3 (Data Pipeline) must complete before Phase 8 (Voice) can demonstrate value. Voice assistants need real agent data for context injection. Without data, the MVP cannot be demonstrated.

**Priority Order:**
1. **Phase 3: Data Pipeline** — CRITICAL, no agents/agencies/sales data exists
2. **Phase 8.X: Voice Activation** — Integrate into layout + ElevenLabs dashboard setup
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
- [x] POST /api/voice/signed-url — ElevenLabs signed URL (fully implemented)
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

### Phase 8.0: Voice Code Implementation ✓
- [x] Install @elevenlabs/react v0.13.1
- [x] Create src/lib/voice/types.ts — Voice types and interfaces
- [x] Create src/lib/voice/prompts.ts — Navigator and Assistant system prompts
- [x] Create src/lib/voice/context.ts — Agent/agency/suburb context builders
- [x] Create src/lib/voice/tools.ts — Navigator (6 tools) and Assistant (1 tool) client tools
- [x] Create src/lib/voice/elevenlabs.ts — Signed URL generation helper
- [x] Create src/components/voice/VoiceProvider.tsx — Context with useConversation hook
- [x] Create src/components/voice/VoicePanel.tsx — Floating UI with all states
- [x] Create src/components/voice/VoiceButton.tsx — Pulse animation button
- [x] Create src/components/voice/AudioWaveform.tsx — 5-bar animated waveform
- [x] Update /api/voice/signed-url — Full implementation with context fetching
- [x] Environment variables documented in .env.example

---

## Remaining Work (Priority Order)

### Phase 3: Data Pipeline — IN PROGRESS

**Status:** Sample data seeded, AI pipeline needs refinement.

**Implemented:**
- `pipeline/schemas/index.ts` — Zod schemas: AgencyOutput, AgentOutput, SaleOutput, ReviewOutput
- `pipeline/agents/index.ts` — Agent prompts for agency research, sales, reviews
- `pipeline/scripts/pipeline.ts` — CLI with --location, --agencies, --discover-agencies options
- `@anthropic-ai/claude-agent-sdk` v0.2.22 installed
- Zod 4.3.6 installed

#### Sample Data Seeder
- Created `scripts/seed-sample-data.ts` for MVP demos while AI pipeline is refined
- Seeded 3 agencies: Ray White, McGrath, Belle Property Bondi Beach
- 7 agents with realistic data: photos, bios, licenses, languages
- 14 sales records
- 12 reviews
- Run with: `pnpm pipeline:seed-sample`

---

### Phase 8.1-8.5: Voice Activation (Code Ready, Integration Needed)

**Status:** All code implemented. Needs layout integration and ElevenLabs dashboard setup.
**Blocker:** Requires ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in .env.local

#### 8.1 Integrate VoiceProvider into App ✓
- [x] **8.1.1** — VoiceLayoutWrapper created and integrated into layout.tsx
- [x] **8.1.2** — VoiceLayoutWrapper auto-detects pageType and slug from pathname
- [x] **8.1.3** — Voice button verified visible on all pages (desktop and mobile)

#### 8.2 Page-Specific Voice Context ✓
- [x] **8.2.1** — VoiceContextSetter component added to `/agent/[slug]/page.tsx`
- [x] **8.2.2** — VoiceContextSetter component added to `/agency/[slug]/page.tsx`
- [x] **8.2.3** — VoiceContextSetter added to `/agents/[state]/[suburb-slug]/page.tsx`
- [x] **8.2.4** — VoicePanel shows personalized labels per page type

#### 8.3 ElevenLabs Dashboard Setup (via Playwright MCP)
**Automate with browser:** Use Playwright MCP tools to create agent and configure env vars.

- [ ] **8.3.1** — Navigate to ElevenLabs dashboard (elevenlabs.io)
- [ ] **8.3.2** — Create new Conversational AI agent:
  - Name: "AgentIndex Voice Agent"
  - LLM: claude-3-5-sonnet (or gpt-4o)
  - Voice: Select Australian-accented, professional voice
  - Default prompt: "You are a helpful assistant." (will be overridden)
- [ ] **8.3.3** — Configure agent settings:
  - Enable "Allow overrides" in Security tab
  - Set turn timeout, interruption handling
- [ ] **8.3.4** — Register client tools (7 total):
  - navigateToPage (string: path)
  - searchAgents (string: query)
  - filterResults (string: sort, string: propertyType)
  - scrollToSection (string: section)
  - activateAssistant (string: slug)
  - highlightAgent (string: agentSlug)
- [ ] **8.3.5** — Copy Agent ID from dashboard
- [ ] **8.3.6** — Get API key from Profile > API Keys
- [ ] **8.3.7** — Write to `.env.local`:
  ```
  ELEVENLABS_API_KEY=xi_xxxxx
  ELEVENLABS_AGENT_ID=agent_xxxxx
  ```
- [ ] **8.3.8** — Verify by calling /api/voice/signed-url (should return signedUrl, not error)

**Playwright commands:**
```
mcp__playwright__browser_navigate → elevenlabs.io
mcp__playwright__browser_snapshot → find login/dashboard
mcp__playwright__browser_click → navigate to Conversational AI
mcp__playwright__browser_fill_form → create agent
mcp__playwright__browser_snapshot → copy agent ID
```

#### 8.4 Voice Context Improvements
- [ ] **8.4.1** — Fix suburb context missing `topAgents` (currently returns empty array)
  - Add database query to fetch top agents by sales in suburb
  - Located in `/api/voice/signed-url/route.ts` line 281

#### 8.5 Mobile Voice Sheet (Optional)
- [ ] **8.5.1** — Create `src/components/voice/MobileVoiceSheet.tsx` — Full-width bottom sheet on mobile

---

### Phase 9: Testing & Quality (NOT STARTED)

[...Phase 9 content unchanged...]

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
- ElevenLabs signed URL: GET endpoint with agent_id query param, returns `signed_url` field
- VoiceLayoutWrapper pattern: client wrapper using usePathname() to detect page context for layout-level voice integration
- Pipeline directory must be excluded from tsconfig.json to avoid Next.js build conflicts
- Claude Agent SDK query() returns AsyncGenerator, iterate with `for await`
- SDK options: allowedTools, maxTurns, maxBudgetUsd (no direct 'model' param at top level)
- next.config.ts webpack watchOptions: exclude non-Next.js directories to prevent rebuild loops
- AgentPhoto component: needs null checks for firstName/lastName to handle missing data
- Sample data seeder approach: MVP demos while AI pipeline is refined

---

## Unresolved Questions

1. **ElevenLabs agent** — Created in dashboard yet? Required for voice activation.
2. **ElevenLabs LLM** — gpt-4o or claude-3-5-sonnet?
3. **Image storage** — Use local `public/` or external CDN (S3, Cloudflare R2)?
4. **Pipeline hosting** — Run locally, in CI, or as background job?

---

## Build Status

Last verified: 2026-01-28

- [x] TypeScript: `pnpm typecheck` passes
- [x] ESLint: `pnpm lint` passes
- [x] Build: `pnpm build` passes (21 routes) — verified 2026-01-28
- [ ] Tests: No test suite (Phase 9)
- [x] Sample data: Seeded via scripts/seed-sample-data.ts
- [x] Voice code: Complete (Phase 8.0)
- [x] Voice active: Layout integration complete (Phase 8.1)
- [x] tsconfig.json: pipeline and agent-ralph-ui excluded from build

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

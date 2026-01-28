# AgentIndex Implementation Plan

Last updated: 2026-01-28 — comprehensive audit

---

## Status Summary

| Phase | Status | Items |
|-------|--------|-------|
| Phase 1: Next.js Setup | Complete | 1.1-1.15 |
| Phase 2: Database Schema | Complete | 2.1-2.18 |
| Phase 3: Data Pipeline | **Incomplete** | 3.1-3.13 pending |
| Phase 3.5: Query Helpers | Complete | 3.5.1-3.5.6 |
| Phase 4: API Routes | Complete | 4.1-4.9 |
| Phase 5: UI Components | Complete | 5.1-5.22 |
| Phase 6: Pages | Complete | 6.1-6.10 |
| Phase 7: SEO | Complete | 7.1-7.11 |
| Phase 8: Voice Integration | **Incomplete** | 8.0-8.10 pending |
| Phase 9: Testing & QA | **New** | 9.1-9.8 pending |

---

## Completed Phases

### Phase 1: Next.js Foundation (Complete)
- [x] **1.1-1.15** — Next.js 15, Tailwind 4, Drizzle ORM, TypeScript 5, fonts, layout, formatting utils

### Phase 2: Database Schema (Complete)
- [x] **2.1-2.18** — 7-table schema (agencies, agents, suburbs, agentSuburbs, sales, reviews, pipelineRuns)
- [x] FTS5 virtual tables with auto-sync triggers
- [x] 17,503 suburbs seeded from Matthew Proctor CSV
- [x] Database connection via better-sqlite3

### Phase 3.5: Query Helpers (Complete)
- [x] **3.5.1-3.5.6** — 20+ query functions: agent/agency/suburb/search/stats
- [x] Files: `src/lib/db/queries/*.ts`

### Phase 4: API Routes (Complete)
- [x] **4.1-4.9** — 8 API endpoints implemented
- [x] `/api/search` — Full-text search across agents, agencies, suburbs
- [x] `/api/autocomplete` — Search suggestions
- [x] `/api/agents` — Agent listing with filters
- [x] `/api/agent/[slug]` — Single agent details
- [x] `/api/agency/[slug]` — Single agency details
- [x] `/api/suburb/[slug]` — Single suburb details
- [x] `/api/voice/signed-url` — Voice API (stub only)
- [x] `/api/revalidate` — ISR revalidation trigger
- [x] Response/cache utility helpers: `src/lib/api/response.ts`, `src/lib/api/cache.ts`

### Phase 5: UI Components (Complete)
- [x] **5.1-5.22** — 19 components implemented
- [x] Core: Button, Card, Badge, Input, StarRating, Pagination, Skeleton, StatCard
- [x] Domain: AgentCard, AgentPhoto, SuburbBadge, PriceDisplay, PropertyTypeIcon, Table
- [x] Layout: Breadcrumb, SearchBar, FilterBar, GlobalNav, GlobalFooter

### Phase 6: Pages (Complete)
- [x] **6.1-6.10** — All 7 page types + loading skeletons
- [x] Home page (`/`)
- [x] Agent profile (`/agent/[slug]`)
- [x] Suburb listing (`/agents/[state]/[suburb-slug]`)
- [x] Agency profile (`/agency/[slug]`)
- [x] Agencies list (`/agencies`)
- [x] State listing (`/agents/[state]`)
- [x] Agents hub (`/agents`)

### Phase 7: SEO (Complete)
- [x] **7.1-7.8** — Metadata helpers, JSON-LD generators (5 schemas)
- [x] **7.9** — Canonical tags on all pages
- [x] **7.10** — OG image generation via @vercel/og (`/api/og`)
- [x] **7.11** — Internal linking audit, SuburbBadge route fix
- [x] sitemap.ts, robots.ts
- [x] Breadcrumb structured data on all pages

---

## Remaining Work

> **Priority Order:** Phase 3 (Data Pipeline) must complete before Phase 8 (Voice) because voice assistants need real agent data to demonstrate context injection.

---

### Phase 3: Data Pipeline (Incomplete)

**Dependencies:** None (can start immediately)
**Spec Reference:** `spec/spec-data-pipeline.md`
**Target Directory:** `src/pipeline/`

#### 3.1 Zod Output Schemas
- [ ] **3.1.1** — Create `src/pipeline/schemas/agency.ts` with `AgencyOutput` schema
- [ ] **3.1.2** — Create `src/pipeline/schemas/agent.ts` with `AgentOutput` schema
- [ ] **3.1.3** — Create `src/pipeline/schemas/sale.ts` with `SaleOutput` schema
- [ ] **3.1.4** — Create `src/pipeline/schemas/review.ts` with `ReviewOutput` schema
- [ ] **3.1.5** — Create `src/pipeline/schemas/index.ts` barrel export

**Files to create:**
```
src/pipeline/schemas/
├── agency.ts
├── agent.ts
├── sale.ts
├── review.ts
└── index.ts
```

#### 3.2 Pipeline Orchestrator
- [ ] **3.2.1** — Create `src/pipeline/orchestrator.ts` using Claude Agent SDK
- [ ] **3.2.2** — Create `src/pipeline/config.ts` for pipeline configuration types
- [ ] **3.2.3** — Create CLI script `src/pipeline/scripts/run.ts`
- [ ] **3.2.4** — Add npm scripts to package.json:
  - `pipeline:run` — Main pipeline execution
  - `pipeline:enrich` — Enrichment pass for low-quality records
  - `pipeline:dedupe` — Deduplication utility

**Files to create:**
```
src/pipeline/
├── orchestrator.ts
├── config.ts
└── scripts/
    ├── run.ts
    ├── enrich.ts
    └── dedupe.ts
```

#### 3.3-3.7 Sub-Agents
- [ ] **3.3** — Create `src/pipeline/agents/agency-researcher.ts`
  - Researches agency website, team page, contact details
  - Returns `AgencyOutput` with nested agents
- [ ] **3.4** — Create `src/pipeline/agents/agent-researcher.ts`
  - Deep-dive single agent: sales history, reviews
  - Returns enriched `AgentOutput`
- [ ] **3.5** — Create `src/pipeline/agents/license-verifier.ts`
  - Verifies NSW Fair Trading license status
  - Returns license verification data
- [ ] **3.6** — Create `src/pipeline/agents/sales-historian.ts`
  - Aggregates sales from agency sites, Domain, RateMyAgent
  - Returns `SaleOutput[]`
- [ ] **3.7** — Create `src/pipeline/agents/review-aggregator.ts`
  - Collects reviews from RateMyAgent, Google, agency sites
  - Returns `ReviewOutput[]`

**Files to create:**
```
src/pipeline/agents/
├── agency-researcher.ts
├── agent-researcher.ts
├── license-verifier.ts
├── sales-historian.ts
├── review-aggregator.ts
└── index.ts
```

#### 3.8 Storage Layer
- [ ] **3.8.1** — Create `src/pipeline/storage/insert.ts` with batch upsert functions
- [ ] **3.8.2** — Implement conflict resolution (onConflictDoUpdate)
- [ ] **3.8.3** — Add transaction wrapper for atomic operations
- [ ] **3.8.4** — Update `pipelineRuns` table after each run

**Files to create:**
```
src/pipeline/storage/
├── insert.ts
├── merge.ts
└── index.ts
```

#### 3.9 Rate Limiter
- [ ] **3.9.1** — Create `src/pipeline/utils/rate-limiter.ts`
- [ ] **3.9.2** — Implement per-domain rate limiting (30 req/min per domain)
- [ ] **3.9.3** — Implement global concurrency limiter (10 parallel sub-agents)

**Files to create:**
```
src/pipeline/utils/
├── rate-limiter.ts
└── index.ts
```

#### 3.10 Deduplication Logic
- [ ] **3.10.1** — Create `src/pipeline/utils/dedupe.ts`
- [ ] **3.10.2** — Implement agency matching (name + suburb normalization)
- [ ] **3.10.3** — Implement agent matching (first_name + last_name + agency_id)
- [ ] **3.10.4** — Implement sale matching (address normalization + date)
- [ ] **3.10.5** — Implement merge strategy (prefer highest quality data)

#### 3.11 Image Downloader
- [ ] **3.11.1** — Create `src/pipeline/utils/image-downloader.ts`
- [ ] **3.11.2** — Download agent photos to `public/images/agents/`
- [ ] **3.11.3** — Download agency logos to `public/images/agencies/`
- [ ] **3.11.4** — Download property images to `public/images/properties/`
- [ ] **3.11.5** — Implement parallel downloads with 10 concurrent limit

#### 3.12 Bondi Beach MVP Run
- [ ] **3.12.1** — Create `pipeline-config.bondi.json` targeting Bondi Beach agencies
- [ ] **3.12.2** — Run pipeline for top 10 Bondi Beach agencies:
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
- [ ] **3.12.3** — Validate 200+ agents collected
- [ ] **3.12.4** — Verify avg data quality score >= 60

#### 3.13 Expand & Document
- [ ] **3.13.1** — Run pipeline for Surry Hills, Newtown, Paddington
- [ ] **3.13.2** — Document pipeline usage in `ai_docs/pipeline-usage.md`
- [ ] **3.13.3** — Add error recovery guide

**Success Metrics (from spec):**
| Metric | Target |
|--------|--------|
| Agencies covered (Bondi Beach) | 20+ |
| Agents collected | 200+ |
| Avg data quality score | 60+ |
| Pipeline success rate | 90%+ |
| Runtime per agency | <5 min |
| Sales per agent (avg) | 5+ |
| Reviews per agent (avg) | 3+ |

**Estimated Cost:** ~$6 for full Bondi Beach run (~$0.30 per agency)

---

### Phase 8: Voice Integration (Incomplete)

**Dependencies:** Phase 3 must be complete (need real agent data for context)
**Spec Reference:** `spec/spec-voice.md`
**Target Directory:** `src/lib/voice/`, `src/components/voice/`

#### 8.0 Package Installation
- [ ] **8.0.1** — Install `@elevenlabs/react` package
  ```bash
  pnpm add @elevenlabs/react
  ```
- [ ] **8.0.2** — Add environment variables to `.env.local`:
  ```
  ELEVENLABS_API_KEY=sk_xxxxx
  ELEVENLABS_AGENT_ID=agent_xxxxx
  ```

#### 8.1 ElevenLabs Agent Template
- [ ] **8.1.1** — Create agent template in ElevenLabs dashboard
- [ ] **8.1.2** — Configure voice settings (Australian accent, professional tone)
- [ ] **8.1.3** — Enable "Allow overrides" in security settings
- [ ] **8.1.4** — Register all client tools in dashboard:
  - `navigateToPage`
  - `searchAgents`
  - `filterResults`
  - `scrollToSection`
  - `activateAssistant`
  - `highlightAgent`
- [ ] **8.1.5** — Configure LLM (gpt-4o or claude-3-5-sonnet)

#### 8.2 Signed URL API
- [ ] **8.2.1** — Update `src/app/api/voice/signed-url/route.ts` (currently stub)
- [ ] **8.2.2** — Create `src/lib/voice/elevenlabs.ts` with `createSignedUrl()` function
- [ ] **8.2.3** — Implement system prompt builder for Navigator mode
- [ ] **8.2.4** — Implement system prompt builder for Assistant mode (agent/agency/suburb variants)
- [ ] **8.2.5** — Add dynamic variable injection

**Current stub returns:**
```json
{ "signedUrl": null, "error": "Voice not configured" }
```

**Target implementation:** Full ElevenLabs signed URL generation with prompt overrides

#### 8.3-8.4 Client Tools
- [ ] **8.3.1** — Create `src/lib/voice/tools/navigator-tools.ts`
  - `navigateToPage` — URL navigation
  - `searchAgents` — Calls `/api/search`
  - `filterResults` — Updates URL params
  - `scrollToSection` — Smooth scroll to element
  - `activateAssistant` — Mode switch event
  - `highlightAgent` — Visual highlight on agent card
- [ ] **8.4.1** — Create `src/lib/voice/tools/assistant-tools.ts`
  - `scrollToSection` — Only tool for assistant mode

**Files to create:**
```
src/lib/voice/
├── elevenlabs.ts
├── context-builders.ts
├── tools/
│   ├── navigator-tools.ts
│   ├── assistant-tools.ts
│   └── index.ts
└── index.ts
```

#### 8.5 VoiceProvider & useConversation
- [ ] **8.5.1** — Create `src/components/voice/VoiceProvider.tsx`
- [ ] **8.5.2** — Implement `useConversation` hook integration
- [ ] **8.5.3** — Handle microphone permission request
- [ ] **8.5.4** — Wire onConnect, onDisconnect, onMessage, onError callbacks
- [ ] **8.5.5** — Add mode switching event listener

#### 8.6-8.7 System Prompts
- [ ] **8.6.1** — Create `src/lib/voice/prompts/navigator.ts`
  - Site-wide guide prompt
  - Dynamic variables: current_page, total_agents, total_suburbs, total_agencies
- [ ] **8.7.1** — Create `src/lib/voice/prompts/assistant-agent.ts`
  - Agent assistant prompt with `{{agent_context}}`
- [ ] **8.7.2** — Create `src/lib/voice/prompts/assistant-agency.ts`
  - Agency receptionist prompt with `{{agency_context}}`
- [ ] **8.7.3** — Create `src/lib/voice/prompts/assistant-suburb.ts`
  - Suburb expert prompt with `{{suburb_context}}`

**Files to create:**
```
src/lib/voice/prompts/
├── navigator.ts
├── assistant-agent.ts
├── assistant-agency.ts
├── assistant-suburb.ts
└── index.ts
```

#### 8.8 Context Data Fetchers
- [ ] **8.8.1** — Create `src/lib/voice/context-builders.ts`
- [ ] **8.8.2** — Implement `buildAgentContext(agent)` — formats agent data for prompt
- [ ] **8.8.3** — Implement `buildAgencyContext(agency)` — formats agency data
- [ ] **8.8.4** — Implement `buildSuburbContext(suburb)` — formats suburb data + top agents

#### 8.9-8.10 Voice UI Components
- [ ] **8.9.1** — Create `src/components/voice/VoiceButton.tsx`
  - Floating button with pulse animation
  - Labels: "Talk to Navigator" / "Talk to Assistant"
- [ ] **8.9.2** — Create `src/components/voice/VoicePanel.tsx`
  - Connected state UI with waveform
  - Shows "Listening..." / "Speaking..."
- [ ] **8.9.3** — Create `src/components/voice/AudioWaveform.tsx`
  - Animated bars indicating audio activity
- [ ] **8.9.4** — Create `src/components/voice/VoiceError.tsx`
  - Error state with retry button
- [ ] **8.10.1** — Implement mobile bottom sheet variant
  - Full-width on mobile
  - Swipe to dismiss
- [ ] **8.10.2** — Add CSS animations for waveform (`@keyframes wave`)

**Files to create:**
```
src/components/voice/
├── VoiceProvider.tsx
├── VoiceButton.tsx
├── VoicePanel.tsx
├── AudioWaveform.tsx
├── VoiceError.tsx
├── MobileVoiceSheet.tsx
└── index.ts
```

**Playwright verify (8.9-8.10):**
```
- Visit / and verify floating voice button visible
- Click voice button, verify connecting state
- Visit /agent/[slug] and verify "Talk to Assistant" label
- Click X to close, verify returns to idle state
- Test on mobile viewport (375px), verify bottom sheet layout
```

---

### Phase 9: Testing & Quality (New)

**Dependencies:** Can start in parallel with Phase 3
**Target Directory:** `src/__tests__/`, `e2e/`

#### 9.1 Unit Tests Setup
- [ ] **9.1.1** — Install Vitest: `pnpm add -D vitest @testing-library/react`
- [ ] **9.1.2** — Create `vitest.config.ts`
- [ ] **9.1.3** — Add `test` script to package.json

#### 9.2 Query Helper Tests
- [ ] **9.2.1** — Create `src/__tests__/db/queries.test.ts`
- [ ] **9.2.2** — Test agent queries (getAgentBySlug, getAgentsBySuburb)
- [ ] **9.2.3** — Test agency queries
- [ ] **9.2.4** — Test search queries (FTS5)
- [ ] **9.2.5** — Test stats queries

#### 9.3 API Route Tests
- [ ] **9.3.1** — Create `src/__tests__/api/search.test.ts`
- [ ] **9.3.2** — Create `src/__tests__/api/agent.test.ts`
- [ ] **9.3.3** — Create `src/__tests__/api/agency.test.ts`
- [ ] **9.3.4** — Create `src/__tests__/api/suburb.test.ts`

#### 9.4 Component Tests
- [ ] **9.4.1** — Create `src/__tests__/components/AgentCard.test.tsx`
- [ ] **9.4.2** — Create `src/__tests__/components/SearchBar.test.tsx`
- [ ] **9.4.3** — Create `src/__tests__/components/Pagination.test.tsx`

#### 9.5 Playwright E2E Setup
- [ ] **9.5.1** — Install Playwright: `pnpm add -D @playwright/test`
- [ ] **9.5.2** — Create `playwright.config.ts`
- [ ] **9.5.3** — Create `e2e/` directory structure

#### 9.6 E2E Tests
- [ ] **9.6.1** — Create `e2e/home.spec.ts`
  - Visit `/`, verify hero section renders
  - Verify search bar functional
  - Verify navigation links work
- [ ] **9.6.2** — Create `e2e/agent-profile.spec.ts`
  - Visit `/agent/[slug]`, verify profile renders
  - Verify sales section loads
  - Verify reviews section loads
- [ ] **9.6.3** — Create `e2e/suburb-listing.spec.ts`
  - Visit `/agents/nsw/bondi-beach`, verify agent cards render
  - Verify pagination works
  - Verify filter/sort works
- [ ] **9.6.4** — Create `e2e/search.spec.ts`
  - Type in search bar, verify autocomplete
  - Submit search, verify results page
- [ ] **9.6.5** — Create `e2e/agency-profile.spec.ts`
  - Visit `/agency/[slug]`, verify profile renders

#### 9.7 generateStaticParams Population
- [ ] **9.7.1** — Update `src/app/agent/[slug]/page.tsx` generateStaticParams
  - Currently returns `[]` (empty)
  - Should return top 100 agents by sales count for pre-rendering
- [ ] **9.7.2** — Update `src/app/agency/[slug]/page.tsx` generateStaticParams
  - Currently returns `[]` (empty)
  - Should return all agencies
- [ ] **9.7.3** — Update `src/app/agents/[state]/[suburb-slug]/page.tsx` generateStaticParams
  - Currently returns `[]` (empty)
  - Should return top 50 suburbs by agent count

**Note:** These pages currently render on-demand (ISR), not pre-built. Populating generateStaticParams improves initial load performance and SEO.

#### 9.8 Error Handling Audit
- [ ] **9.8.1** — Fix silent error handling in `src/app/sitemap.ts`
  - Currently has empty catch blocks
  - Add proper error logging
- [ ] **9.8.2** — Add Sentry or similar error tracking
- [ ] **9.8.3** — Create error boundary component for graceful failures

---

## Key Learnings (Preserved)

- better-sqlite3 needs `serverExternalPackages` in next.config.ts
- pnpm 10: `pnpm.onlyBuiltDependencies` in package.json for native modules
- Tailwind 4: CSS @theme, no tailwind.config.js
- ESLint 9: `eslint .` not `next lint` (deprecated). Needs `@eslint/eslintrc`. Exclude agent-ralph-ui/, agent-ralph/, ralph/
- FTS5 migration: manual SQL via db.exec() (not in Drizzle journal)
- Next.js 15: params/searchParams are Promises — must await
- SuburbBadge: route must be `/agents/{state}/{slug}` not `/suburb/{slug}`; requires state prop

---

## Unresolved Questions

1. **ElevenLabs agent** — created in dashboard yet? Required for Phase 8.
2. **ElevenLabs LLM** — gpt-4o or claude-3-5-sonnet?
3. **@elevenlabs/react** — must install before Phase 8.
4. **Claude Agent SDK** — Is `@anthropic-ai/claude-agent-sdk` the correct package name? Verify before Phase 3.
5. **Image storage** — Use local `public/` or external CDN (S3, Cloudflare R2)?

---

## File Structure Summary

### Files to Create (Phase 3 - Data Pipeline)
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

### Files to Create (Phase 8 - Voice)
```
src/lib/voice/
├── elevenlabs.ts
├── context-builders.ts
├── prompts/
│   ├── navigator.ts
│   ├── assistant-agent.ts
│   ├── assistant-agency.ts
│   ├── assistant-suburb.ts
│   └── index.ts
├── tools/
│   ├── navigator-tools.ts
│   ├── assistant-tools.ts
│   └── index.ts
└── index.ts

src/components/voice/
├── VoiceProvider.tsx
├── VoiceButton.tsx
├── VoicePanel.tsx
├── AudioWaveform.tsx
├── VoiceError.tsx
├── MobileVoiceSheet.tsx
└── index.ts
```

### Files to Create (Phase 9 - Testing)
```
src/__tests__/
├── db/
│   └── queries.test.ts
├── api/
│   ├── search.test.ts
│   ├── agent.test.ts
│   ├── agency.test.ts
│   └── suburb.test.ts
└── components/
    ├── AgentCard.test.tsx
    ├── SearchBar.test.tsx
    └── Pagination.test.tsx

e2e/
├── home.spec.ts
├── agent-profile.spec.ts
├── suburb-listing.spec.ts
├── search.spec.ts
└── agency-profile.spec.ts
```

---

## Build Status

Last verified: 2026-01-28

- [x] TypeScript: `pnpm typecheck` passes
- [x] ESLint: `pnpm lint` passes
- [x] Build: `pnpm build` passes (21 routes)
- [ ] Tests: No test suite yet (Phase 9)

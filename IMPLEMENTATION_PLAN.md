# AgentIndex Implementation Plan

Status: **GREENFIELD** — no src/, pipeline/, configs, or deps exist yet.

---

## Spec Inconsistencies (resolve during build)

- `spec-architecture.md` line 159 says "Next.js 14+" — should be 15.x per `spec-tech-stack.md`
- `spec-tech-stack.md` mentions `ANTHROPIC_API_KEY` env var — `AGENTS.md` says Claude Code Max subscription (no key needed). Support both: env var if set, else CLI auth.
- `spec-architecture.md` references `data/suburbs.json` but `spec-data-model.md` seeds from Matthew Proctor CSV. **Use CSV** (spec-data-model is authoritative).
- `spec-tech-stack.md` data pipeline structure shows `scripts/` top-level — `spec-architecture.md` shows `pipeline/`. **Use `pipeline/`** (more explicit).

---

## Phase 1: Tech Stack + Architecture

- [ ] **1.1 Init Next.js 15 project** — `pnpm create next-app@latest` w/ App Router, TypeScript, Tailwind, ESLint, src/ dir
- [ ] **1.2 Install core deps** — `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `@elevenlabs/react`, `zod`, `lucide-react`, `slugify`, `csv-parse`
- [ ] **1.3 Install dev deps** — `@types/better-sqlite3`, `prettier`, `tsx`, `@vercel/og`
- [ ] **1.4 Configure TypeScript** — strict mode, path aliases (`@/` → `src/`)
- [ ] **1.5 Configure Tailwind 4** — custom colors (voqo green `#26C169`, dark green `#126D39`, lime `#ECF87F`), fonts (Montserrat, Inter, Fraunces), brutalist shadows
- [ ] **1.6 Configure Drizzle** — `drizzle.config.ts` pointing to `data/agentindex.db`, schema in `src/lib/db/schema.ts`, migrations dir `drizzle/`, dialect `sqlite`
- [ ] **1.7 Configure Next.js** — `next.config.ts` with image domains, headers (CSP, X-Robots-Tag noindex on /api/)
- [ ] **1.8 Create directory structure** — `src/app/`, `src/components/{ui,agent,voice,navigation,search}`, `src/lib/{db,voice,utils,api,seo}`, `pipeline/{agents,schemas,scripts}`, `data/`, `public/images/{agents,agencies,properties}`, `drizzle/`, `scripts/`
- [ ] **1.9 Create .env.example** — `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `DATABASE_URL=file:./data/agentindex.db`, `NODE_ENV`
- [ ] **1.10 Create .gitignore additions** — `data/agentindex.db`, `.env.local`, `public/images/agents/`, `public/images/agencies/`, `public/images/properties/`
- [ ] **1.11 Add pnpm scripts** — `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `db:generate` (`drizzle-kit generate`), `db:migrate` (`drizzle-kit migrate`), `db:push`, `db:studio`, `seed:suburbs`, `pipeline:run`
- [ ] **1.12 Configure Google Fonts** — Montserrat (400,600,700,900), Inter (400,500,600,700), Fraunces (400,600) via `next/font/google` in root layout
- [ ] **1.13 Create globals.css** — Tailwind directives, base styles, brutalist border defaults, dot pattern bg utility, voice waveform animation keyframes (`voice-pulse`)
- [ ] **1.14 Create root layout** — `src/app/layout.tsx` with fonts, metadata defaults, body structure
- [ ] **1.15 Create formatting utils** — `src/lib/utils/format.ts`: AU currency (`$1,250,000`), compact price (`$1.25M`), date (DD MMM YYYY), relative date, number with commas, percentage

**Chrome verify: start dev server, navigate to `/`, confirm blank page renders with correct fonts and Tailwind styles applied.**

---

## Phase 2: Data Model

- [ ] **2.1 Define Drizzle schema — agencies table** — per spec-data-model: id, slug (unique), name, brandName, logoUrl, websiteUrl, phone, email, streetAddress, suburb, state, postcode, lat, lng, description, totalAgents, totalSalesCount, totalSalesVolume, sourceUrl, lastScrapedAt, timestamps; indexes: slug (unique), state, postcode
- [ ] **2.2 Define Drizzle schema — agents table** — per spec-data-model: ~30 columns — identity (firstName, lastName, fullName), contact (email, phone, mobilePhone), media (photoUrl), licensing (licenseNumber, licenseStatus, licenseState), agencyId FK, profile (bio, yearsActive, languagesSpoken JSON, specializations JSON, suburbsServiced JSON), perf metrics (totalSalesCount, totalSalesVolume, medianSalePrice, averageDaysOnMarket, listingAccuracy), ratings (ratingsAverage, ratingsCount), quality (profileCompleteness, dataQualityScore), source tracking, timestamps; indexes: slug (unique), agencyId, licenseNumber, licenseState, ratingsAverage, totalSalesCount, dataQualityScore
- [ ] **2.3 Define Drizzle schema — suburbs table** — per spec-data-model: id, slug (unique), name, state, postcode, lat, lng, localGovernmentArea, stateElectorate, totalAgents, medianHousePrice, medianUnitPrice, timestamps; indexes: slug (unique), state, postcode, composite (name, state)
- [ ] **2.4 Define Drizzle schema — agent_suburbs junction** — agentId FK (cascade), suburbId FK (cascade), isPrimary (boolean), salesCount; unique constraint on (agentId, suburbId)
- [ ] **2.5 Define Drizzle schema — sales table** — per spec-data-model: agentId FK (cascade), agencyId FK (set null), propertyAddress, suburb, state, postcode, propertyType, salePrice, listingPrice, saleMethod, saleDate, daysOnMarket, bedrooms, bathrooms, carSpaces, landArea, floorArea, imageUrl, sourceUrl, createdAt; indexes: agentId, agencyId, suburb, saleDate, propertyType, composite (agentId, saleDate)
- [ ] **2.6 Define Drizzle schema — reviews table** — per spec-data-model: agentId FK (cascade), reviewerName, reviewDate, reviewerType, overallRating (required), knowledgeRating, communicationRating, negotiationRating, reviewText, priceRange, sourceUrl, sourcePlatform, createdAt; indexes: agentId, overallRating, reviewDate
- [ ] **2.7 Define Drizzle schema — pipeline_runs table** — per spec-data-model: startedAt, completedAt, status (pending|running|completed|failed), agentModel, targetLocation, counts (agencies, agents, sales, reviews found), totalCostUsd, errorLog, createdAt; indexes: status, startedAt
- [ ] **2.8 Define Drizzle relations** — agency hasMany agents; agent belongsTo agency; agent hasMany sales, reviews; agent manyToMany suburbs via agentSuburbs; agency hasMany sales
- [ ] **2.9 Export TypeScript types** — `InferSelectModel`/`InferInsertModel` for all tables; `AgentWithParsedFields`, `AgentWithRelations`, `AgencyWithAgents` convenience types per spec-data-model
- [ ] **2.10 Generate & apply initial migration** — `pnpm db:generate && pnpm db:migrate`
- [ ] **2.11 Create FTS5 virtual tables migration** — hand-written `drizzle/0001_fts5_virtual_tables.sql`: agents_fts (full_name, bio, suburbs_serviced, specializations), agencies_fts (name, brand_name, suburb, description), suburbs_fts (name, postcode, local_government_area); INSERT/UPDATE/DELETE triggers for each
- [ ] **2.12 Create DB connection module** — `src/lib/db/index.ts`: singleton better-sqlite3 + Drizzle instance; read-only mode for webapp (pragma journal_mode), read-write for pipeline; export `db` and `sqliteDb` (raw)
- [ ] **2.13 Create slug utility** — `src/lib/utils/slug.ts`: lowercase, trim, remove apostrophes, & → "and", non-alnum → hyphen, collapse hyphens; agent slug dedup (try base, then +suburb, then +N); agency slug dedup; suburb slug = `name-state`
- [ ] **2.14 Create JSON field helpers** — `src/lib/utils/json.ts`: `parseJsonArray(raw)`, `serializeJsonArray(arr)` per spec-data-model
- [ ] **2.15 Create data quality score calculator** — `src/lib/utils/data-quality.ts`: `computeDataQualityScore()` and `computeProfileCompleteness()` per spec-data-model formula (0.3 profile + 0.3 sales + 0.2 reviews + 0.1 photo + 0.1 license)
- [ ] **2.16 Download Matthew Proctor CSV** — place in `data/australian_postcodes.csv` from matthewproctor.com
- [ ] **2.17 Create seed suburbs script** — `scripts/seed-suburbs.ts`: parse CSV via `csv-parse`, map fields (locality→name, state, postcode, lat, long, LGA, electorate), generate slugs, batch insert 500/batch, onConflictDoNothing, idempotent
- [ ] **2.18 Run seed** — `pnpm seed:suburbs` → verify ~16k rows in suburbs table

---

## Phase 3: Data Pipeline

- [ ] **3.1 Define Zod schemas** — `pipeline/schemas/agency.ts`, `agent.ts`, `sale.ts`, `review.ts` matching spec-data-pipeline (AgencyOutput, AgentOutput, SaleOutput, ReviewOutput)
- [ ] **3.2 Create pipeline orchestrator** — `pipeline/scripts/pipeline.ts` CLI entry; parse args (--location, --agencies, --discover-agencies, --limit); create pipeline_run record; coordinate sub-agents; update pipeline_run on completion
- [ ] **3.3 Create Agency Researcher sub-agent** — `pipeline/agents/agency-researcher.ts`; Claude Agent SDK `query()` with WebSearch+WebFetch tools; finds agencies in location, extracts team pages, returns AgencyOutput[]
- [ ] **3.4 Create Agent Researcher sub-agent** — `pipeline/agents/agent-researcher.ts`; deep-dive single agent: sales history, reviews, property images, license lookup
- [ ] **3.5 Create License Verifier sub-agent** — `pipeline/agents/license-verifier.ts`; NSW Fair Trading/Service NSW register lookup; returns license number, status, dates
- [ ] **3.6 Create Sales Historian sub-agent** — `pipeline/agents/sales-historian.ts`; multi-source (Domain, agency sold pages, RateMyAgent); returns SaleOutput[]
- [ ] **3.7 Create Review Aggregator sub-agent** — `pipeline/agents/review-aggregator.ts`; RateMyAgent, Google Business, agency testimonials; returns ReviewOutput[]
- [ ] **3.8 Create data storage module** — `pipeline/scripts/store.ts`; transaction-based upsert: agency by slug, agents by slug+agencyId, sales/reviews onConflictDoNothing; compute data quality scores; generate slugs
- [ ] **3.9 Create rate limiter** — `pipeline/scripts/rate-limiter.ts`; max concurrent agents (10), per-domain rate limiting (30 req/min)
- [ ] **3.10 Create dedup module** — `pipeline/scripts/dedup.ts`; agency matching (name+suburb), agent matching (firstName+lastName+agencyId), sale matching (normalized address+date)
- [ ] **3.11 Create image downloader** — `pipeline/scripts/images.ts`; parallel download (10 concurrent), store to `public/images/{type}/{slug}/`
- [ ] **3.12 Run first Bondi Beach pipeline** — `pnpm pipeline:run --location "Bondi Beach, NSW" --discover-agencies --limit 5` → verify data in DB
- [ ] **3.13 Expand to surrounding suburbs** — 20+ agencies, 200+ agents target

---

## Phase 3.5: Database Query Helpers

- [ ] **3.5.1 Create query helpers module** — `src/lib/db/queries.ts`: reusable query functions used by both API routes and SSG page data fetching
- [ ] **3.5.2 Agent queries** — `getAgentBySlug(slug)` (with relations: agency, suburbs, recent sales, reviews), `getAgentsList(filters)` (paginated, sorted, filtered by suburb/agency/state/propertyType), `getSimilarAgents(agentId, suburbIds, limit)`, `getAgentCount(filters)`
- [ ] **3.5.3 Agency queries** — `getAgencyBySlug(slug)` (with agents, stats, recent sales), `getAgenciesList(filters)` (paginated, sorted, filtered by state), `getAgencyCount(filters)`
- [ ] **3.5.4 Suburb queries** — `getSuburbBySlug(slug)` (with market stats, agent count), `getSuburbsList(filters)` (by state, sorted), `getNearbySuburbs(lat, lng, radiusKm, limit)` (Haversine distance), `getTopSuburbs(state, limit)`
- [ ] **3.5.5 Search queries** — `searchFTS(query, type, limit)` (unified FTS5 search across all entity types), `autocompleteFTS(prefix, limit)` (prefix match)
- [ ] **3.5.6 Stats queries** — `getSiteStats()` (total agents, suburbs, agencies, sales), `getStateStats(state)`, `getSuburbMarketStats(suburbSlug)`

---

## Phase 4: API

- [ ] **4.1 Create shared API utils** — `src/lib/api/response.ts` (success/error JSON helpers, error codes), `src/lib/api/cache.ts` (Cache-Control header helper: 60s search, 300s lists, 3600s profiles, 0 voice)
- [ ] **4.2 GET /api/search** — FTS5 query; params: q (required), type (all|agent|agency|suburb), limit (1-20, default 5); grouped results; cache 60s
- [ ] **4.3 GET /api/search/autocomplete** — FTS5 prefix match; params: q (min 2 chars), limit (default 8); returns type+label+slug suggestions; cache 60s
- [ ] **4.4 GET /api/agents** — filtered/sorted/paginated; params: suburb, agency, state, property_type, sort, page, limit (max 50); cache 300s
- [ ] **4.5 GET /api/agent/[slug]** — full profile with relations (agency, suburbs, sales, reviews); cache 3600s
- [ ] **4.6 GET /api/agency/[slug]** — agency + stats + agents[] + recent_sales[]; cache 3600s
- [ ] **4.7 GET /api/suburb/[slug]** — suburb info + market stats + paginated agents; cache 3600s
- [ ] **4.8 POST /api/voice/signed-url** — accepts { pageType, slug, voiceMode }; builds system prompt per mode; calls ElevenLabs signed URL endpoint; returns { signedUrl, sessionId, expiresAt }; no cache
- [ ] **4.9 POST /api/revalidate** — ISR revalidation endpoint; bearer token auth; accepts { paths: string[] }; calls `revalidatePath()` for each

---

## Phase 5: Design System

- [ ] **5.1 Button** — `src/components/ui/button.tsx`; 4 variants (primary/secondary/ghost/destructive), 3 sizes (sm/md/lg), 2-3px black border, active:scale-95
- [ ] **5.2 Card** — `src/components/ui/card.tsx`; white bg, 2px black border, rounded-lg, p-6, hover:-translate-y-1 hover:shadow-lg
- [ ] **5.3 Badge** — `src/components/ui/badge.tsx`; variants: license (green/red/gray), property type, review type, sale method, verification
- [ ] **5.4 Input** — `src/components/ui/input.tsx`; h-10, 2px black border, green focus ring, error state (red border + AlertCircle icon)
- [ ] **5.5 StarRating** — `src/components/ui/star-rating.tsx`; sm/md/lg sizes, filled=#26C169, half-star, accessible (aria-label)
- [ ] **5.6 Pagination** — `src/components/ui/pagination.tsx`; w-9 h-9 buttons, active=green bg, disabled=opacity-50, ellipsis, prev/next
- [ ] **5.7 Skeleton** — `src/components/ui/skeleton.tsx`; gray-200 blocks, animate-pulse, card variant
- [ ] **5.8 StatCard** — `src/components/ui/stat-card.tsx`; icon + large number (text-3xl font-black) + label, brutalist border
- [ ] **5.9 AgentCard** — `src/components/agent/agent-card.tsx`; photo 80x80 (initials fallback w/ green bg), name H3 linked, agency, star rating, stats row, suburb badges (max 3), CTA buttons
- [ ] **5.10 AgentPhoto** — `src/components/agent/agent-photo.tsx`; Next.js Image wrapper, initials fallback (first letters of first+last name, green circle), configurable sizes
- [ ] **5.11 SuburbBadge** — `src/components/ui/suburb-badge.tsx`; linked chip, primary=green bg, secondary=gray-100
- [ ] **5.12 PriceDisplay** — `src/components/ui/price-display.tsx`; formatted AU currency, optional YoY change (green/red arrow)
- [ ] **5.13 PropertyTypeIcon** — `src/components/ui/property-type-icon.tsx`; Lucide icons: Home (house), Building2 (unit), Trees (land), Building (townhouse)
- [ ] **5.14 SearchBar** — `src/components/search/search-bar.tsx`; 2px black border, left Search icon, autocomplete dropdown grouped by type, keyboard nav (up/down/enter/esc), debounced 200ms fetch
- [ ] **5.15 GlobalNav** — `src/components/navigation/global-nav.tsx`; sticky top-0 z-50, h-16 desktop / h-14 mobile, logo left, search center (desktop), nav links (Agents, Agencies), voice mic button right, mobile hamburger + search icon
- [ ] **5.16 GlobalFooter** — `src/components/navigation/global-footer.tsx`; dark bg, state links grid (top 5 suburbs per state), "Powered by Voqo AI" tagline, legal links
- [ ] **5.17 VoiceButton** — `src/components/voice/voice-button.tsx`; 56px circular, green bg, 3px black border, pulse animation idle, Mic/Volume2 icons based on state
- [ ] **5.18 VoicePanel** — `src/components/voice/voice-panel.tsx`; mobile=bottom sheet, desktop=popover 320px; states: idle/connecting/listening/speaking/error; 5-bar waveform visualizer; status text; X to close
- [ ] **5.19 VoiceProvider** — `src/components/voice/voice-provider.tsx`; React context; manages mode (navigator/assistant), session state, mode switching via `voice-mode-change` custom event
- [ ] **5.20 FilterBar** — `src/components/search/filter-bar.tsx`; sticky, sort dropdown, property type multi-select chips, results count
- [ ] **5.21 Table** — `src/components/ui/table.tsx`; 2px black border, rounded-lg, gray-100 header, zebra striping, responsive (cards on mobile)
- [ ] **5.22 Breadcrumb** — `src/components/ui/breadcrumb.tsx`; Home > State > Suburb pattern, ChevronRight separators, current page not linked

**Chrome verify: start dev server, navigate to `/`, confirm GlobalNav renders with brutalist styling, green brand color, Montserrat heading font.**

---

## Phase 6: Pages

- [ ] **6.1 Homepage (`/`)** — Hero (H1 + SearchBar + voice CTA), Featured Suburbs (12 cards, 4-col grid), How It Works (3 steps), Stats Banner (black bg, white text), Popular Agencies carousel; data from query helpers; ISR 1hr
  - Chrome verify: navigate to `/`, confirm hero, suburb grid, stats banner render

- [ ] **6.2 Agent Profile (`/agent/[slug]/`)** — `generateStaticParams` from all agent slugs; Header (photo 200x200, name H1, agency link, license badge, experience, languages, contact, "Talk to Assistant" CTA), Performance Stats (6 StatCards), Suburbs Served (badges), Sales History (Table paginated 20/page), Reviews (star + sub-ratings + cards paginated 10/page), Similar Agents carousel; ISR 24hr
  - Chrome verify: navigate to `/agent/[test-slug]/`, confirm 6 sections render

- [ ] **6.3 Suburb Listing (`/agents/[state]/[suburb-slug]/`)** — `generateStaticParams` returns `{state, 'suburb-slug'}` pairs; Suburb Header (H1, agent count, market stats grid, voice CTA), FilterBar, Agent Cards list (paginated 20/page), Suburb Stats (auto-gen paragraph, median prices table, top sales), Nearby Suburbs (6 cards); ISR 6hr
  - Chrome verify: navigate to `/agents/nsw/bondi-beach-nsw/`, confirm agent cards, market stats, filter bar

- [ ] **6.4 Agency Profile (`/agency/[slug]/`)** — `generateStaticParams` from all agency slugs; Agency Header (logo, name H1, contact, stats grid, voice CTA), Agent Roster (3-col grid sortable), Agency Stats (perf grid, property type breakdown, top suburbs table), Recent Sales (paginated 20/page); ISR 24hr
  - Chrome verify: navigate to `/agency/[test-slug]/`, confirm header, roster, stats

- [ ] **6.5 All Agencies (`/agencies/`)** — Header (H1, total count), State Filter Tabs (horizontal scroll, green active underline, ?state= param), Agency Grid (4-col, sortable, paginated 24/page); ISR 6hr
  - Chrome verify: navigate to `/agencies/`, confirm state tabs and agency grid

- [ ] **6.6 State Listing (`/agents/[state]/`)** — `generateStaticParams` returns 8 states (nsw, vic, qld, sa, wa, tas, nt, act); State Header (H1, stats row, auto-gen description), Search Bar (suburb autocomplete within state), Top Suburbs Grid (4-col, paginated 48/page); ISR 12hr
  - Chrome verify: navigate to `/agents/nsw/`, confirm state header and suburb grid

- [ ] **6.7 All Agents (`/agents/`)** — Header (H1 "Real Estate Agents by State"), 8 State Cards (4-col grid, each: state name H2, abbreviation badge, stats counts, CTA → `/agents/[state]/`); static
  - Chrome verify: navigate to `/agents/`, confirm 8 state cards in grid

- [ ] **6.8 404 page** — `src/app/not-found.tsx`; message, search bar, directory links
- [ ] **6.9 Error page** — `src/app/error.tsx` (client component); message, retry button
- [ ] **6.10 Loading skeletons** — `src/app/loading.tsx` + per-route loading.tsx with Skeleton components

---

## Phase 7: SEO

- [ ] **7.1 Metadata utility** — `src/lib/seo/metadata.ts`; `generateMetadata` helpers per page type; title templates 50-60 chars, descriptions 150-160 chars, OpenGraph tags
- [ ] **7.2 Agent Profile JSON-LD** — `RealEstateAgent` schema: name, image, telephone, worksFor, areaServed, aggregateRating, review[]
- [ ] **7.3 Suburb Listing JSON-LD** — `ItemList` of RealEstateAgents + `BreadcrumbList`
- [ ] **7.4 Agency Profile JSON-LD** — `RealEstateAgent` (org): name, logo, address, telephone, employee[], aggregateRating, areaServed
- [ ] **7.5 Homepage JSON-LD** — `WebSite` with `SearchAction` (sitelinks search box target /api/search?q={query})
- [ ] **7.6 Breadcrumbs** — visible Breadcrumb component + `BreadcrumbList` JSON-LD on all pages
- [ ] **7.7 Sitemap** — `src/app/sitemap.ts`; split: agents (priority 0.8), suburbs (0.9), agencies (0.7), static pages (0.5); lastmod from updatedAt
- [ ] **7.8 robots.txt** — `src/app/robots.ts`; Allow /, Disallow /api/, Sitemap URL
- [ ] **7.9 Canonical tags** — self-referencing every page; pagination/sort params → canonical = page 1 default sort
- [ ] **7.10 OG image generation** — `src/app/api/og/route.tsx` via `@vercel/og`; dynamic images for agent (photo+name+stats), suburb (name+count), agency (logo+name)
- [ ] **7.11 Internal linking audit** — agent→agency+suburbs+similar (10-20 links), suburb→agents+nearby (50-100), agency→agents+suburbs (20-50), footer→states+top 20 suburbs

---

## Phase 8: Voice Integration

- [ ] **8.1 ElevenLabs agent template** — configure in dashboard: model (gpt-4o-mini or claude), temperature 0.7, max_tokens 150, Australian voice (eleven_turbo_v2), enable "Allow overrides", require signed URLs, register all client tools
- [ ] **8.2 Signed URL API implementation** — extend 4.8: build system prompts for Navigator vs Assistant mode; Navigator = site guide; Assistant = full entity context injection
- [ ] **8.3 Navigator client tools** — `src/lib/voice/navigator-tools.ts`: `navigateToPage`, `searchAgents` (→/api/search), `filterResults`, `scrollToSection`, `activateAssistant` (dispatch voice-mode-change), `highlightAgent`
- [ ] **8.4 Assistant client tools** — `src/lib/voice/assistant-tools.ts`: `scrollToSection` only
- [ ] **8.5 Wire VoiceProvider to SDK** — `useConversation()` hook; mic permission flow; session lifecycle; mode switching (Navigator ↔ Assistant); 5-min session limit
- [ ] **8.6 Navigator system prompt** — site stats context, navigation instructions, tool usage, Australian English, concise voice-first responses
- [ ] **8.7 Assistant system prompts** — 3 variants: agent (profile+stats+sales+reviews), agency receptionist (agency+roster), suburb expert (market stats+top agents); all end with "Demo by Voqo AI"
- [ ] **8.8 Context data fetchers** — `src/lib/voice/context.ts`: build rich context strings from DB for each page type per spec-voice format
- [ ] **8.9 Voice UI states** — idle/connecting/listening/speaking/error; waveform via `getInputByteFrequencyData()`; status text transitions
- [ ] **8.10 Mobile voice** — bottom sheet full-width, touch-friendly, large tap targets

**Chrome verify: navigate to agent profile, click "Talk to Assistant", confirm voice panel opens with UI states. Test Navigator on homepage.**

---

## Unresolved Questions

1. **Matthew Proctor CSV** — download URL? Or provide manually?
2. **ElevenLabs agent** — created in dashboard yet, or needs setup first?
3. **ElevenLabs LLM choice** — gpt-4o-mini (cheaper, faster) or claude-3-5-sonnet?

# AgentIndex — Product Requirements Document

## What We're Actually Building

This isn't a directory. This is a demand generation machine that:

- Captures high-intent consumer traffic via programmatic SEO (50k+ indexed pages)
- Demonstrates Voqo's core product (voice agents) in every interaction
- Builds a data moat that compounds over time

## The Physics of This Business

**Traffic → Experience → Lead**

```
Consumer searches "[agent name]" or "real estate agents [suburb]"
    ↓
Lands on your page (SEO — SSG via Vercel Edge CDN)
    ↓
Gets value (agent data, no friction, zero auth)
    ↓
Interacts with voice agent (product demo disguised as utility)
```

## Why Competitors Are Beatable

| Competitor | Their Weakness | Your Advantage |
|---|---|---|
| RateMyAgent | Pay-to-play model, reviews gated behind subscriptions, requires sign-up | Free, unbiased, no login required |
| OpenAgent | Takes 20-30% commission, acts as middleman | You're a tool, not a broker |
| LocalAgentFinder | Requires registration to compare, charges agents per sale | Zero friction for consumers |

**Common weakness across all:** None of them let you experience what working with an agent feels like before contacting them. You change that with voice. None show license verification status, sale accuracy, or days-on-market per agent.

## Core Pages (Programmatic SEO Architecture)

```
/                                   → Homepage (search, featured suburbs, stats)
/agents/                            → All agents directory (state cards)
/agents/[state]/                    → State-level agent list (suburb cards)
/agents/[state]/[suburb-slug]/      → Suburb-level agent list (money page)
/agent/[slug]/                      → Individual agent profile (money page)
/agencies/                          → All agencies directory
/agency/[slug]/                     → Individual agency profile
```

7 page types. All SSG with ISR. Mobile-first brutalist design derived from Voqo.ai branding.

## Page Templates

### 1. Agent Profile Page (`/agent/[slug]/`)

**Data displayed:**

- Name, photo (scraped or initials placeholder)
- Agency affiliation (linked)
- License number & status badge (active/suspended/unknown)
- Suburbs serviced (badge chips, linked to suburb pages)
- Years active, languages spoken, specializations
- Performance stats: sales count, avg/median price, days on market, sale accuracy
- Property type breakdown (donut chart)
- Sales history table (paginated, filterable by type/date)
- Reviews with sub-ratings (communication, knowledge, negotiation, responsiveness, marketing)
- Similar agents carousel

**Voice Integration — Two Modes:**

#### A. Navigator (global, all pages)

- Floating green mic button (bottom-right)
- Helps find agents/suburbs/agencies via voice
- Client tools: `navigateToPage`, `searchAgents`, `filterResults`, `scrollToSection`, `highlightAgent`, `activateAssistant`
- Can switch user to Assistant mode

#### B. Assistant (per-agent context)

- "Talk to [Agent Name]'s Assistant" CTA
- Pre-loaded with: agent profile, stats, sales, reviews, agency info
- Answers questions about this specific agent's track record
- End of call: "This is a demo of AI-powered assistance by Voqo AI."

### 2. Suburb Page (`/agents/[state]/[suburb-slug]/`)

**Data displayed:**

- All agents active in that suburb (paginated cards)
- Market stats: median price (with YoY change), avg DOM, total sales, price range
- Filter/sort by: sales count, rating, avg price, name, property type
- Auto-generated suburb overview text (SEO)
- Median price by property type table
- Notable recent sales
- Nearby suburbs (within 10km)

**Voice Integration:**

- Navigator: "Help me find an agent in [Suburb]"
- Assistant: Suburb expert — asks qualifying questions (buying/selling? type? budget?), recommends 2-3 agents

### 3. Agency Page (`/agency/[slug]/`)

**Data displayed:**

- Agency name, logo, address, contact
- Summary stats: total agents, sales count, total value, avg price
- Agent roster (grid, sortable)
- Property type breakdown
- Top suburbs covered (table)
- Recent sales (table, paginated)

**Voice Integration:**

- "Talk to [Agency] Reception" — voice receptionist demo (Voqo Ava/Alex)

### 4-7. Additional Pages

- **All Agents (`/agents/`)** — State cards with agent/suburb/sales counts
- **State Listing (`/agents/[state]/`)** — Suburb grid for that state, search bar
- **All Agencies (`/agencies/`)** — Agency grid, state filter tabs
- **Homepage (`/`)** — Hero + search, featured suburbs (12), how it works, stats banner, agency carousel

## Technical Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript 5 | SSG/ISR critical for SEO at scale |
| **Database** | SQLite 3 (`better-sqlite3`) + Drizzle ORM | Single-file, zero hosting cost, fast reads, sufficient for MVP |
| **Search** | SQLite FTS5 (full-text search) | Built-in, no external service needed |
| **Voice** | ElevenLabs Conversational AI (`@elevenlabs/react`) | Client-side SDK, signed URL auth |
| **Data Pipeline** | Claude Agent SDK (TypeScript), Zod | AI-powered parallel sub-agents for web research |
| **Styling** | Tailwind CSS 4, Lucide Icons | Utility-first, modern brutalist design system |
| **Fonts** | Montserrat (headings), Inter (body), Fraunces (accents) | Google Fonts |
| **Hosting** | Vercel | Edge CDN, auto Next.js optimization, auto-deploy from `main` |
| **Package Manager** | pnpm | Faster, disk-efficient |

**Not using:** PostgreSQL (SQLite simpler), Algolia/Meilisearch (FTS5 sufficient), Python (full TS stack), Redis (no caching needed at scale), Auth (no user accounts in v1).

## Data Model

7 tables, 3 FTS5 virtual tables. All data written by pipeline, read-only from web app.

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `agents` | ~35 cols. Central entity | name, license, agency FK, bio, performance stats, ratings, data quality score |
| `agencies` | Agency profiles | name, brand, location, contact, denormalized stats |
| `suburbs` | ~16k rows, seeded from Matthew Proctor CSV | name, state, postcode, lat/lng, LGA, market stats |
| `agent_suburbs` | Many-to-many junction | isPrimary, salesCount |
| `sales` | Individual property sales | address, price, date, method, DOM, property attrs |
| `reviews` | Agent reviews from multiple platforms | ratings (overall + sub), text, source platform |
| `pipeline_runs` | Pipeline execution audit log | timing, status, counts, cost, errors |

**Slug rules:** Agent = `{name}[-suburb][-N]`, Agency = `{name}[-suburb]`, Suburb = `{name}-{state}`

## Data Pipeline (Claude Agent SDK)

**Architecture:** TypeScript orchestrator spawns parallel sub-agents per agency. Each sub-agent uses `WebSearch` + `WebFetch` to gather structured data validated by Zod schemas.

**Sub-agents:**
- `agencyResearcher` — Agency + full team extraction
- `agentResearcher` — Deep-dive sales/reviews per agent
- `licenseVerifier` — NSW Fair Trading license lookup
- `salesHistorian` — Multi-source sales aggregation
- `reviewAggregator` — RateMyAgent, Google, agency site reviews

**Data sources:** Agency websites (safe), NSW Fair Trading/Service NSW (public record), RateMyAgent public profiles (careful), Domain.com.au public listings (careful), Google Business (safe).

**Execution:** Manual CLI. No cron in v1.
```bash
pnpm pipeline:run --location "Bondi Beach, NSW" --agencies "Ray White,McGrath"
pnpm pipeline:run --location "Bondi Beach, NSW" --discover-agencies --limit 10
```

**Dedup:** Match by name+agency (agents), name+suburb (agencies), normalized address+date (sales). On conflict, preserve highest-quality data.

**Cost estimate:** ~$0.30/agency. Full Bondi run (20 agencies): ~$6. Monthly 1000 agencies: ~$300.

## API Endpoints

7 Next.js API routes. All public, no auth, read-only from SQLite.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/search` | GET | Universal FTS5 search (agents, agencies, suburbs) |
| `/api/search/autocomplete` | GET | Fast prefix matching, min 2 chars |
| `/api/agents` | GET | Filtered/sorted/paginated agent list |
| `/api/agent/[slug]` | GET | Full agent profile with relations |
| `/api/agency/[slug]` | GET | Full agency profile with agents |
| `/api/suburb/[slug]` | GET | Suburb data with market stats |
| `/api/voice/signed-url` | POST | ElevenLabs signed URL generation (server-side key) |

**Caching:** Search 60s, profiles 3600s, voice uncached.

## Voice Architecture

One ElevenLabs agent template with dynamic overrides per session.

**Navigator mode:** Global floating button. System prompt = directory guide. 6 client tools for page navigation, search, filtering, scrolling, highlighting, mode switching.

**Assistant mode:** Per-page button. System prompt dynamically built from agent/agency/suburb context. 1 client tool (scrollToSection). Mentions Voqo AI at conversation end.

**Auth flow:** Client → POST `/api/voice/signed-url` → server builds prompt + calls ElevenLabs → returns signed WebSocket URL → client starts session.

**Session limit:** 5 minutes. ~$0.08-0.10/minute.

## SEO Strategy

**Scale:** 50,000+ indexed pages
**Rendering:** SSG (non-negotiable) — Googlebot sees complete HTML, zero JS execution required
**Structured data:** `RealEstateAgent`, `ItemList`, `BreadcrumbList`, `WebSite` JSON-LD on all pages
**Sitemaps:** Split by entity type (`sitemap-agents.xml`, `sitemap-suburbs.xml`, `sitemap-agencies.xml`)

**Keyword tiers:**
1. Agent name searches (long-tail, high intent, low competition)
2. Suburb searches (higher volume — "real estate agents [suburb]")
3. Agency searches
4. Generic/research (deferred to Phase 2 blog content)

**Internal linking:** Agent pages link to agency + suburbs + similar agents (10-20 links). Suburb pages are primary hubs (50-100 links). Footer links to all states + top 20 suburbs.

**Core Web Vitals targets:** LCP <2.5s, INP <200ms, CLS <0.1

**Organic traffic goals:** 1k sessions Month 1 → 10k Month 3 → 50k Month 6 → 200k Month 12

## Design System

**Style:** Modern brutalism with friendly touches (Voqo.ai-derived)
**Primary color:** `#26C169` (Voqo Green), dark `#126D39`, accent `#ECF87F`
**Key patterns:** Black 2px borders, card lift on hover, green focus states, brutalist shadow offsets
**Components:** Buttons (primary/secondary/ghost), cards (standard/agent/stat/review), star ratings, badges (license/property type/sale method), voice UI (floating button, bottom sheet, popover), pagination, filter bar, autocomplete search
**Accessibility:** WCAG 2.1 AA, keyboard nav, ARIA labels, semantic HTML

## MVP Scope

**In MVP:**

- Data: Claude Agent SDK pipeline for NSW (Bondi Beach + surrounding suburbs)
- Pages: All 7 page types (homepage, agent, suburb, agency, state, all agents, all agencies)
- Voice: Navigator + Assistant modes on all pages
- SEO: Full structured data, sitemaps, internal linking
- Search: FTS5 autocomplete across agents/agencies/suburbs

**Not in MVP:**

- Reviews/ratings from external sources (deferred)
- Domain/REA API integration
- Agent claim flow & notifications
- Analytics & tracking (Plausible/Fathom)
- Blog content for generic keywords
- Multi-state pipeline (VIC, QLD expansion)
- Cron-scheduled pipeline runs

## Implementation Order

1. Tech Stack + Architecture — scaffold, deps, config
2. Data Model — Drizzle schemas, migrations, seed ~16k suburbs
3. Data Pipeline — first pipeline run for Bondi MVP data
4. API — wire up 7 endpoints
5. Design System — Tailwind config, component primitives
6. Pages — build all 7 page types
7. SEO — meta tags, JSON-LD, sitemaps, robots.txt
8. Voice — ElevenLabs Navigator + Assistant

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Score | 95+ (SEO, Performance, Accessibility) |
| Time to First Byte | <200ms (Vercel Edge) |
| Largest Contentful Paint | <1.5s |
| FTS5 Query Time | <50ms |
| Voice Agent Response | <500ms to first audio |
| Search API Latency (p95) | <200ms |
| Autocomplete (p95) | <100ms |

## Moat Construction

**Short-term (0-6 months):**
- First-mover on voice-integrated agent directory
- SEO footprint across 50k+ agent/suburb keywords

**Medium-term (6-18 months):**
- Proprietary data: agent responsiveness, sale accuracy, license verification
- User-generated content (reviews, corrections)

**Long-term (18+ months):**
- Default "about me" page agents link to
- Consumer trust as the unbiased source
- Network effects: more agents → more data → better SEO → more consumers → more agents

## Specification Files

| # | File | Scope |
|---|------|-------|
| 1 | `spec-architecture.md` | System diagrams, directory structure, service boundaries, data flow, deployment topology |
| 2 | `spec-tech-stack.md` | Next.js 15, SQLite + Drizzle, ElevenLabs, Claude Agent SDK, Tailwind CSS 4, Vercel, env setup |
| 3 | `spec-data-model.md` | 7 entities, Drizzle schemas, SQL DDL, FTS5, indexes, slug generation, data quality scoring |
| 4 | `spec-data-pipeline.md` | Claude Agent SDK orchestrator, sub-agent definitions, Zod schemas, execution flow, dedup, CLI |
| 5 | `spec-api.md` | 7 Next.js API routes — search, autocomplete, agents, agent/agency/suburb profiles, voice signed URL |
| 6 | `spec-pages.md` | 7 page types — full section layouts, components, data requirements, responsive breakpoints, error states |
| 7 | `spec-design-system.md` | Voqo.ai-derived tokens — colors, typography, brutalist components, voice UI, animations, accessibility |
| 8 | `spec-voice.md` | ElevenLabs dual-mode — Navigator (6 client tools) + Assistant (contextual per-page), signed URL auth |
| 9 | `spec-seo.md` | Programmatic SEO for 50k+ pages — keywords, JSON-LD, sitemaps, internal linking, Core Web Vitals |

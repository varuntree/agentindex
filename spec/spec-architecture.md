# AgentIndex System Architecture Specification

## Table of Contents
- [System Overview](#system-overview)
- [High-Level System Diagram](#high-level-system-diagram)
- [Directory Structure](#directory-structure)
- [Service Boundaries](#service-boundaries)
- [Data Flow](#data-flow)
- [Rendering Strategy](#rendering-strategy)
- [Deployment Topology](#deployment-topology)
- [Database Schema Overview](#database-schema-overview)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Security Considerations](#security-considerations)
- [Performance Characteristics](#performance-characteristics)
- [Scalability Considerations](#scalability-considerations)
- [Monitoring and Observability](#monitoring-and-observability)
- [Future Enhancements](#future-enhancements)
- [Conclusion](#conclusion)

---

## System Overview

AgentIndex is an Australian real estate agent directory with voice AI integration. The system comprises three major subsystems:

1. **Web Application** — Next.js frontend serving programmatic SEO pages
2. **Data Pipeline** — Claude Agent SDK scripts gathering agent/agency data
3. **Voice Integration** — ElevenLabs conversational AI embedded on pages

---

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                 │
│  (Agency websites, gov records, public listings, social media)      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE (Claude Agent SDK)                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Orchestrator │───▶│  Sub-Agents  │───▶│  Structured  │          │
│  │    Agent     │    │ (WebSearch,  │    │     Data     │          │
│  │              │    │  WebFetch)   │    │ (Zod valid.) │          │
│  └──────────────┘    └──────────────┘    └──────┬───────┘          │
│                                                   │                  │
│                           ┌───────────────────────┘                  │
│                           ▼                                          │
│                    ┌─────────────┐                                   │
│                    │ Drizzle ORM │                                   │
│                    └──────┬──────┘                                   │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   SQLite DB  │◀────────────┐
                    │ agentindex.db│             │
                    └──────┬───────┘             │
                           │                     │
                           ▼                     │
┌─────────────────────────────────────────────────────────────────────┐
│                    WEB APPLICATION (Next.js)                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │    Drizzle   │───▶│ SSG Pages    │───▶│  Vercel CDN  │          │
│  │   Queries    │    │ (getStatic-  │    │              │          │
│  │              │    │  Props/      │    │              │          │
│  │              │    │  Params)     │    │              │          │
│  └──────────────┘    └──────────────┘    └──────┬───────┘          │
│                                                   │                  │
│  ┌──────────────┐                                │                  │
│  │ API Routes   │                                │                  │
│  │ - /api/search│                                │                  │
│  │ - /api/voice │                                │                  │
│  └──────────────┘                                │                  │
└───────────────────────────────────────────────────┼──────────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │     USER     │
                                            └──────┬───────┘
                                                   │
                                                   ▼
                                         ┌──────────────────┐
                                         │   ElevenLabs     │
                                         │   Voice Agent    │
                                         │ (client-side SDK)│
                                         │                  │
                                         │ Client tools →   │
                                         │ navigate app     │
                                         └──────────────────┘
```

---

## Directory Structure

```
agentindex/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Homepage
│   │   ├── agents/
│   │   │   └── [state]/
│   │   │       └── [suburb]/
│   │   │           └── page.tsx    # Suburb agent listing
│   │   ├── agent/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Agent profile
│   │   ├── agency/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Agency profile
│   │   ├── agencies/
│   │   │   └── page.tsx            # All agencies
│   │   └── api/
│   │       ├── search/             # Search API
│   │       └── voice/              # ElevenLabs signed URL
│   ├── components/                 # Shared React components
│   ├── lib/
│   │   ├── db/                     # Database connection, queries, schema
│   │   ├── voice/                  # ElevenLabs integration
│   │   └── utils/                  # Helpers
│   └── styles/                     # Global styles, Tailwind config
├── pipeline/                       # Data pipeline (Claude Agent SDK)
│   ├── agents/                     # Agent definitions for sub-agents
│   ├── schemas/                    # Zod schemas for structured output
│   ├── scripts/                    # Entry point scripts
│   └── output/                     # Downloaded images, raw data
├── data/
│   ├── agentindex.db               # SQLite database file
│   └── suburbs.json                # Australian suburbs seed data (Matthew Proctor)
├── public/
│   └── images/                     # Stored agent/agency images
├── drizzle/                        # Drizzle ORM migrations
└── package.json
```

---

## Service Boundaries

### Web Application (Next.js)

**Responsibilities:**
- Serve static-generated pages for suburbs, agents, agencies
- Provide search API endpoint
- Generate signed URLs for voice authentication
- Display voice UI components

**Characteristics:**
- **Read-only** access to SQLite database
- **No mutations** — all data changes happen via pipeline
- **Public pages** — no authentication middleware
- **SSG** — pre-rendered at build time
- **ISR** — revalidate on demand after pipeline updates

**Technology Stack:**
- Next.js 14+ (App Router)
- React Server Components
- Drizzle ORM (read queries only)
- Tailwind CSS
- ElevenLabs React SDK

---

### Data Pipeline (Standalone Scripts)

**Responsibilities:**
- Scrape and gather agent/agency data from web sources
- Validate and structure data using Zod schemas
- Write to SQLite database
- Download and store agent/agency images
- Orchestrate parallel sub-agents for data collection

**Characteristics:**
- **Runs independently** of web application
- **Manual execution** via CLI
- **Long-running** AI agent operations
- **Direct database writes** (no API layer)
- **File system operations** for image storage

**Technology Stack:**
- TypeScript
- Claude Agent SDK
- Zod (schema validation)
- Drizzle ORM (write operations)
- Node.js file system APIs

**Execution:**
```bash
pnpm pipeline:run --location "Bondi" --agencies "Ray White,McGrath"
```

---

### Voice Integration (Client-Side)

**Responsibilities:**
- Provide conversational interface for directory navigation
- Execute browser-side actions via client tools
- Inject dynamic context into voice sessions

**Characteristics:**
- **Fully client-side** execution (ElevenLabs SDK)
- **Signed URL authentication** (API key stays server-side)
- **Two voice agents** — Navigator (app control) + Assistant (queries)
- **Client tools** — JavaScript functions callable by voice agent

**Technology Stack:**
- ElevenLabs Conversational AI
- ElevenLabs React SDK
- Client-side JavaScript tools

---

## Data Flow

### 1. Pipeline → Database

```
Pipeline Script
    ↓
Claude Orchestrator Agent
    ↓
Parallel Sub-Agents (WebSearch, WebFetch, Browser Automation)
    ↓
Raw Data Extraction
    ↓
Structured JSON Output
    ↓
Zod Schema Validation
    ↓
Drizzle ORM Insert/Update
    ↓
SQLite Database (agentindex.db)
    ↓
File System (public/images/)
```

**Key Steps:**
1. Developer runs pipeline script with location/agency parameters
2. Orchestrator agent plans data collection strategy
3. Sub-agents execute parallel web scraping tasks
4. Extracted data validated against Zod schemas
5. Validated data inserted into SQLite via Drizzle ORM
6. Images downloaded and saved to public directory
7. Pipeline outputs summary report

---

### 2. Database → Pages

```
SQLite Database
    ↓
Drizzle Query (during build)
    ↓
Next.js generateStaticParams / getStaticProps
    ↓
React Server Components
    ↓
Static HTML Generation
    ↓
Vercel CDN
    ↓
User Browser
```

**Key Steps:**
1. Next.js build process queries SQLite for all routes
2. `generateStaticParams` creates dynamic route parameters
3. Page components fetch data via Drizzle queries
4. React renders HTML at build time
5. Static HTML deployed to Vercel CDN
6. User requests served directly from CDN (no database hit)

**Revalidation:**
- On-demand ISR triggered after pipeline updates database
- `revalidatePath()` called for updated routes
- Incremental regeneration of affected pages

---

### 3. User → Voice

```
User clicks voice button
    ↓
Browser requests signed URL from /api/voice
    ↓
API route generates ElevenLabs signed URL (server-side)
    ↓
Client receives signed URL
    ↓
ElevenLabs session initialized
    ↓
Dynamic system prompt + context injected
    ↓
User speaks to voice agent
    ↓
Voice agent calls client tools
    ↓
Client tools execute JavaScript (navigate, search, scroll)
    ↓
Page updates in browser
```

**Key Steps:**
1. Voice button click triggers signed URL request
2. Server-side API route uses ElevenLabs API key securely
3. Client receives time-limited signed URL
4. ElevenLabs SDK establishes voice session
5. System prompt includes current page context
6. Voice agent can trigger navigation via client tools
7. User sees immediate UI updates from tool execution

---

## Rendering Strategy

### Static Generation (SSG)

**Applied to:**
- Homepage (`/`)
- All agency listings (`/agencies`)
- Individual agency profiles (`/agency/[slug]`)
- Individual agent profiles (`/agent/[slug]`)
- Suburb-specific agent listings (`/agents/[state]/[suburb]`)

**Benefits:**
- **Fastest possible load** — pure HTML from CDN
- **Optimal SEO** — fully rendered content for crawlers
- **Zero database load** — no runtime queries
- **Cost effective** — no server compute per request

**Build Process:**
```typescript
// Example: generateStaticParams for suburb pages
export async function generateStaticParams() {
  const suburbs = await db.query.suburbs.findMany();
  return suburbs.map(suburb => ({
    state: suburb.state,
    suburb: suburb.slug
  }));
}
```

---

### Incremental Static Regeneration (ISR)

**Trigger:**
- Pipeline completion
- Manual revalidation request
- Time-based revalidation (optional)

**Implementation:**
```typescript
// After pipeline writes to database
await fetch('https://agentindex.com.au/api/revalidate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.REVALIDATE_TOKEN}` },
  body: JSON.stringify({ paths: ['/agents/nsw/bondi'] })
});
```

**Benefits:**
- Fresh data without full rebuild
- Targeted updates for changed pages only
- Users see updated content quickly

---

### Client-Side Rendering

**Applied to:**
- Voice UI components
- Search autocomplete
- Interactive filters (future)

**Characteristics:**
- Hydration after initial HTML load
- Real-time user interactions
- No impact on SEO (progressive enhancement)

---

### API Routes

**Endpoints:**

1. **`/api/search`** — Agent/agency search
   - Query parameter: `?q=search+term`
   - Returns: JSON array of matching results
   - Method: GET
   - Cached: Yes (stale-while-revalidate)

2. **`/api/voice`** — ElevenLabs signed URL generation
   - Body: `{ agentId?: string, context?: object }`
   - Returns: `{ signedUrl: string }`
   - Method: POST
   - Auth: None (rate limited by IP)

---

## Deployment Topology

```
┌─────────────────────────────────────────────────────┐
│              Vercel Edge Network (CDN)              │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Static    │  │   Static    │  │    API     │ │
│  │   HTML      │  │   Assets    │  │   Routes   │ │
│  │   Pages     │  │ (images,CSS)│  │ (Node.js)  │ │
│  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
                         │
                         │ (reads during build)
                         ▼
              ┌──────────────────────┐
              │   SQLite Database    │
              │   (Vercel Blob or    │
              │    committed to git) │
              └──────────────────────┘
                         ▲
                         │ (writes)
                         │
              ┌──────────────────────┐
              │   Developer Machine  │
              │   or CI Environment  │
              │                      │
              │  Pipeline Scripts    │
              └──────────────────────┘
```

**Deployment Details:**

- **Single Vercel project** — web app and API routes
- **SQLite file** — stored in Vercel persistent storage or committed to repo
- **Static assets** — served from Vercel CDN
- **Pipeline** — runs locally or in CI (GitHub Actions)
- **No separate backend** — no additional servers required

**Environment Variables:**
```bash
# Server-side only
ELEVENLABS_API_KEY=...
REVALIDATE_TOKEN=...

# Public (client-side safe)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=...
```

---

## Database Schema Overview

**Tables:**

1. **agents**
   - Core: `id`, `name`, `email`, `phone`, `slug`
   - Relations: `agencyId` (foreign key)
   - Metadata: `bio`, `image_url`, `specialties`
   - SEO: `meta_title`, `meta_description`

2. **agencies**
   - Core: `id`, `name`, `website`, `slug`
   - Location: `address`, `suburb`, `state`, `postcode`
   - Metadata: `logo_url`, `description`
   - SEO: `meta_title`, `meta_description`

3. **suburbs**
   - Core: `id`, `name`, `state`, `postcode`, `slug`
   - Geography: `latitude`, `longitude`
   - Seed data: Matthew Proctor's Australian suburbs dataset

4. **agent_suburbs** (junction table)
   - Links agents to suburbs they service
   - `agentId`, `suburbId`

**Indexes:**
- `agents.slug` (unique)
- `agencies.slug` (unique)
- `suburbs.slug + state` (composite unique)
- `agents.agencyId` (foreign key index)

---

## Key Architectural Decisions

### 1. SQLite over Postgres

**Rationale:**
- **Simplicity** — single file, no connection pooling, no server management
- **Performance** — reads are extremely fast (all pages are read-only)
- **Deployment** — no separate database service required
- **Cost** — zero database hosting costs
- **Writes** — infrequent (only during pipeline runs)

**Trade-offs:**
- Not suitable for high-write concurrency (not needed here)
- File size limits (acceptable for directory use case)
- No built-in replication (can use Litestream if needed)

---

### 2. SSG over SSR

**Rationale:**
- **Performance** — fastest possible load times (pure HTML)
- **SEO** — fully rendered content for search engines
- **Cost** — zero compute costs for page views
- **Scale** — handles unlimited traffic from CDN
- **Data freshness** — directory data changes infrequently

**Trade-offs:**
- Build time increases with page count (solved with ISR)
- Not suitable for real-time data (not needed here)
- Requires rebuild for updates (solved with on-demand ISR)

---

### 3. Pipeline as Separate Scripts

**Rationale:**
- **Decoupling** — data collection independent from web serving
- **Different execution model** — long-running AI agents vs request/response
- **Developer experience** — can run pipeline locally without deploying
- **Error isolation** — pipeline failures don't affect production site
- **Scalability** — can parallelize pipeline across multiple machines

**Trade-offs:**
- Manual execution required (acceptable for infrequent updates)
- No real-time data updates (not needed here)
- Requires coordination between pipeline and app deploys

---

### 4. File System Images

**Rationale:**
- **Simplicity** — no additional storage service required
- **Performance** — served directly from Vercel CDN
- **Cost** — zero storage costs (within Vercel limits)
- **Developer experience** — easy to inspect and debug locally

**Migration path:**
- Can move to S3/R2/Cloudinary later if needed
- URLs already abstracted via helper functions
- No code changes required in components

---

### 5. No API Layer Between Pipeline and Database

**Rationale:**
- **Simplicity** — fewer moving parts
- **Performance** — direct writes are faster
- **Development speed** — no need to build/maintain API
- **Security** — pipeline runs in trusted environment (developer machine/CI)

**Trade-offs:**
- Pipeline must have direct database access (acceptable)
- No request validation layer (handled by Zod schemas instead)

---

## Security Considerations

### API Key Protection
- **ElevenLabs API key** stored server-side only
- Signed URL generation via API route
- Time-limited signed URLs (expire after session)

### Voice Agent Boundaries
- Client tools limited to navigation and UI actions
- No database write access from voice agent
- No access to sensitive user data (directory is public)

### Pipeline Security
- Runs in trusted environment (not exposed to public)
- Database credentials in environment variables
- Zod validation prevents malformed data insertion

### Rate Limiting
- Voice API endpoint rate limited by IP
- Search API endpoint cached and rate limited

---

## Performance Characteristics

### Page Load Times
- **Static pages** — <100ms (CDN serve time)
- **Images** — lazy loaded, optimized via Next.js Image
- **JavaScript** — code split by route
- **CSS** — Tailwind JIT, purged unused styles

### Database Query Performance
- **Build time queries** — no user-facing impact
- **API route queries** — <10ms (SQLite is fast for reads)
- **Indexes** — all common queries indexed

### Voice Latency
- **Signed URL generation** — <50ms
- **Voice response time** — ElevenLabs latency (~500ms)
- **Client tool execution** — instant (browser-side JavaScript)

---

## Scalability Considerations

### Current Scale
- **Agents** — hundreds to low thousands
- **Agencies** — hundreds
- **Suburbs** — ~15,000 (Australian suburbs)
- **Pages** — ~15,000+ (suburb pages + agency pages + agent pages)

### Growth Capacity
- **SQLite** — can handle 100k+ agents easily
- **SSG** — can handle 100k+ pages (with ISR for incremental updates)
- **CDN** — unlimited traffic capacity
- **Voice** — ElevenLabs handles scaling

### Bottlenecks
- **Build time** — grows linearly with page count (mitigated by ISR)
- **Pipeline execution** — grows with data source count (parallelizable)
- **File storage** — image count grows with agents (can migrate to object storage)

---

## Monitoring and Observability

### Metrics to Track
- **Build time** — detect slowdowns from page count growth
- **Pipeline success rate** — detect scraping failures
- **Voice session count** — measure engagement
- **Search API latency** — ensure fast autocomplete
- **CDN cache hit rate** — ensure static serving efficiency

### Error Tracking
- **Pipeline errors** — log to file + notify on failure
- **Voice errors** — client-side error boundary
- **API errors** — Vercel function logs
- **Build errors** — Vercel deployment logs

---

## Future Enhancements

### Potential Additions
1. **User reviews** — requires authentication, database writes
2. **Agent availability calendar** — requires real-time updates
3. **Contact form** — requires email service integration
4. **Analytics dashboard** — requires aggregation queries
5. **Multi-language support** — requires i18n routing

### Migration Paths
- **SQLite → Postgres** — if write concurrency becomes needed
- **File storage → S3** — if image count grows significantly
- **Manual pipeline → Scheduled** — if data freshness requirements increase
- **SSG → Hybrid** — if real-time features are added

---

## Conclusion

AgentIndex's architecture prioritizes simplicity, performance, and SEO through strategic use of static generation, SQLite, and decoupled data pipelines. The system is designed to scale to tens of thousands of pages while maintaining sub-100ms load times and minimal operational complexity.

The voice integration adds a novel interaction layer without compromising the core architecture's simplicity or performance characteristics.

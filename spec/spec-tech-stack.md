# AgentIndex Technical Stack Specification

## Table of Contents
- [Project Overview](#project-overview)
- [Core Technologies](#core-technologies)
- [External Services](#external-services)
- [What We're NOT Using](#what-were-not-using)
- [Environment Setup](#environment-setup)
- [Deployment Configuration](#deployment-configuration)
- [Data Pipeline Architecture](#data-pipeline-architecture)
- [Version Summary](#version-summary)
- [Performance Targets](#performance-targets)
- [Security Considerations](#security-considerations)
- [Future Considerations (Post-MVP)](#future-considerations-post-mvp)

---

## Project Overview

**AgentIndex** is a programmatic SEO-driven directory of Australian real estate agents, showcasing Voqo AI's voice agent technology. Zero friction, no authentication, mobile-first design.

---

## Core Technologies

### Framework & Language

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x (App Router) | SSR/SSG for SEO, programmatic page generation |
| **TypeScript** | 5.x | Full-stack type safety (app + data pipeline) |
| **React** | 19.x | UI component layer |
| **Node.js** | 20+ | Runtime environment |

**Rationale**: Next.js App Router enables server-side rendering critical for SEO at scale. TypeScript ensures type safety across frontend, backend, and data pipeline scripts.

---

### Database & ORM

| Technology | Version | Purpose |
|------------|---------|---------|
| **SQLite** | 3.x via `better-sqlite3` | Local file-based database, zero external dependencies |
| **SQLite FTS5** | — | Full-text search (agents, agencies, suburbs) |
| **Drizzle ORM** | Latest | Type-safe queries, SQLite support, lightweight |

**Schema Design**:
- `agents` table: name, phone, email, agency_id, suburb_id, bio, specialties
- `agencies` table: name, phone, website, logo_url
- `suburbs` table: name, state, postcode, slug
- FTS5 virtual tables for search indexes

**Rationale**: SQLite sufficient for MVP scale. No external database hosting required. FTS5 provides built-in full-text search without additional services. Turso (hosted SQLite) available for scaling if needed.

---

### Voice Technology

| Technology | Version | Purpose |
|------------|---------|---------|
| **ElevenLabs Conversational AI** | Latest | Voice agent interactions |
| **@elevenlabs/react** | Latest | React SDK for voice UI |

**Implementation**:
- Single agent template with dynamic per-page overrides
- React hook: `useConversation()` for voice state management
- Agent context injected via props (agent name, suburb, specialty)

**Authentication**: API key via `xi-api-key` environment variable

---

### Data Pipeline

| Technology | Version | Purpose |
|------------|---------|---------|
| **Claude Agent SDK** | Latest | Orchestrate data collection sub-agents |
| **@anthropic-ai/claude-agent-sdk** | TypeScript | SDK for agent workflows |
| **Zod** | Latest | Runtime schema validation for structured outputs |

**Architecture**:
- Parallel sub-agents per data source (REB, Domain, RealEstate.com.au)
- Tools: `WebSearch`, `WebFetch`
- Structured JSON outputs validated against Zod schemas
- Manual execution via CLI scripts (no cron scheduling in v1)

**Authentication**: API key via `ANTHROPIC_API_KEY` or Claude Code CLI session

---

### Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Lucide Icons** | Latest | SVG icon library |
| **Google Fonts** | — | Montserrat (headings), Inter (body), Fraunces (accents) |

**Design System**:
- Mobile-first responsive breakpoints
- Consistent spacing scale (4px base)
- Color palette aligned with Voqo.ai branding

---

### Hosting & Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Edge deployment, automatic Next.js optimization |
| **File System** | Image storage (committed assets or `/tmp` for dynamic) |
| **Environment Variables** | API keys (ElevenLabs, Anthropic) |

**CI/CD**:
- Auto-deploy from `main` branch
- Preview deployments for pull requests
- Environment variables configured in Vercel dashboard

---

### Search Architecture

**SQLite FTS5 Full-Text Search**:
- Tokenized search across agent names, suburbs, agencies
- No external search service required
- Query examples:
  ```sql
  SELECT * FROM agents_fts WHERE agents_fts MATCH 'john sydney';
  SELECT * FROM suburbs_fts WHERE suburbs_fts MATCH 'bondi beach';
  ```

**Search Features**:
- Autocomplete suggestions
- Fuzzy matching via FTS5 tokenizers
- Results ranked by relevance score

---

### Development Tools

| Tool | Purpose |
|------|---------|
| **pnpm** | Package manager (faster, disk-efficient) |
| **ESLint** | Linting (Next.js config) |
| **Prettier** | Code formatting |
| **TypeScript Compiler** | Type checking |

---

## External Services

| Service | Purpose | Authentication |
|---------|---------|----------------|
| **ElevenLabs** | Voice agent API | API key (`xi-api-key`) |
| **Anthropic Claude** | Data pipeline agent orchestration | API key (`ANTHROPIC_API_KEY`) or CLI auth |

---

## What We're NOT Using

| Technology | Why Not |
|------------|---------|
| **PostgreSQL** | SQLite simpler for MVP; Turso available for scaling |
| **Algolia/Meilisearch** | FTS5 sufficient for MVP search requirements |
| **Python** | Full TypeScript stack for consistency |
| **Redis** | No caching layer needed at current scale |
| **Auth0/Clerk** | No authentication system in v1 |
| **Google Analytics** | Not in scope for v1 |
| **Strapi/Contentful** | All data from pipeline, no editorial CMS needed |

---

## Environment Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- SQLite3 (preinstalled on macOS/Linux)
- Claude Code CLI (for Agent SDK authentication)

### Required Environment Variables
```bash
# .env.local
ELEVENLABS_API_KEY=xi_xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
DATABASE_URL=file:./data/agentindex.db
NODE_ENV=development
```

### Installation
```bash
pnpm install
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm dev          # Start development server
```

---

## Deployment Configuration

### Vercel Settings
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Node Version**: 20.x

### Environment Variables (Vercel)
- `ELEVENLABS_API_KEY` (secret)
- `ANTHROPIC_API_KEY` (secret)
- `DATABASE_URL` (production SQLite path)

---

## Data Pipeline Architecture

### Script Structure
```
scripts/
├── agents/
│   ├── scrape-reb.ts          # REB scraper sub-agent
│   ├── scrape-domain.ts       # Domain scraper sub-agent
│   └── scrape-realestate.ts   # RealEstate.com.au scraper
├── seed/
│   └── suburbs.ts             # Seed suburb data
└── pipeline.ts                # Orchestration script
```

### Execution Flow
1. `pnpm pipeline:suburbs` — Seed suburb database
2. `pnpm pipeline:agents` — Run parallel scraper agents
3. `pnpm pipeline:validate` — Validate data integrity
4. `pnpm build` — Generate static pages

### Structured Output Schema (Zod)
```typescript
const AgentSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  agency: z.string(),
  suburb: z.string(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});
```

---

## Version Summary

| Dependency | Version |
|------------|---------|
| next | ^15.0.0 |
| react | ^19.0.0 |
| typescript | ^5.0.0 |
| tailwindcss | ^4.0.0 |
| drizzle-orm | latest |
| better-sqlite3 | ^11.0.0 |
| @elevenlabs/react | latest |
| @anthropic-ai/claude-agent-sdk | latest |
| zod | ^3.0.0 |
| lucide-react | latest |

---

## Performance Targets

- **Lighthouse Score**: 95+ (SEO, Performance, Accessibility)
- **Time to First Byte**: <200ms (Vercel Edge)
- **Largest Contentful Paint**: <1.5s
- **FTS5 Query Time**: <50ms for typical searches
- **Voice Agent Response**: <500ms to first audio chunk

---

## Security Considerations

- API keys stored in environment variables (never committed)
- SQLite database read-only in production (writes only via pipeline)
- No user input stored (search queries not persisted)
- HTTPS enforced via Vercel
- Content Security Policy headers configured

---

## Future Considerations (Post-MVP)

- **Database**: Migrate to Turso (edge-hosted SQLite) for multi-region performance
- **Search**: Upgrade to Meilisearch if FTS5 performance degrades at scale
- **Analytics**: Add privacy-focused analytics (Plausible/Fathom)
- **Caching**: Redis layer for popular searches
- **CDN**: Cloudflare Images for optimized agent photos

---

**Last Updated**: 2026-01-28
**Document Owner**: Varun Prasad

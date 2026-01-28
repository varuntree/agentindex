## Build & Run

- Install: `pnpm install`
- Dev server: `pnpm dev` (localhost:3000)
- Build: `pnpm build`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- DB generate: `pnpm db:generate`
- DB migrate: `pnpm db:migrate`
- DB seed suburbs: `pnpm pipeline:suburbs`

## Validation

Run after implementing:

```bash
pnpm typecheck && pnpm lint && pnpm build
```

For UI tasks: start dev server (`pnpm dev`), use Playwright MCP tools to verify rendered output.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript 5
- SQLite 3 via `better-sqlite3` + Drizzle ORM + FTS5
- Tailwind CSS 4, Lucide Icons
- ElevenLabs Conversational AI (`@elevenlabs/react`)
- Claude Agent SDK (via Claude Code Max subscription — no API key needed)
- Fonts: Montserrat (headings), Inter (body)
- Package manager: pnpm

## Auth

- Claude Agent SDK: uses Claude Code Max subscription, no API key needed
- ElevenLabs: signed URL auth flow (server-side)
- No user auth in v1

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage
│   ├── agents/[state]/[suburb-slug]/page.tsx
│   ├── agent/[slug]/page.tsx
│   ├── agency/[slug]/page.tsx
│   ├── agencies/page.tsx
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # Base UI components
│   ├── agent/              # Agent-specific components
│   ├── navigation/         # Nav, footer
│   └── search/             # Search components
├── lib/
│   ├── db/                 # Database (schema, queries, index)
│   ├── seo/                # Metadata, JSON-LD
│   ├── api/                # Response/cache utils
│   └── utils/              # Helpers (format, slug, etc)
pipeline/                   # Data pipeline (future)
data/
├── agentindex.db           # SQLite database
└── suburbs/                # Suburb seed data
spec/                       # Application specifications
ai_docs/                    # AI integration docs
```

## Codebase Patterns

- SSG for all public pages
- SQLite read-only from web app; writes via pipeline
- Drizzle ORM for all DB access
- Design: brutalist, green (#26C169), black 2px borders
- Mobile-first responsive
- API routes: public, no auth, read-only

## Gotchas

- `better-sqlite3` needs `serverExternalPackages` in next.config.ts
- pnpm 10: `pnpm.onlyBuiltDependencies` in package.json for native modules
- Tailwind 4: CSS `@theme` in globals.css, no tailwind.config.js
- ESLint 9: `eslint .` not `next lint`
- FTS5 migrations: manual SQL via db.exec()
- Next.js 15: params/searchParams are Promises — must await
- `agent-ralph-ui/` is an internal Vite tool — **completely separate** from Next.js app
  - NEVER import from agent-ralph-ui in Next.js code
  - Must be excluded from: pnpm workspace, tsconfig.json, eslint, Next.js output tracing
  - Run with its own commands from its directory, not via Next.js scripts
  - If build breaks mentioning agent-ralph-ui: check workspace config, tsconfig exclude, eslint ignore, and next.config tracing excludes

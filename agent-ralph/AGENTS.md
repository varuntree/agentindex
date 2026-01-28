## Build & Run

- Install: `pnpm install`
- Dev server: `pnpm dev` (localhost:3000)
- Build: `pnpm build`
- DB generate: `pnpm db:generate`
- DB migrate: `pnpm db:migrate`
- DB seed suburbs: `pnpm pipeline:suburbs`

## Validation

Run after implementing to get immediate feedback:

- Typecheck: `pnpm tsc --noEmit`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Playwright verify (UI tasks only): start dev server, use Playwright MCP tools (`mcp__playwright__browser_navigate`, `mcp__playwright__browser_snapshot`, `mcp__playwright__browser_take_screenshot`, `mcp__playwright__browser_resize`) to check rendered page at relevant route

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript 5
- SQLite 3 via `better-sqlite3` + Drizzle ORM + FTS5
- Tailwind CSS 4, Lucide Icons
- ElevenLabs Conversational AI (`@elevenlabs/react`)
- Claude Agent SDK (via Claude Code Max subscription — no API key needed)
- Fonts: Montserrat (headings), Inter (body), Fraunces (accents) — Google Fonts
- Package manager: pnpm
- Hosting: Vercel

## Auth & Credentials

- Claude Agent SDK: uses Claude Code Max subscription, no ANTHROPIC_API_KEY needed
- ElevenLabs: uses signed URL auth flow (server-side, no browser credentials needed)
- No user auth in v1 — all pages public, no login

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage
│   ├── agents/[state]/[suburb]/page.tsx
│   ├── agent/[slug]/page.tsx
│   ├── agency/[slug]/page.tsx
│   ├── agencies/page.tsx
│   └── api/                # API routes (search, voice)
├── components/             # Shared React components
├── lib/
│   ├── db/                 # Database connection, queries, schema
│   ├── voice/              # ElevenLabs integration
│   └── utils/              # Helpers
└── styles/                 # Global styles
pipeline/                   # Data pipeline (Claude Agent SDK)
├── agents/                 # Sub-agent definitions
├── schemas/                # Zod validation schemas
├── scripts/                # Entry point scripts
└── output/                 # Raw data, images
data/
├── agentindex.db           # SQLite database
└── suburbs.json            # Suburb seed data
drizzle/                    # ORM migrations
public/images/              # Agent/agency images
```

## Codebase Patterns

- SSG for all public pages (non-negotiable for SEO)
- SQLite is read-only from web app; writes only via pipeline
- Drizzle ORM for all DB access — no raw SQL in app code
- `src/lib/` is the shared utility library — prefer consolidated implementations there
- Design system: modern brutalism, Voqo green (#26C169), black 2px borders, card lift hover
- All pages mobile-first responsive
- API routes: public, no auth, read-only from SQLite

## Gotchas

- `better-sqlite3` needs `serverExternalPackages: ["better-sqlite3"]` in `next.config.ts`
- pnpm 10: add `pnpm.onlyBuiltDependencies` to `package.json` for native modules (`better-sqlite3`, `esbuild`, `sharp`)
- Tailwind 4: CSS-based config via `@theme` in `globals.css`, no `tailwind.config.js`. PostCSS via `@tailwindcss/postcss`
- ESLint: `eslint .` not `next lint` (deprecated Next.js 15.5+). Needs `@eslint/eslintrc` for FlatCompat. Ignore `agent-ralph-ui/`, `agent-ralph/`, `ralph/` dirs
- FTS5 migrations are manual SQL (not in Drizzle journal) — apply via `db.exec(sql)`
- Drizzle 0.38 + better-sqlite3: relational queries need `.sync()` to unwrap synchronous results
- Suburb CSV seed: ~17,500 rows from matthewproctor.com. Script auto-downloads if missing.

## Operational Notes

- Specs live in `spec/*` (9 files covering architecture, tech stack, data model, pipeline, API, pages, design system, voice, SEO)
- AI reference docs in `ai_docs/*` (ElevenLabs voice agents, Claude Agent SDK)
- PRD at `prd.md`, company context at `voqo.md`

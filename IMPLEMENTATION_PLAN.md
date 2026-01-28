# AgentIndex Implementation Plan

Last updated: 2026-01-28 — tag 0.0.4

---

## Completed

- [x] **Phase 1** (1.1-1.15) — Next.js 15, Tailwind 4, Drizzle, fonts, layout, formatting utils
- [x] **Phase 2** (2.1-2.18) — 7-table schema, migrations, FTS5, DB connection, utils, 17,503 suburbs seeded
- [x] **Phase 3.5** (3.5.1-3.5.6) — Query helpers: agent/agency/suburb/search/stats
- [x] **Phase 4** (4.1-4.9) — 8 API routes + response/cache utils
- [x] **Phase 5** (5.1-5.22) — All UI components: Button, Card, Badge, Input, StarRating, Pagination, Skeleton, StatCard, AgentCard, AgentPhoto, SuburbBadge, PriceDisplay, PropertyTypeIcon, Table, Breadcrumb, SearchBar, GlobalNav, GlobalFooter, FilterBar
- [x] **Phase 6** (6.1-6.10) — All pages + loading.tsx skeletons
- [x] **Phase 7** (7.1-7.8) — Metadata, JSON-LD (agent/agency/suburb/home/breadcrumb), sitemap, robots, breadcrumb structured data on all pages

Build status: typecheck + lint + build all pass (21 routes)

## Key Learnings

- better-sqlite3 needs `serverExternalPackages` in next.config.ts
- pnpm 10: `pnpm.onlyBuiltDependencies` in package.json for native modules
- Tailwind 4: CSS @theme, no tailwind.config.js
- ESLint 9: `eslint .` not `next lint` (deprecated). Needs `@eslint/eslintrc`. Exclude agent-ralph-ui/, agent-ralph/, ralph/
- FTS5 migration: manual SQL via db.exec() (not in Drizzle journal)
- Next.js 15: params/searchParams are Promises — must await

---

## Remaining Work

### Phase 7 remaining: SEO
- [x] **7.9** — Canonical tags: self-referencing every page; paginated/sorted → canonical = page 1 default sort ✓
- [x] **7.10** — OG image generation via @vercel/og (edge route /api/og, 4 variants: home/agent/suburb/agency) ✓
- [ ] **7.11** — Internal linking audit: verify link density

### Phase 8: Voice Integration
- [ ] **8.0** — Install @elevenlabs/react
- [ ] **8.1** — ElevenLabs agent template (dashboard config)
- [ ] **8.2** — Signed URL API with Navigator/Assistant prompt building
- [ ] **8.3-8.4** — Client tools (navigator: 6 tools, assistant: scrollToSection)
- [ ] **8.5** — Wire VoiceProvider to useConversation()
- [ ] **8.6-8.7** — System prompts (navigator + 3 assistant variants)
- [ ] **8.8** — Context data fetchers
- [ ] **8.9-8.10** — Voice UI states + mobile bottom sheet
- Voice UI components (VoiceButton, VoicePanel, VoiceProvider) created but not wired to ElevenLabs

### Phase 3: Data Pipeline
- [ ] **3.1** — Zod schemas (AgencyOutput, AgentOutput, SaleOutput, ReviewOutput)
- [ ] **3.2** — Pipeline orchestrator CLI
- [ ] **3.3-3.7** — Sub-agents (agency researcher, agent researcher, license verifier, sales historian, review aggregator)
- [ ] **3.8-3.11** — Storage, rate limiter, dedup, image downloader
- [ ] **3.12-3.13** — Run pipeline for Bondi Beach + expand

---

## Unresolved Questions

1. **ElevenLabs agent** — created in dashboard yet? Required for Phase 8.
2. **ElevenLabs LLM** — gpt-4o-mini or claude-3-5-sonnet?
3. **@elevenlabs/react** — must install before Phase 8.

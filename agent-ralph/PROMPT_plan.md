0a. Study `spec/*` with up to 250 parallel Sonnet subagents to learn the application specifications.
0b. Study `ai_docs/*` with up to 50 parallel Sonnet subagents to learn ElevenLabs voice agent and Claude Agent SDK integration patterns.
0c. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0d. Study `src/lib/*` with up to 250 parallel Sonnet subagents to understand shared utilities & components.
0e. For reference, the application source code is in `src/*` and data pipeline code is in `pipeline/*`.

1. Study @IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and use up to 500 Sonnet subagents to study existing source code in `src/*` and `pipeline/*` and compare it against `spec/*`. Use an Opus subagent to analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented. Ultrathink. Consider searching for TODO, minimal implementations, placeholders, skipped/flaky tests, and inconsistent patterns. Study @IMPLEMENTATION_PLAN.md to determine starting point for research and keep it up to date with items considered complete/incomplete using subagents.

2. For each task that produces visible UI output (pages, components, layout, styling), include a verification requirement: "Chrome verify: start dev server, navigate to [route], visually confirm [what to check]". This is backpressure — the build prompt will use Chrome MCP tools to verify rendered output.

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing; confirm with code search first. Treat `src/lib` as the project's standard library for shared utilities and components. Prefer consolidated, idiomatic implementations there over ad-hoc copies.

PRIORITY GUIDE: Follow the PRD implementation order as a priority framework:
1. Tech Stack + Architecture — scaffold project, deps, config (package.json, tsconfig, tailwind, drizzle, next.config)
2. Data Model — Drizzle schemas, migrations, seed ~16k suburbs from Matthew Proctor CSV
3. Data Pipeline — Claude Agent SDK orchestrator, sub-agents, first pipeline run for Bondi MVP
4. API — 7 Next.js API routes (search, autocomplete, agents, agent profile, agency profile, suburb, voice signed URL)
5. Design System — Tailwind config, component primitives (buttons, cards, badges, nav, voice UI)
6. Pages — 7 page types (homepage, agent profile, suburb listing, agency profile, state listing, all agents, all agencies)
7. SEO — meta tags, JSON-LD structured data, sitemaps, robots.txt, internal linking
8. Voice — ElevenLabs Navigator + Assistant dual-mode integration

Tasks within each phase can be parallelized, but phases should generally be completed in order (later phases depend on earlier ones).

ULTIMATE GOAL: Build the AgentIndex MVP — an Australian real estate agent directory with programmatic SEO (50k+ pages), voice AI integration (ElevenLabs), and zero-friction consumer experience. NSW focus (Bondi Beach + surrounding suburbs). All 7 page types, 7 API endpoints, FTS5 search, Navigator + Assistant voice modes. See `prd.md` for full requirements and `spec/*` for detailed specifications.

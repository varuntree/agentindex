# AgentIndex Specifications

> **For implementing agents:** Read the relevant spec fully before starting. Specs referencing `ai_docs/` have a pre-read callout at the top — read that documentation first.

## Spec Index

| # | Spec | File | Description |
|---|------|------|-------------|
| 1 | [Architecture](./spec-architecture.md) | `spec-architecture.md` | System diagrams, directory structure, service boundaries, data flow, rendering strategy, deployment topology |
| 2 | [Tech Stack](./spec-tech-stack.md) | `spec-tech-stack.md` | Next.js 15, SQLite + Drizzle, ElevenLabs, Claude Agent SDK, Tailwind CSS 4, Vercel config, env setup |
| 3 | [Data Model](./spec-data-model.md) | `spec-data-model.md` | Drizzle ORM schemas, SQL DDL, 7 entities (agents, agencies, suburbs, sales, reviews, pipeline_runs, agent_suburbs), FTS5, indexes, slug generation |
| 4 | [Data Pipeline](./spec-data-pipeline.md) | `spec-data-pipeline.md` | Claude Agent SDK orchestrator, sub-agent definitions, Zod schemas, execution flow, dedup, CLI commands. **Pre-read:** [`ai_docs/claude-agent-sdk.md`](../ai_docs/claude-agent-sdk.md) |
| 5 | [API](./spec-api.md) | `spec-api.md` | 7 Next.js API routes — search, autocomplete, agents, agent profile, agency profile, suburb, voice signed URL |
| 6 | [Pages](./spec-pages.md) | `spec-pages.md` | 7 page types with full section layouts, components, data requirements, responsive breakpoints, error states |
| 7 | [Design System](./spec-design-system.md) | `spec-design-system.md` | Voqo.ai-derived tokens — colors, typography, component library (buttons, cards, nav, voice UI), animations, accessibility |
| 8 | [Voice](./spec-voice.md) | `spec-voice.md` | ElevenLabs dual-mode voice — Navigator (client tools, page navigation) + Assistant (contextual per-page). **Pre-read:** [`ai_docs/elevenlabs-voice-agents.md`](../ai_docs/elevenlabs-voice-agents.md) |
| 9 | [SEO](./spec-seo.md) | `spec-seo.md` | Programmatic SEO for 50k+ pages — keywords, meta tags, JSON-LD schemas, sitemaps, internal linking, Core Web Vitals |

## AI Documentation

Offline reference docs for external services. Implementing agents should read these before touching voice or pipeline code.

| Doc | File | Description |
|-----|------|-------------|
| [ElevenLabs Voice Agents](../ai_docs/elevenlabs-voice-agents.md) | `ai_docs/elevenlabs-voice-agents.md` | React SDK, useConversation() hook, client tools, dynamic variables, overrides, signed URLs, pricing |
| [Claude Agent SDK](../ai_docs/claude-agent-sdk.md) | `ai_docs/claude-agent-sdk.md` | query() API, sub-agents, structured outputs (Zod), web tools, MCP tools, hooks, error handling |

## Implementation Order

Recommended sequence for building:

1. **Tech Stack + Architecture** — Project scaffold, deps, config
2. **Data Model** — Drizzle schemas, migrations, seed suburbs
3. **Data Pipeline** — Run first pipeline for Bondi MVP data
4. **API** — Wire up endpoints against seeded data
5. **Design System** — Tailwind config, component primitives
6. **Pages** — Build all 7 page types
7. **SEO** — Meta tags, JSON-LD, sitemaps, robots.txt
8. **Voice** — ElevenLabs integration (Navigator + Assistant)

## Related Files

- [`../prd.md`](../prd.md) — Product requirements document
- [`../voqo.md`](../voqo.md) — Voqo AI company context

# AgentIndex Ralph Loop

Adapted [Ralph Wiggum](https://ghuntley.com/ralph/) autonomous build system for the AgentIndex project.

## What This Is

A bash loop that feeds a prompt to Claude Code CLI repeatedly. Each iteration = fresh context = one task. Shared state persists on disk via `IMPLEMENTATION_PLAN.md`.

```
PROMPT loaded → agent reads plan → picks task → implements → validates → commits → loop restarts
```

## Files

| File | Purpose |
|------|---------|
| `loop.sh` | Bash loop script (plan/build modes, iteration limits) |
| `PROMPT_plan.md` | Planning mode — gap analysis, generates prioritized task list |
| `PROMPT_build.md` | Building mode — implements tasks, validates, commits |
| `AGENTS.md` | Operational guide — build commands, tech stack, codebase patterns |
| `IMPLEMENTATION_PLAN.md` | Prioritized task list (generated/updated by Ralph) |

## Usage

```bash
cd agent-ralph
./loop.sh plan      # Generate/update implementation plan
./loop.sh plan 3    # Plan mode, max 3 iterations
./loop.sh           # Build mode, unlimited iterations
./loop.sh 20        # Build mode, max 20 iterations
```

## AgentIndex Adaptations

- **Specs** in `spec/*` (9 files), AI docs in `ai_docs/*`
- **Playwright MCP verification** as backpressure for UI tasks (mobile 375px + desktop 1280px)
- **No API keys** — Claude Code Max subscription for Agent SDK, ElevenLabs uses signed URL auth
- **PRD implementation order** encoded as priority guide: scaffold → data model → pipeline → API → design system → pages → SEO → voice
- **Source locations**: `src/*` (web app) + `pipeline/*` (data pipeline)

## How It Works

1. `loop.sh` feeds `PROMPT_plan.md` or `PROMPT_build.md` to `claude -p` (headless mode)
2. Agent reads `spec/*` + `AGENTS.md` + `IMPLEMENTATION_PLAN.md` each iteration
3. Picks most important task, implements with parallel subagents
4. Validates via typecheck/lint/build + Playwright verification for UI tasks
5. Updates `IMPLEMENTATION_PLAN.md`, commits, pushes
6. Loop restarts with fresh context — agent reads updated plan from disk

## Key Principles

- **One task per loop** — 100% smart zone context utilization
- **Don't assume not implemented** — always search codebase first
- **Backpressure** — build/lint/typecheck + Playwright visual verification
- **Plan is disposable** — regenerate with `./loop.sh plan` if trajectory diverges
- **AGENTS.md stays lean** — operational info only, no progress notes
- **Implement completely** — no stubs or placeholders

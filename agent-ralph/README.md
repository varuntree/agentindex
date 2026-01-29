# Agent Ralph

Autonomous AI build system for AgentIndex. Adapted from [Ralph Wiggum](https://ghuntley.com/ralph/).

## Overview

Agent Ralph orchestrates Claude to iteratively plan and build software. Each iteration runs with fresh context, picking up shared state from disk.

**Two modes:**
- **CLI Mode** - Bash wrapper for quick iteration (`loop.sh`)
- **Web Dashboard Mode** - Real-time streaming UI with controls (`pnpm start`)

**Core loop:**
```
PROMPT loaded -> agent reads plan -> picks task -> implements -> validates -> commits -> loop restarts
```

## Quick Start

### CLI Mode

```bash
cd agent-ralph
./loop.sh                    # Build mode, unlimited
./loop.sh plan               # Plan mode
./loop.sh 10                 # Build mode, max 10 iterations
./loop.sh plan 5             # Plan mode, max 5 iterations
```

### Web Dashboard Mode

```bash
cd agent-ralph
pnpm install                 # Install dependencies
pnpm start                   # Start loop + dashboard
# Open http://localhost:3001
```

## Configuration

### ralph.config.json

```json
{
  "plan": 2,
  "build": 5,
  "cycles": 0,
  "stopOnZeroTasks": true,
  "port": 3001
}
```

| Field | Type | Description |
|-------|------|-------------|
| `plan` | number | Planning iterations per cycle |
| `build` | number | Build iterations per cycle |
| `cycles` | number | Total cycles (0 = unlimited) |
| `stopOnZeroTasks` | boolean | Stop when no pending tasks remain |
| `port` | number | Dashboard server port |

## Architecture

### Files

| File | Purpose |
|------|---------|
| `loop.sh` | Bash wrapper (legacy CLI mode) |
| `loop.ts` | Main orchestrator (Node.js, Web mode) |
| `server.ts` | Express + WebSocket server |
| `dashboard/` | Vanilla JS web UI |
| `PROMPT_plan.md` | Planning agent instructions |
| `PROMPT_build.md` | Build agent instructions |
| `IMPLEMENTATION_PLAN.md` | Task tracking (generated/updated by Ralph) |
| `AGENTS.md` | Build commands, tech stack, gotchas |
| `ralph.config.json` | Cycle configuration |
| `ralph.state.json` | Runtime state (auto-generated) |
| `ralph.pid` | Process ID file (auto-generated) |

### Cycle Flow

```
Plan (n iterations) -> Build (m iterations) -> Repeat (x cycles)
                            |
               Stop when 0 pending tasks
```

Each iteration:
1. Fresh Claude context
2. Reads `IMPLEMENTATION_PLAN.md` for current state
3. Selects and implements one task
4. Validates (typecheck, lint, build, Playwright)
5. Updates plan, commits, pushes
6. Loop restarts

### Web Dashboard

- Real-time streaming of main agent + sub-agents
- Cycle progress display (plan/build phase, iteration count)
- Stop button for immediate termination
- Auto-reconnects on browser reload

## Prompts

### PROMPT_plan.md

Planning agent responsibilities:
- Analyzes specs vs codebase
- Uses parallel sub-agents for reading/searching (min 20)
- Creates structured task list in `IMPLEMENTATION_PLAN.md`
- Preserves completed tasks and feedback
- Never implements or edits code

### PROMPT_build.md

Build agent responsibilities:
- Implements one task per iteration
- Uses parallel sub-agents for reading, one sub-agent for building
- Validates via typecheck/lint/build
- Playwright verification for UI tasks (375px mobile, 1280px desktop)
- Updates task status and feedback
- Commits and pushes on completion

## API

### WebSocket (ws://localhost:3001/ws)

Real-time event streaming to dashboard:
- Agent output (main + sub-agents)
- Cycle/phase transitions
- Error events
- Completion notifications

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/start` | Start loop with config |
| POST | `/api/stop` | Stop loop immediately |
| GET | `/api/status` | Get current state |

## Process Management

### PID File

`ralph.pid` prevents duplicate instances. Contains process ID of running loop.

### Graceful Shutdown

- SIGTERM/SIGINT handled
- Current iteration completes (or can be force-killed)
- State saved before exit

### State Persistence

`ralph.state.json` tracks:
- Current cycle number
- Current phase (plan/build)
- Current iteration within phase
- Pending task count
- Start time
- Last event ID

## Key Principles

1. **One task per loop** - Maximizes context utilization
2. **Don't assume missing** - Always search codebase first
3. **Backpressure** - Validation prevents broken commits
4. **Plan is disposable** - Regenerate with `./loop.sh plan` if needed
5. **AGENTS.md stays lean** - Operational info only
6. **Implement completely** - No stubs or placeholders

## Troubleshooting

### Loop won't start

```bash
# Check for stale PID file
rm ralph.pid
```

### Stuck on same task

```bash
# Regenerate plan
./loop.sh plan
```

### Dashboard not connecting

```bash
# Check if server running
curl http://localhost:3001/api/status

# Restart with fresh state
rm ralph.state.json ralph.pid
pnpm start
```

### Validation keeps failing

Check task's Feedback field in `IMPLEMENTATION_PLAN.md` for documented issues. Build agent marks tasks `blocked` after 3 failed attempts.

### Context pollution

Orchestrator agents should never read files directly. All reading/searching delegated to sub-agents. If context is polluted:
1. Stop current loop
2. Restart - each iteration gets fresh context

## AgentIndex Specifics

- **Specs** in `spec/*` (9 files)
- **AI docs** in `ai_docs/*` (ElevenLabs, Claude SDK)
- **Source code** in `src/*` (web app) and `pipeline/*` (data pipeline)
- **No API keys needed** - Claude Code Max subscription for Agent SDK
- **Phase order**: scaffold -> data model -> pipeline -> API -> design system -> pages -> SEO -> voice

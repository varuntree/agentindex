# AgentIndex Data Pipeline

A simplified multi-agent AI pipeline for researching and collecting Australian real estate agent/agency data using the Claude Agent SDK.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Admin UI](#admin-ui)
- [Skills](#skills)
- [CLI Usage](#cli-usage)
- [Data Flow](#data-flow)
- [Configuration](#configuration)

---

## Overview

The pipeline uses **Claude Agent SDK** to orchestrate AI agents that research real estate agencies and agents from public web sources.

**Data Collected:**
- **Agency data** — name, logo, address, contact details
- **Agent profiles** — name, photo, bio, contact, suburbs served
- **Sales history** — recent property sales per agent
- **Reviews** — from RateMyAgent, agency websites, general web search

**Key Features:**
- Simplified skills-based architecture
- Parallel sub-agent execution (2 agents per sub-agent)
- Admin UI with live streaming (/admin)
- SSE for real-time progress updates
- No license verification (removed)

---

## Architecture

```
Admin UI (/admin)
    │
    ├── SSE Stream (/api/pipeline/stream) ────────────────┐
    │                                                     │
    ▼                                                     ▼
POST /api/pipeline/start                           Live Event Stream
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       MAIN ORCHESTRATOR                              │
│                                                                     │
│  1. Check DB for existing agents (avoid duplicates)                 │
│  2. Phase 1: Agency Discovery (if agency not in DB)                 │
│  3. Phase 2: Team Discovery → get list of agents from website       │
│  4. Phase 3: Parallel sub-agents (2 agents each)                    │
│                                                                     │
│  All events broadcast via SSE to Admin UI                           │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├── Sub-Agent 1 (agents 1-2)  ──┐
         ├── Sub-Agent 2 (agents 3-4)  ──┼── Promise.all()
         ├── Sub-Agent N...            ──┘
         │
         ▼
    SQLite DB (Drizzle ORM)
```

### Hierarchy

1. **Suburb** (dropdown from seeded DB)
2. **Agency** (free text input)
3. **Limit** (max 200 agents)

### Sub-Agent Batching

Each sub-agent handles **2 agents** to optimize parallelism while keeping context manageable.

For 10 agents → 5 sub-agents running in parallel.

---

## Admin UI

Access at `/admin` (protected by Basic auth).

### Authentication

Set in `.env`:
```
ADMIN_USER=admin
ADMIN_PASS=your-secure-password
```

### Features

- **Suburb dropdown** — Select from seeded suburbs
- **Agency input** — Free text agency name
- **Limit input** — Max agents (up to 200)
- **Live streaming** — Real-time events from main orchestrator + all sub-agents
- **Status indicators** — Idle, Running, Complete, Error

### Event Types

| Event | Description |
|-------|-------------|
| `init` | SSE connection established |
| `info` | General information message |
| `phase` | Pipeline phase change (1, 2, 3) |
| `sub_agent_start` | Sub-agent spawned |
| `sub_agent` | Sub-agent message |
| `sub_agent_error` | Sub-agent failed |
| `agent_stored` | Agent saved to DB |
| `error` | Pipeline error |
| `complete` | Pipeline finished |

---

## Skills

Three simplified skill prompts in `pipeline/agents/skills.ts`:

### 1. Agency Discovery

Finds official agency website and extracts:
- Name, brand name, logo
- Website, phone, email
- Address, suburb, state, postcode

**Data sources:** Official .com.au websites (not Domain or realestate.com.au)

### 2. Team Discovery

Navigates agency website to find all agents:
- First name, last name
- Photo URL
- Phone, email
- Profile page URL

**Pages checked:** /team, /our-team, /agents, /our-people

### 3. Agent Enrichment (2 agents per call)

Deep research on 2 agents simultaneously:
- Bio, years experience, languages, specializations
- Suburbs served
- Sales history (address, price, date, property type)
- Reviews (rating, text, reviewer, date, source)

**Data sources (priority):**
1. Agency website
2. RateMyAgent.com.au
3. Domain.com.au
4. General web search

---

## CLI Usage

### Basic Commands

```bash
# Via Admin UI (recommended)
# Navigate to /admin and use the form

# Direct API call
curl -X POST http://localhost:3000/api/pipeline/start \
  -H "Content-Type: application/json" \
  -d '{"suburbId": 123, "agencyName": "Ray White Bondi Beach", "limit": 50}'
```

### Utility Scripts

```bash
# Validate configuration
pnpm pipeline:validate --config pipeline-config.json

# Generate run report
pnpm pipeline:report --run-id abc123

# Deduplicate entries
pnpm pipeline:dedupe --dry-run
pnpm pipeline:dedupe --execute
```

---

## Data Flow

### Phase 1: Check Existing

```
Request: { suburbId, agencyName, limit }
    ↓
getSuburbById(suburbId) → Suburb info
    ↓
getAgentsByAgencyName(agencyName) → Existing agents
    ↓
If existing.length >= limit → Complete (no work needed)
```

### Phase 2: Agency Discovery

```
Agency not in DB?
    ↓
buildAgencyDiscoveryPrompt(agencyName, suburb, state)
    ↓
query() with WebSearch + WebFetch
    ↓
Parse JSON → Store agency in DB
```

### Phase 3: Team Discovery

```
buildTeamDiscoveryPrompt(websiteUrl)
    ↓
query() with WebFetch
    ↓
Parse JSON array → List of agent stubs
    ↓
Filter out existing agents
```

### Phase 4: Parallel Enrichment

```
chunkArray(newAgents, 2) → Pairs
    ↓
Promise.all(pairs.map(runSubAgent))
    ↓
Each sub-agent:
    buildAgentEnrichmentPrompt(agent1, agent2, agency, location)
    ↓
    query() with WebSearch + WebFetch
    ↓
    Parse JSON → Store agents, sales, reviews
```

### Error Handling

- **Sub-agent failure:** Mark as failed, NO retry
- **Agency not found:** Stop pipeline, broadcast error
- **Partial data:** Store what was found, continue

---

## Configuration

### Environment Variables

```bash
# Admin authentication
ADMIN_USER=admin
ADMIN_PASS=changeme

# Database (default: file:./data/agentindex.db)
DATABASE_URL=file:./data/agentindex.db

# ElevenLabs (for voice features, not pipeline)
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
```

### SDK Budgets

Set in orchestrator:

```typescript
options: {
  allowedTools: ['WebSearch', 'WebFetch'],
  maxTurns: 15,       // Max agent iterations
  maxBudgetUsd: 1.0,  // Cost cap per sub-agent
}
```

### Quality Scoring

Agent quality score (0-100):

| Field | Points |
|-------|--------|
| Photo URL | 10 |
| Bio (>100 chars) | 15 |
| Phone or email | 15 |
| Years experience | 10 |
| Specializations | 10 |
| Has sales | 10 |
| Has reviews | 10 |
| Suburbs served | 20 |

---

## API Endpoints

### POST /api/pipeline/start

Start a new pipeline run.

**Request:**
```json
{
  "suburbId": 123,
  "agencyName": "Ray White Bondi Beach",
  "limit": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pipeline started",
  "suburb": "Bondi Beach",
  "state": "NSW"
}
```

### GET /api/pipeline/stream

SSE stream for real-time events.

**Event format:**
```
data: {"id":1,"timestamp":1234567890,"type":"info","message":"Starting pipeline..."}

data: {"id":2,"timestamp":1234567891,"type":"phase","phase":1,"message":"Discovering agency..."}
```

### GET /api/suburbs

Get all suburbs for dropdown.

**Response:**
```json
{
  "suburbs": [
    { "id": 1, "name": "Bondi Beach", "state": "NSW" },
    { "id": 2, "name": "Surry Hills", "state": "NSW" }
  ]
}
```

---

## Related Documentation

- [spec/spec-data-pipeline.md](../spec/spec-data-pipeline.md) — Full specification
- [ai_docs/claude-agent-sdk.md](../ai_docs/claude-agent-sdk.md) — SDK reference
- [src/lib/db/schema.ts](../src/lib/db/schema.ts) — Database schema

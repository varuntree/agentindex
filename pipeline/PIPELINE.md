# AgentIndex Data Pipeline

A multi-agent AI pipeline for researching and collecting Australian real estate agent/agency data using the Claude Agent SDK.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Agent Definitions](#agent-definitions)
- [Skill Prompts](#skill-prompts)
- [CLI Usage](#cli-usage)
- [Progress Feedback](#progress-feedback)
- [Data Flow](#data-flow)
- [Configuration Options](#configuration-options)

---

## Overview

The pipeline uses **Claude Agent SDK** to orchestrate AI agents that research real estate agencies and agents from public web sources. It collects:

- **Agency data** — name, logo, address, contact details
- **Agent profiles** — name, photo, bio, contact, suburbs served
- **Sales history** — recent property sales per agent
- **Reviews** — aggregated from RateMyAgent, Google, agency websites

All data is validated with Zod schemas and stored in SQLite via Drizzle ORM.

**Key Features:**
- No API key needed (uses Claude Code Max subscription)
- Parallel agent execution for speed
- Structured output validation
- Progress tracking with pipeline run IDs
- Dry-run mode for testing

---

## Architecture

```
CLI (pipeline.ts)
    ↓
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR                             │
│                                                              │
│  1. Agency Discovery Agent    →  Find agencies in location  │
│  2. Team Discovery Agent      →  Get agency + all agents    │
│  3. Agent Enrichment Agents   →  Sales + Reviews per agent  │
│                                                              │
│              (parallel execution via query())                │
└─────────────────────────────────────────────────────────────┘
    ↓
Zod Schema Validation
    ↓
Drizzle ORM → SQLite (data/agentindex.db)
    ↓
Pipeline Run Logs (tracking table)
```

### How It Works

1. **CLI parses arguments** — location, agencies, enrichment flags
2. **Pipeline run created** — tracking record in `pipeline_runs` table
3. **Agency discovery** — if `--discover-agencies`, agent searches for agencies
4. **Per-agency research** — agent finds team page, extracts all agents
5. **Per-agent enrichment** — parallel queries for sales and reviews
6. **Data storage** — upsert to agencies, agents, sales, reviews tables
7. **Run completion** — stats and errors recorded

### SDK Integration

The pipeline uses the Claude Agent SDK's `query()` function:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const message of query({
  prompt: researchPrompt,
  options: {
    allowedTools: ['WebSearch', 'WebFetch'],
    maxTurns: 10,
    maxBudgetUsd: 0.50,
  },
})) {
  // Process streaming messages
}
```

See [ai_docs/claude-agent-sdk.md](../ai_docs/claude-agent-sdk.md) for complete SDK reference.

---

## Agent Definitions

Three specialized research agents handle different tasks:

### 1. Agency Discovery Agent

**Purpose:** Find real estate agencies in a given location.

**Tools:** `WebSearch`, `WebFetch`

**Behavior:**
- Searches for "real estate agencies in [location]"
- Extracts agency names from search results
- Returns list of agencies to research

**Prompt location:** `pipeline/agents/index.ts` → `buildAgencyResearchPrompt()`

### 2. Team Discovery Agent

**Purpose:** Research an agency and extract all agent profiles.

**Tools:** `WebSearch`, `WebFetch`

**Behavior:**
1. Find agency's official website
2. Navigate to team/agents page
3. Extract agency details (logo, address, phone, email)
4. For each agent, extract:
   - Name (first + last)
   - Photo URL
   - Phone, email
   - Bio
   - Suburbs served
   - Specializations

**Output Schema:** `AgencyOutputSchema` with nested `agents[]`

**Prompt location:** `AGENCY_RESEARCHER_PROMPT` in `pipeline/agents/index.ts`

### 3. Agent Enrichment Agents

**Purpose:** Deep-dive on individual agents for sales and reviews.

Runs in parallel for each agent when `--no-sales` or `--no-reviews` not set.

#### Sales Researcher

**Behavior:**
1. Search agency "Sold" listings
2. Search Domain.com.au agent profile
3. Search RateMyAgent sales stats
4. Extract: address, price, date, property type, beds/baths

**Output Schema:** `SaleOutputSchema[]`

**Prompt:** `SALES_RESEARCHER_PROMPT`

#### Review Aggregator

**Behavior:**
1. Search RateMyAgent reviews
2. Search Google Business reviews
3. Search agency testimonials page
4. Extract: rating, text, date, reviewer type

**Output Schema:** `ReviewOutputSchema[]`

**Prompt:** `REVIEW_RESEARCHER_PROMPT`

---

## Skill Prompts

The pipeline uses a "skill prompting" pattern where each agent has a detailed system prompt defining their expertise and research methodology.

### Pattern Structure

```typescript
export const AGENT_TYPE_PROMPT = `You are a [specialist role].

Given [input context], your task is to [primary goal].

## Research Steps:
1. [Step one with specific source]
2. [Step two with extraction details]
3. [Step N...]

## For each [entity], extract:
- Field one (description)
- Field two (constraints)
- ...

## Important Notes:
- [Data quality guidance]
- [Privacy/accuracy rules]
- [Format requirements]

## Output Format:
Return [structured format description].`;
```

### Benefits

1. **Consistency** — Same research methodology every run
2. **Quality** — Explicit instructions prevent hallucination
3. **Debuggability** — Clear expectations for what agent should do
4. **Modularity** — Easy to add new specialist agents

### Prompt Builders

Dynamic prompts are built at runtime with task-specific context:

```typescript
export function buildAgencyResearchPrompt(task: AgencyResearchTask): string {
  return `${AGENCY_RESEARCHER_PROMPT}

## Your Task:
Research the agency "${task.agencyName}" located in ${task.location}.
...`;
}
```

This combines the base skill prompt with runtime parameters.

---

## CLI Usage

### Basic Syntax

```bash
pnpm pipeline:run --location "Suburb, STATE" [options]
```

### Examples

**Research specific agencies:**
```bash
pnpm pipeline:run \
  --location "Bondi Beach, NSW" \
  --agencies "Ray White Bondi Beach,McGrath Estate Agents"
```

**Auto-discover agencies:**
```bash
pnpm pipeline:run \
  --location "Surry Hills, NSW" \
  --discover-agencies \
  --limit 5
```

**Skip enrichment (faster):**
```bash
pnpm pipeline:run \
  --location "Newtown, NSW" \
  --agencies "Belle Property" \
  --no-sales \
  --no-reviews
```

**Dry run (no DB writes):**
```bash
pnpm pipeline:run \
  --location "Paddington, NSW" \
  --discover-agencies \
  --dry-run
```

### All Options

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--location` | `-l` | Target location (required) | — |
| `--agencies` | `-a` | Comma-separated agency names | — |
| `--discover-agencies` | — | Auto-discover agencies | `false` |
| `--limit` | — | Max agencies to process | `10` |
| `--no-sales` | — | Skip sales enrichment | (sales enabled) |
| `--no-reviews` | — | Skip reviews enrichment | (reviews enabled) |
| `--dry-run` | — | Validate without saving | `false` |
| `--help` | `-h` | Show help | — |

---

## Progress Feedback

The pipeline provides real-time CLI output as it runs:

### Output Format

```
========================================
AgentIndex Data Pipeline
========================================

Location: Bondi Beach, NSW
Dry run: false
Enrich sales: true
Enrich reviews: true

Pipeline run ID: 42

🔍 Discovering agencies in Bondi Beach, NSW...
Found 5 agencies

Processing 5 agencies...

📍 Researching: Ray White Bondi Beach
  Agency: Ray White Bondi Beach (id=1)
    Created agent: John Smith (id=1)
    Created agent: Jane Doe (id=2)
  Found 3 agents, 12 sales, 8 reviews

📍 Researching: McGrath Estate Agents
  Agency: McGrath Estate Agents (id=2)
    Updated agent: Bob Wilson (id=3)
  Found 2 agents, 5 sales, 3 reviews

========================================
Pipeline Complete
========================================
Agencies: 5
Agents: 12
Sales: 45
Reviews: 28
```

### Progress Indicators

- `🔍` — Discovery/search phase
- `📍` — Processing an agency
- `✓` — Success
- `✗` — Error (with message)

### Pipeline Run Tracking

Each run creates a record in `pipeline_runs` table:

```sql
SELECT * FROM pipeline_runs WHERE id = 42;
```

Fields tracked:
- `status` — running, success, partial_success, failed
- `target_location` — input location
- `started_at`, `completed_at` — timestamps
- `agencies_found`, `agents_found` — counts
- `sales_found`, `reviews_found` — enrichment counts
- `error_log` — JSON array of errors

---

## Data Flow

### Stage 1: Input

```
CLI Arguments
    ↓
parseArgs() → CLIArgs object
    ↓
Validate location is provided
```

### Stage 2: Discovery

```
--discover-agencies flag set?
    ↓
discoverAgencies(location, limit)
    ↓
query() with WebSearch → agency names[]
    ↓
OR use --agencies list directly
```

### Stage 3: Agency Research

For each agency:

```
buildAgencyResearchPrompt(agencyName, location)
    ↓
query() with WebSearch + WebFetch
    ↓
Extract JSON from response
    ↓
AgencyOutputSchema.safeParse()
    ↓
AgencyOutput { name, address, agents[] }
```

### Stage 4: Agent Enrichment

For each agent in agency (if enabled):

```
buildSalesResearchPrompt(agentName, agency)
    ↓                                ↓
query() → SaleOutput[]    query() → ReviewOutput[]
           (parallel)
```

### Stage 5: Storage

```
AgencyOutput
    ↓
generateSlug() → agency-name-suburb
    ↓
db.insert(agencies) or db.update(agencies)
    ↓
For each AgentOutput:
    ↓
    calculateAgentQualityScore()
    ↓
    db.insert(agents) or db.update(agents)
    ↓
    linkAgentToSuburbs()
    ↓
    For each sale: db.insert(sales)
    For each review: db.insert(reviews)
```

### Stage 6: Completion

```
Update pipeline_runs record
    ↓
Print summary stats
```

### Database Tables Affected

| Table | Operation |
|-------|-----------|
| `agencies` | Upsert by slug |
| `agents` | Upsert by slug |
| `agent_suburbs` | Replace links |
| `sales` | Insert (skip duplicates) |
| `reviews` | Insert |
| `pipeline_runs` | Track run |

---

## Configuration Options

### Environment Variables

The pipeline uses Claude Code Max subscription, so no API key is needed. However, you can configure:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Optional: use API key instead of subscription |
| `DATABASE_URL` | Override database path (default: `data/agentindex.db`) |

### Pipeline Budgets

Set in `pipeline/scripts/pipeline.ts`:

```typescript
options: {
  maxTurns: 10,        // Max agent iterations
  maxBudgetUsd: 0.50,  // Cost cap per query
}
```

### Schema Customization

Modify Zod schemas in `pipeline/schemas/index.ts` to adjust:
- Required vs optional fields
- Enum values (property types, review sources)
- Validation rules

### Quality Scoring

Agent quality score (0-100) is calculated in `calculateAgentQualityScore()`:

| Field | Weight |
|-------|--------|
| Photo URL | 10 |
| Bio (>100 chars) | 15 |
| Phone or email | 15 |
| Active license | 20 |
| Years experience | 10 |
| Specializations | 10 |
| Has sales | 10 |
| Has reviews | 10 |

---

## Related Documentation

- [spec/spec-data-pipeline.md](../spec/spec-data-pipeline.md) — Full specification
- [ai_docs/claude-agent-sdk.md](../ai_docs/claude-agent-sdk.md) — SDK reference
- [src/lib/db/schema.ts](../src/lib/db/schema.ts) — Database schema

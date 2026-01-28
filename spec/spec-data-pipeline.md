# AgentIndex Data Pipeline Specification

> **Pre-read required:** Before implementing, read [`../ai_docs/claude-agent-sdk.md`](../ai_docs/claude-agent-sdk.md) for complete Claude Agent SDK reference, sub-agent patterns, structured outputs, and code examples.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [SDK Implementation](#sdk-implementation)
- [Structured Output Schemas](#structured-output-schemas)
- [Execution Flow](#execution-flow)
- [Data Sources & Legality](#data-sources--legality)
- [Deduplication Strategy](#deduplication-strategy)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [CLI Commands](#cli-commands)
- [Configuration File](#configuration-file)
- [Monitoring & Logging](#monitoring--logging)
- [Future Enhancements (Post-MVP)](#future-enhancements-post-mvp)
- [Development Roadmap](#development-roadmap)
- [Success Metrics (MVP)](#success-metrics-mvp)
- [Cost Estimation](#cost-estimation)
- [Appendix](#appendix)

---

## Overview

Data pipeline uses **Claude Agent SDK (TypeScript)** for intelligent web research. AI orchestrator spawns parallel sub-agents using WebSearch/WebFetch to gather real estate agent/agency data, returning structured data matching our schema.

## Architecture

```
Pipeline Script (TypeScript)
    ↓
Orchestrator Agent (Claude)
    ├── Sub-Agent 1: Research Agency X → structured agency data
    ├── Sub-Agent 2: Research Agency Y → structured agency data
    ├── Sub-Agent 3: Research Agent Z → structured agent data
    └── ...parallel execution
    ↓
Zod Validation
    ↓
Drizzle ORM → SQLite
    ↓
Pipeline Run Logs
```

## SDK Implementation

### Agent Definitions

```typescript
import { query, AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

// Agency + team researcher
const agencyResearcher: AgentDefinition = {
  description: "Researches real estate agency and all agents",
  prompt: `Real estate data researcher. Given agency name + location:
    1. Search agency website
    2. Find team/agents page
    3. Per agent extract: name, photo URL, bio, phone, email, suburbs, specializations
    4. Get agency: logo, address, contact details
    5. Search recent sales by agency's agents
    6. Lookup agent license numbers (service.nsw.gov.au)
    Return ALL data in required structured format.`,
  tools: ['WebSearch', 'WebFetch'],
  model: 'sonnet'
};

// Individual agent deep-dive
const agentResearcher: AgentDefinition = {
  description: "Deep-dive single agent sales history + reviews",
  prompt: `Real estate agent researcher. Given agent name + agency:
    1. Find recent property sales (addresses, prices, dates, types)
    2. Find reviews (RateMyAgent, Google, others)
    3. Get property images from agency listings
    4. Verify license status on government register
    Return ALL data in required structured format.`,
  tools: ['WebSearch', 'WebFetch'],
  model: 'sonnet'
};

// License verification specialist
const licenseVerifier: AgentDefinition = {
  description: "Verifies agent licenses via NSW Fair Trading",
  prompt: `License verification specialist. Given agent name + license number:
    1. Search service.nsw.gov.au certificate holders register
    2. Verify license status (active/suspended/cancelled)
    3. Extract issue date, expiry, conditions
    Return structured license data.`,
  tools: ['WebSearch', 'WebFetch'],
  model: 'sonnet'
};

// Sales history specialist
const salesHistorian: AgentDefinition = {
  description: "Aggregates agent sales history from multiple sources",
  prompt: `Sales history researcher. Given agent name + agency:
    1. Search agency sold properties page
    2. Search Domain.com.au agent profile
    3. Search RateMyAgent sales stats
    4. Extract: address, price, date, property type, bedrooms/baths
    5. Get property images where available
    Return structured sales array.`,
  tools: ['WebSearch', 'WebFetch'],
  model: 'sonnet'
};

// Review aggregator
const reviewAggregator: AgentDefinition = {
  description: "Collects agent reviews from multiple platforms",
  prompt: `Review aggregator. Given agent name + agency:
    1. Search RateMyAgent profile
    2. Search Google Business reviews
    3. Search agency website testimonials
    4. Extract: rating, text, date, reviewer type, specific ratings
    Return structured reviews array.`,
  tools: ['WebSearch', 'WebFetch'],
  model: 'sonnet'
};
```

## Structured Output Schemas

### AgencyOutput

```typescript
const AgencyOutput = z.object({
  name: z.string(),
  slug: z.string().optional(),
  logo_url: z.string().url().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  suburb: z.string(),
  state: z.string(),
  postcode: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  google_rating: z.number().min(0).max(5).optional(),
  google_reviews_count: z.number().int().optional(),
  agents: z.array(AgentOutput),
  data_quality_score: z.number().min(0).max(100).optional()
});
```

### AgentOutput

```typescript
const AgentOutput = z.object({
  first_name: z.string(),
  last_name: z.string(),
  slug: z.string().optional(),
  photo_url: z.string().url().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  license_number: z.string().optional(),
  license_status: z.enum(['active', 'suspended', 'cancelled', 'unknown']).optional(),
  license_issue_date: z.string().optional(),
  license_expiry_date: z.string().optional(),
  years_experience: z.number().int().optional(),
  languages: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  property_types: z.array(z.string()).optional(),
  suburbs_served: z.array(z.string()),
  website: z.string().url().optional(),
  social_linkedin: z.string().url().optional(),
  social_facebook: z.string().url().optional(),
  social_instagram: z.string().url().optional(),
  rating_overall: z.number().min(0).max(5).optional(),
  rating_communication: z.number().min(0).max(5).optional(),
  rating_local_knowledge: z.number().min(0).max(5).optional(),
  rating_negotiation: z.number().min(0).max(5).optional(),
  rating_responsiveness: z.number().min(0).max(5).optional(),
  rating_marketing: z.number().min(0).max(5).optional(),
  reviews_count: z.number().int().optional(),
  sales_last_12_months: z.number().int().optional(),
  total_sales_value: z.number().optional(),
  median_sale_price: z.number().optional(),
  sales: z.array(SaleOutput).optional(),
  reviews: z.array(ReviewOutput).optional(),
  data_quality_score: z.number().min(0).max(100).optional()
});
```

### SaleOutput

```typescript
const SaleOutput = z.object({
  property_address: z.string(),
  property_suburb: z.string().optional(),
  property_state: z.string().optional(),
  property_postcode: z.string().optional(),
  property_type: z.enum(['house', 'apartment', 'unit', 'townhouse', 'land', 'other']).optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  parking: z.number().int().optional(),
  land_size_sqm: z.number().optional(),
  sale_price: z.number().optional(),
  listing_price: z.number().optional(),
  sale_date: z.string().optional(),
  listing_date: z.string().optional(),
  sale_method: z.enum(['auction', 'private_treaty', 'tender', 'eoi']).optional(),
  days_on_market: z.number().int().optional(),
  property_images: z.array(z.string().url()).optional(),
  source_url: z.string().url().optional()
});
```

### ReviewOutput

```typescript
const ReviewOutput = z.object({
  reviewer_name: z.string().optional(),
  reviewer_type: z.enum(['buyer', 'seller', 'landlord', 'tenant', 'unknown']).optional(),
  overall_rating: z.number().min(1).max(5),
  rating_communication: z.number().min(1).max(5).optional(),
  rating_local_knowledge: z.number().min(1).max(5).optional(),
  rating_negotiation: z.number().min(1).max(5).optional(),
  rating_responsiveness: z.number().min(1).max(5).optional(),
  rating_marketing: z.number().min(1).max(5).optional(),
  would_hire_again: z.boolean().optional(),
  price_expectations: z.enum(['exceeded', 'met', 'below', 'unknown']).optional(),
  review_text: z.string(),
  review_date: z.string().optional(),
  source: z.enum(['ratemyagent', 'google', 'agency_website', 'other']).optional(),
  source_url: z.string().url().optional()
});
```

## Execution Flow

### Step 1: Initialize Pipeline

```bash
# Single location, multiple agencies
pnpm pipeline:run --location "Bondi Beach, NSW" --agencies "Ray White Bondi Beach,McGrath Estate Agents"

# Multiple locations
pnpm pipeline:run --locations "Bondi Beach,Surry Hills,Newtown" --state "NSW"

# All major agencies in location
pnpm pipeline:run --location "Bondi Beach, NSW" --discover-agencies
```

### Step 2: Orchestrator Agent

```typescript
async function runPipeline(config: PipelineConfig) {
  const orchestrator = await query({
    prompt: `Research ${config.agencies.length} real estate agencies in ${config.location}.
      Spawn parallel sub-agents for each agency. Coordinate data collection.`,
    agents: [agencyResearcher, agentResearcher, licenseVerifier, salesHistorian, reviewAggregator],
    model: 'opus',
    structuredOutput: z.array(AgencyOutput)
  });

  // Orchestrator spawns parallel sub-agents per agency
  // Each sub-agent researches one agency + all its agents
  // Returns structured array of agency objects

  return orchestrator.result;
}
```

### Step 3: Data Collection Phase

**Phase 3a: Initial Research (Parallel)**
- Spawn agencyResearcher per target agency
- Each gathers: agency details + agent list + basic agent info
- Output: AgencyOutput[] with partial agent data

**Phase 3b: Enrichment (Parallel)**
- Per agent found, spawn enrichment sub-agents:
  - licenseVerifier → license status
  - salesHistorian → recent sales
  - reviewAggregator → reviews/ratings
- Merge enrichment data back into agent records

### Step 4: Validation & Transformation

```typescript
async function processAgencyData(rawData: unknown[]) {
  const validated = rawData.map(agency => {
    // Validate against Zod schema
    const result = AgencyOutput.safeParse(agency);
    if (!result.success) {
      logError('validation_failed', result.error);
      return null;
    }

    // Generate slugs
    result.data.slug = generateSlug(result.data.name, result.data.suburb);
    result.data.agents.forEach(agent => {
      agent.slug = generateSlug(agent.first_name, agent.last_name, result.data.slug);
    });

    // Compute data quality scores
    result.data.data_quality_score = calculateQualityScore(result.data);
    result.data.agents.forEach(agent => {
      agent.data_quality_score = calculateAgentQualityScore(agent);
    });

    return result.data;
  }).filter(Boolean);

  return validated;
}

function calculateQualityScore(agency: AgencyOutput): number {
  let score = 0;
  const weights = {
    logo_url: 10,
    description: 15,
    contact_info: 20, // phone + email + website
    location: 15, // lat/lng
    agents_count: 20,
    agents_completeness: 20 // avg agent quality scores
  };

  if (agency.logo_url) score += weights.logo_url;
  if (agency.description) score += weights.description;
  if (agency.phone && agency.email && agency.website) score += weights.contact_info;
  if (agency.latitude && agency.longitude) score += weights.location;
  if (agency.agents.length >= 5) score += weights.agents_count;

  const avgAgentScore = agency.agents.reduce((sum, a) =>
    sum + (a.data_quality_score || 0), 0) / agency.agents.length;
  score += (avgAgentScore / 100) * weights.agents_completeness;

  return Math.round(score);
}

function calculateAgentQualityScore(agent: AgentOutput): number {
  let score = 0;
  const weights = {
    photo: 10,
    bio: 15,
    contact: 15, // phone + email
    license: 20,
    experience: 10,
    specializations: 10,
    sales: 10,
    reviews: 10
  };

  if (agent.photo_url) score += weights.photo;
  if (agent.bio && agent.bio.length > 100) score += weights.bio;
  if (agent.phone && agent.email) score += weights.contact;
  if (agent.license_number && agent.license_status === 'active') score += weights.license;
  if (agent.years_experience) score += weights.experience;
  if (agent.specializations && agent.specializations.length > 0) score += weights.specializations;
  if (agent.sales && agent.sales.length > 0) score += weights.sales;
  if (agent.reviews && agent.reviews.length > 0) score += weights.reviews;

  return Math.round(score);
}
```

### Step 5: Storage via Drizzle ORM

```typescript
async function storeData(agencies: AgencyOutput[]) {
  await db.transaction(async (tx) => {
    for (const agency of agencies) {
      // Upsert agency
      const [agencyRecord] = await tx.insert(agencies)
        .values({
          ...agency,
          agents: undefined // Don't store nested
        })
        .onConflictDoUpdate({
          target: agencies.slug,
          set: {
            ...agency,
            updated_at: new Date()
          }
        })
        .returning();

      // Upsert agents
      for (const agent of agency.agents) {
        const [agentRecord] = await tx.insert(agents)
          .values({
            ...agent,
            agency_id: agencyRecord.id,
            sales: undefined,
            reviews: undefined
          })
          .onConflictDoUpdate({
            target: agents.slug,
            set: {
              ...agent,
              updated_at: new Date()
            }
          })
          .returning();

        // Upsert sales
        if (agent.sales) {
          for (const sale of agent.sales) {
            await tx.insert(sales)
              .values({
                ...sale,
                agent_id: agentRecord.id
              })
              .onConflictDoNothing(); // Prevent duplicates
          }
        }

        // Upsert reviews
        if (agent.reviews) {
          for (const review of agent.reviews) {
            await tx.insert(reviews)
              .values({
                ...review,
                agent_id: agentRecord.id
              })
              .onConflictDoNothing();
          }
        }
      }
    }
  });
}
```

### Step 6: Image Downloads (Optional)

```typescript
async function downloadImages(agencies: AgencyOutput[]) {
  const imageQueue: ImageDownload[] = [];

  for (const agency of agencies) {
    if (agency.logo_url) {
      imageQueue.push({
        url: agency.logo_url,
        path: `/public/images/agencies/${agency.slug}/logo.jpg`,
        entity_type: 'agency',
        entity_id: agency.slug
      });
    }

    for (const agent of agency.agents) {
      if (agent.photo_url) {
        imageQueue.push({
          url: agent.photo_url,
          path: `/public/images/agents/${agent.slug}/photo.jpg`,
          entity_type: 'agent',
          entity_id: agent.slug
        });
      }

      // Property images (sample only, limit per agent)
      if (agent.sales) {
        agent.sales.slice(0, 5).forEach((sale, idx) => {
          sale.property_images?.slice(0, 3).forEach((imgUrl, imgIdx) => {
            imageQueue.push({
              url: imgUrl,
              path: `/public/images/properties/${agent.slug}/${idx}-${imgIdx}.jpg`,
              entity_type: 'sale',
              entity_id: `${agent.slug}-${idx}`
            });
          });
        });
      }
    }
  }

  // Download in parallel batches (10 concurrent)
  await Promise.all(
    imageQueue.map(img => downloadAndStore(img))
  );
}

async function downloadAndStore(img: ImageDownload) {
  try {
    const response = await fetch(img.url, { timeout: 5000 });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    await fs.promises.mkdir(path.dirname(img.path), { recursive: true });
    await fs.promises.writeFile(img.path, Buffer.from(buffer));

    logInfo('image_downloaded', { url: img.url, path: img.path });
  } catch (error) {
    logError('image_download_failed', { url: img.url, error: error.message });
  }
}
```

### Step 7: Log Pipeline Run

```typescript
async function logPipelineRun(
  config: PipelineConfig,
  result: { agencies: AgencyOutput[], errors: Error[] }
) {
  const runLog = {
    location: config.location,
    agencies_targeted: config.agencies.join(','),
    agencies_found: result.agencies.length,
    agents_found: result.agencies.reduce((sum, a) => sum + a.agents.length, 0),
    sales_found: result.agencies.reduce((sum, a) =>
      sum + a.agents.reduce((s, ag) => s + (ag.sales?.length || 0), 0), 0),
    reviews_found: result.agencies.reduce((sum, a) =>
      sum + a.agents.reduce((s, ag) => s + (ag.reviews?.length || 0), 0), 0),
    errors: JSON.stringify(result.errors.map(e => ({
      message: e.message,
      stack: e.stack
    }))),
    avg_data_quality: result.agencies.reduce((sum, a) =>
      sum + (a.data_quality_score || 0), 0) / result.agencies.length,
    duration_seconds: config.endTime - config.startTime,
    status: result.errors.length === 0 ? 'success' : 'partial_success'
  };

  await db.insert(pipeline_runs).values(runLog);
}
```

## Data Sources & Legality

| Source | Data Collected | Legal Status | Notes |
|--------|----------------|--------------|-------|
| Agency websites | Agent profiles, photos, bios, contact, sales | ✅ Safe | Public marketing material |
| NSW Fair Trading | License numbers, status, dates | ✅ Safe | Government public record |
| Service NSW | Certificate holder register | ✅ Safe | Public register |
| RateMyAgent (public profiles) | Reviews, ratings, sales stats | ⚠️ Careful | Public pages, read-only, respect ToS |
| Domain.com.au (public listings) | Sold properties, prices, dates | ⚠️ Careful | Public pages, don't hammer |
| Google Business | Reviews, ratings, contact | ✅ Safe | Public business info |
| LinkedIn (public profiles) | Experience, bio | ⚠️ Careful | Light touch, no scraping |
| Agency sold listings | Property details, images | ✅ Safe | Public marketing |

### Legal Best Practices
- ✅ Respect robots.txt
- ✅ Rate limit all requests
- ✅ Use descriptive User-Agent
- ✅ Only collect publicly visible data
- ❌ Don't bypass authentication
- ❌ Don't scrape faster than human browsing
- ❌ Don't republish copyrighted content verbatim

## Deduplication Strategy

### Agency Matching
```typescript
function findDuplicateAgency(newAgency: AgencyOutput, existing: Agency[]) {
  return existing.find(a =>
    a.name.toLowerCase() === newAgency.name.toLowerCase() &&
    a.suburb.toLowerCase() === newAgency.suburb.toLowerCase()
  );
}
```

### Agent Matching
```typescript
function findDuplicateAgent(newAgent: AgentOutput, existing: Agent[]) {
  return existing.find(a =>
    a.first_name.toLowerCase() === newAgent.first_name.toLowerCase() &&
    a.last_name.toLowerCase() === newAgent.last_name.toLowerCase() &&
    a.agency_id === newAgent.agency_id
  );
}
```

### Sale Matching
```typescript
function findDuplicateSale(newSale: SaleOutput, existing: Sale[]) {
  return existing.find(s =>
    normalizeAddress(s.property_address) === normalizeAddress(newSale.property_address) &&
    s.sale_date === newSale.sale_date
  );
}

function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/\bst\b/g, 'street')
    .replace(/\brd\b/g, 'road')
    .replace(/\bave\b/g, 'avenue')
    .replace(/[^a-z0-9]/g, '');
}
```

### Merge Strategy
On conflict, preserve best quality data:
```typescript
function mergeAgentData(existing: Agent, incoming: AgentOutput): Agent {
  return {
    ...existing,
    // Prefer non-null values from incoming
    photo_url: incoming.photo_url || existing.photo_url,
    bio: (incoming.bio?.length || 0) > (existing.bio?.length || 0)
      ? incoming.bio : existing.bio,
    phone: incoming.phone || existing.phone,
    email: incoming.email || existing.email,
    // Merge arrays (unique values)
    languages: [...new Set([...(existing.languages || []), ...(incoming.languages || [])])],
    specializations: [...new Set([...(existing.specializations || []), ...(incoming.specializations || [])])],
    suburbs_served: [...new Set([...(existing.suburbs_served || []), ...(incoming.suburbs_served || [])])],
    // Update timestamp
    updated_at: new Date()
  };
}
```

## Error Handling

### Sub-Agent Failures
```typescript
async function runResilientPipeline(config: PipelineConfig) {
  const results: AgencyOutput[] = [];
  const errors: Error[] = [];

  // Spawn sub-agents in parallel
  const promises = config.agencies.map(async (agencyName) => {
    try {
      const agencyData = await query({
        prompt: `Research ${agencyName} in ${config.location}`,
        agents: [agencyResearcher],
        model: 'sonnet',
        structuredOutput: AgencyOutput,
        timeout: 300000 // 5 min per agency
      });

      results.push(agencyData.result);
    } catch (error) {
      errors.push(new Error(`Failed to research ${agencyName}: ${error.message}`));
      logError('sub_agent_failed', { agency: agencyName, error: error.message });
    }
  });

  await Promise.allSettled(promises);

  return { results, errors };
}
```

### Partial Data Handling
```typescript
function validatePartialData(agency: unknown): AgencyOutput | null {
  // Try full validation first
  const fullResult = AgencyOutput.safeParse(agency);
  if (fullResult.success) return fullResult.data;

  // Fall back to required fields only
  const minimalSchema = z.object({
    name: z.string(),
    suburb: z.string(),
    state: z.string(),
    postcode: z.string(),
    agents: z.array(z.object({
      first_name: z.string(),
      last_name: z.string(),
      suburbs_served: z.array(z.string())
    }))
  });

  const minimalResult = minimalSchema.safeParse(agency);
  if (minimalResult.success) {
    logWarning('partial_data_accepted', { agency: minimalResult.data.name });
    return minimalResult.data as AgencyOutput;
  }

  logError('validation_failed_completely', { agency });
  return null;
}
```

### Retry Logic
```typescript
async function retryableQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      logWarning('query_retry', { attempt, maxRetries, error: error.message });

      if (attempt < maxRetries) {
        await sleep(backoffMs * attempt); // Exponential backoff
      }
    }
  }

  throw lastError;
}
```

## Rate Limiting

### Claude Agent SDK
- Tier 1: 50 requests/min, 40k tokens/min
- Tier 2: 1k requests/min, 80k tokens/min
- Tier 3: 2k requests/min, 160k tokens/min
- Tier 4: 4k requests/min, 400k tokens/min

**Target: Tier 2+ for production pipeline**

### Sub-Agent Request Distribution
```typescript
class RateLimiter {
  private requestQueue: (() => Promise<any>)[] = [];
  private activeRequests = 0;
  private maxConcurrent = 10; // Adjust based on tier

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const fn = this.requestQueue.shift()!;
      this.activeRequests++;

      fn().finally(() => {
        this.activeRequests--;
        this.processQueue();
      });
    }
  }
}

const limiter = new RateLimiter();

// Usage
const results = await Promise.all(
  agencies.map(agency =>
    limiter.enqueue(() => researchAgency(agency))
  )
);
```

### Per-Domain Rate Limiting
```typescript
class DomainRateLimiter {
  private domainTimestamps = new Map<string, number[]>();
  private requestsPerMinute = 30; // Conservative per-domain limit

  async waitForSlot(url: string) {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const timestamps = this.domainTimestamps.get(domain) || [];

    // Remove timestamps older than 1 minute
    const recent = timestamps.filter(t => now - t < 60000);

    if (recent.length >= this.requestsPerMinute) {
      const oldestTimestamp = recent[0];
      const waitMs = 60000 - (now - oldestTimestamp);
      await sleep(waitMs);
    }

    recent.push(now);
    this.domainTimestamps.set(domain, recent);
  }
}
```

## CLI Commands

### Primary Commands
```bash
# Research specific agencies
pnpm pipeline:run \
  --location "Bondi Beach, NSW" \
  --agencies "Ray White Bondi Beach,McGrath Estate Agents,Belle Property Bondi Beach"

# Auto-discover agencies in location
pnpm pipeline:run \
  --location "Bondi Beach, NSW" \
  --discover-agencies \
  --limit 10

# Multiple locations
pnpm pipeline:run \
  --locations "Bondi Beach,Surry Hills,Newtown,Paddington" \
  --state "NSW" \
  --discover-agencies

# Enrichment run (update existing data)
pnpm pipeline:enrich \
  --entity agents \
  --where "data_quality_score < 50" \
  --focus "sales,reviews"
```

### Utility Commands
```bash
# Validate pipeline without running
pnpm pipeline:validate --config pipeline-config.json

# Generate pipeline report
pnpm pipeline:report --run-id abc123

# Retry failed agencies from previous run
pnpm pipeline:retry --run-id abc123

# Clean up duplicate records
pnpm pipeline:dedupe --dry-run
pnpm pipeline:dedupe --execute
```

## Configuration File

```typescript
// pipeline-config.json
{
  "locations": [
    { "suburb": "Bondi Beach", "state": "NSW" },
    { "suburb": "Surry Hills", "state": "NSW" }
  ],
  "agencies": {
    "mode": "discover", // or "specified"
    "list": [], // When mode=specified
    "limit": 20 // When mode=discover
  },
  "enrichment": {
    "licenses": true,
    "sales": true,
    "reviews": true,
    "images": true
  },
  "rate_limits": {
    "max_concurrent_agents": 10,
    "requests_per_domain_per_minute": 30
  },
  "quality": {
    "min_agent_quality_score": 30,
    "require_license_verification": false
  },
  "storage": {
    "download_images": true,
    "image_max_size_mb": 5
  }
}
```

## Monitoring & Logging

### Log Levels
```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  metadata?: Record<string, any>;
}

function log(level: LogLevel, category: string, message: string, metadata?: any) {
  const entry: LogEntry = {
    timestamp: new Date(),
    level,
    category,
    message,
    metadata
  };

  console.log(JSON.stringify(entry));

  // Store critical logs in DB
  if (level === LogLevel.ERROR || level === LogLevel.WARNING) {
    db.insert(pipeline_logs).values(entry);
  }
}
```

### Key Metrics
- Agencies researched
- Agents found
- Sales collected
- Reviews collected
- Data quality score (avg)
- Success rate (%)
- Duration per agency (avg)
- Errors by category
- Token usage
- API costs

### Pipeline Dashboard (Future)
```typescript
interface PipelineStats {
  total_runs: number;
  successful_runs: number;
  total_agencies: number;
  total_agents: number;
  avg_quality_score: number;
  last_run_date: Date;
  next_scheduled_run: Date;
  error_rate: number;
  avg_run_duration_minutes: number;
}
```

## Future Enhancements (Post-MVP)

### Phase 2: Incremental Updates
- Cron job: nightly runs for all tracked agencies
- Only fetch data changed since last run
- Agent-level last_updated tracking
- Smart refresh: prioritize low-quality records

### Phase 3: API Integrations
- Domain Developer API (free tier)
  - More reliable sales data
  - Property images
  - Auction results
- NSW Valuer General bulk data
  - Property valuations
  - Sales history (government source)
- Agency CRM feeds
  - Direct integrations with willing agencies
  - Real-time updates

### Phase 4: Advanced Features
- Automated data quality alerts
- A/B testing different agent prompts
- Multi-state expansion (VIC, QLD)
- Agent performance trending
- Suburb market analytics
- Email alerts for new reviews/sales

### Phase 5: Data Products
- Agency API (paid tier)
- Weekly market reports
- Agent comparison widgets
- Embeddable agent cards
- White-label solutions

## Development Roadmap

### Sprint 1: Foundation (Week 1-2)
- [ ] SDK setup + agent definitions
- [ ] Zod schemas finalized
- [ ] Basic pipeline script (single agency)
- [ ] Drizzle storage implementation
- [ ] Manual testing with 3 agencies

### Sprint 2: Scale (Week 3-4)
- [ ] Parallel execution
- [ ] Rate limiting
- [ ] Error handling + retries
- [ ] Deduplication logic
- [ ] CLI interface

### Sprint 3: Polish (Week 5-6)
- [ ] Image downloads
- [ ] Data quality scoring
- [ ] Pipeline logging + reporting
- [ ] Configuration file support
- [ ] Production testing with 50 agencies

### Sprint 4: Production (Week 7-8)
- [ ] Full Bondi Beach run (all agencies)
- [ ] Performance optimization
- [ ] Monitoring dashboard
- [ ] Documentation
- [ ] Deploy to production server

## Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Agencies covered (Bondi Beach) | 20+ |
| Agents collected | 200+ |
| Avg data quality score | 60+ |
| Pipeline success rate | 90%+ |
| Runtime per agency | <5 min |
| Sales per agent (avg) | 5+ |
| Reviews per agent (avg) | 3+ |

## Cost Estimation

### Claude API Usage (Tier 2)
- Sonnet: $3 per 1M input tokens, $15 per 1M output tokens
- Opus (orchestrator): $15 per 1M input, $75 per 1M output

**Estimated per agency:**
- Input: ~50k tokens (agent profiles, sales, reviews)
- Output: ~10k tokens (structured data)
- Cost: ~$0.30 per agency

**Full Bondi Beach run (20 agencies): ~$6**
**Monthly (1000 agencies): ~$300**

### Infrastructure
- Hetzner VPS: €4/mo (basic)
- SQLite: Free
- Image storage: ~$5/mo (S3-compatible)

**Total monthly: ~$310 for 1000 agencies**

## Appendix

### Useful Links
- [Claude Agent SDK Docs](https://github.com/anthropics/agent-sdk)
- [NSW Fair Trading](https://www.service.nsw.gov.au/)
- [RateMyAgent](https://www.ratemyagent.com.au/)
- [Domain.com.au](https://www.domain.com.au/)
- [Drizzle ORM](https://orm.drizzle.team/)

### Glossary
- **Sub-agent**: Claude instance spawned by orchestrator with specific research task
- **Orchestrator**: Main Claude agent coordinating parallel sub-agents
- **Enrichment**: Second-pass data collection for detailed info (sales, reviews, licenses)
- **Data quality score**: 0-100 metric reflecting completeness of entity data
- **Deduplication**: Identifying + merging duplicate records across runs

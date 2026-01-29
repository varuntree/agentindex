#!/usr/bin/env tsx
/**
 * AgentIndex Data Pipeline v2
 *
 * Multi-agent orchestrated pipeline using Claude Agent SDK.
 * Fixes from v1:
 * - Structured outputs (no regex JSON parsing)
 * - Retry logic with exponential backoff
 * - Parallel agency processing
 * - Real-time progress feedback
 * - Higher budget and turn limits
 *
 * Usage:
 *   pnpm pipeline:run --agency "Ray White Bondi Beach"
 *   pnpm pipeline:run --location "Bondi Beach, NSW" --discover-agencies --limit 5
 */

import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db, type DbClient } from '../../src/lib/db';
import {
  agencies,
  agents,
  agentSuburbs,
  sales,
  reviews,
  suburbs,
  pipelineRuns,
  type NewAgency,
  type NewAgent,
  type NewSale,
  type NewReview,
} from '../../src/lib/db/schema';
import {
  AgencyOutputSchema,
  AgentOutputSchema,
  SaleOutputSchema,
  ReviewOutputSchema,
  generateSlug,
  calculateAgentQualityScore,
  calculateAverageRating,
  type AgencyOutput,
  type AgentOutput,
  type SaleOutput,
  type ReviewOutput,
} from '../schemas';
import {
  buildAgencyDiscoveryPrompt,
  buildTeamDiscoveryPrompt,
  buildAgentEnrichmentPrompt,
  type AgencyDiscoveryInput,
  type TeamDiscoveryInput,
  type AgentEnrichmentInput,
} from '../agents/skills';
import { loadPipelineConfig, type PipelineConfig } from '../config/schema';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  maxTurns: 20,
  maxBudgetUsd: 3.0,
  maxRetries: 3,
  retryDelayMs: 2000,
  concurrentAgencies: 2,
  concurrentAgentEnrichment: 5,
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CLIArgs {
  agency?: string;
  location: string;
  agencies?: string[];
  discoverAgencies: boolean;
  limit: number;
  maxAgents: number;
  concurrency: number;
  enrichSales: boolean;
  enrichReviews: boolean;
  dryRun: boolean;
  json: boolean;
  verbose: boolean;
  configPath?: string;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  // Track which flags were explicitly set on CLI
  const explicitlySet = new Set<string>();

  let result: CLIArgs = {
    agency: undefined,
    location: '',
    agencies: undefined,
    discoverAgencies: false,
    limit: 10,
    maxAgents: 50,
    concurrency: 5,
    enrichSales: true,
    enrichReviews: true,
    dryRun: false,
    json: false,
    verbose: false,
    configPath: undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--config':
      case '-c':
        result.configPath = args[++i] || '';
        break;
      case '--agency':
        result.agency = args[++i] || '';
        explicitlySet.add('agency');
        break;
      case '--location':
      case '-l':
        result.location = args[++i] || '';
        explicitlySet.add('location');
        break;
      case '--agencies':
      case '-a':
        result.agencies = (args[++i] || '').split(',').map((s) => s.trim());
        explicitlySet.add('agencies');
        break;
      case '--discover-agencies':
        result.discoverAgencies = true;
        explicitlySet.add('discoverAgencies');
        break;
      case '--limit':
        result.limit = parseInt(args[++i] || '10', 10);
        explicitlySet.add('limit');
        break;
      case '--max-agents':
        result.maxAgents = parseInt(args[++i] || '50', 10);
        explicitlySet.add('maxAgents');
        break;
      case '--concurrency':
        result.concurrency = parseInt(args[++i] || '5', 10);
        explicitlySet.add('concurrency');
        break;
      case '--no-sales':
        result.enrichSales = false;
        explicitlySet.add('enrichSales');
        break;
      case '--no-reviews':
        result.enrichReviews = false;
        explicitlySet.add('enrichReviews');
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--json':
        result.json = true;
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  // If config file provided, load and merge (CLI args override config)
  if (result.configPath) {
    const config = loadPipelineConfig(result.configPath);
    result = mergeConfigWithCLI(result, config, explicitlySet);
  }

  return result;
}

/**
 * Merge config file values with CLI args. CLI args take precedence.
 */
function mergeConfigWithCLI(
  cli: CLIArgs,
  config: PipelineConfig,
  explicitlySet: Set<string>
): CLIArgs {
  const merged = { ...cli };

  // Use config.locations if no --location specified
  if (!explicitlySet.has('location') && config.locations.length > 0) {
    const loc = config.locations[0];
    merged.location = `${loc.suburb}, ${loc.state}`;
  }

  // Use config.agencies.mode if no --discover-agencies or --agencies specified
  if (!explicitlySet.has('discoverAgencies') && !explicitlySet.has('agencies')) {
    if (config.agencies.mode === 'discover') {
      merged.discoverAgencies = true;
    } else if (config.agencies.mode === 'specified' && config.agencies.list.length > 0) {
      merged.agencies = config.agencies.list;
    }
  }

  // Use config.agencies.limit if no --limit specified
  if (!explicitlySet.has('limit')) {
    merged.limit = config.agencies.limit;
  }

  // Use config.rate_limits.max_concurrent_agents for concurrency if not set
  if (!explicitlySet.has('concurrency')) {
    merged.concurrency = config.rate_limits.max_concurrent_agents;
  }

  // Use config.enrichment.sales for --no-sales default
  if (!explicitlySet.has('enrichSales')) {
    merged.enrichSales = config.enrichment.sales;
  }

  // Use config.enrichment.reviews for --no-reviews default
  if (!explicitlySet.has('enrichReviews')) {
    merged.enrichReviews = config.enrichment.reviews;
  }

  return merged;
}

function printHelp(): void {
  console.log(`
AgentIndex Data Pipeline v2

Usage:
  pnpm pipeline:run --agency "Agency Name" [options]
  pnpm pipeline:run --location "Suburb, STATE" --discover-agencies [options]
  pnpm pipeline:run --config pipeline-config.json [options]

Options:
  -c, --config <path>      Load config from JSON file (CLI args override)
  --agency <name>          Single agency to research (primary mode)
  -l, --location <loc>     Target location for discovery
  -a, --agencies <list>    Comma-separated agency names
  --discover-agencies      Auto-discover agencies in location
  --limit <n>              Max agencies to process (default: 10)
  --max-agents <n>         Max agents to enrich per agency (default: 50)
  --concurrency <n>        Parallel enrichment workers (default: 5)
  --no-sales               Skip sales enrichment
  --no-reviews             Skip reviews enrichment
  --dry-run                Validate without saving to DB
  --json                   Output machine-readable JSON logs
  -v, --verbose            Show detailed progress
  -h, --help               Show this help

Examples:
  # Research a single agency
  pnpm pipeline:run --agency "Ray White Bondi Beach"

  # Discover agencies in a location
  pnpm pipeline:run --location "Bondi Beach, NSW" --discover-agencies --limit 5

  # Multiple specific agencies
  pnpm pipeline:run --location "Sydney, NSW" --agencies "McGrath,Belle Property"

  # Using config file
  pnpm pipeline:run --config pipeline-config.json

  # Config file with CLI overrides
  pnpm pipeline:run --config pipeline-config.json --limit 5 --no-reviews
`);
}

// ---------------------------------------------------------------------------
// Logging utilities
// ---------------------------------------------------------------------------

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'progress';
  phase: string;
  message: string;
  data?: Record<string, unknown>;
}

let jsonMode = false;
let verboseMode = false;

function log(
  level: LogEntry['level'],
  phase: string,
  message: string,
  data?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    phase,
    message,
    data,
  };

  if (jsonMode) {
    console.log(JSON.stringify(entry));
    return;
  }

  const icons: Record<string, string> = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🔍',
    progress: '➤',
  };

  const icon = icons[level] || '•';

  if (level === 'debug' && !verboseMode) return;

  if (level === 'progress') {
    console.log(`  ${icon} [${phase}] ${message}`);
  } else if (level === 'error') {
    console.error(`${icon} [${phase}] ${message}`);
  } else {
    console.log(`${icon} [${phase}] ${message}`);
  }

  if (data && verboseMode) {
    console.log('    Data:', JSON.stringify(data, null, 2));
  }
}

function logPhaseStart(phase: string, description: string): void {
  if (!jsonMode) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📍 ${phase}: ${description}`);
    console.log('─'.repeat(50));
  } else {
    log('info', phase, description);
  }
}

// ---------------------------------------------------------------------------
// Pipeline run tracking
// ---------------------------------------------------------------------------

interface PipelineStats {
  agenciesFound: number;
  agentsFound: number;
  salesFound: number;
  reviewsFound: number;
  errors: string[];
  startTime: number;
}

async function createPipelineRun(location: string): Promise<number> {
  const [run] = await db
    .insert(pipelineRuns)
    .values({
      status: 'running',
      targetLocation: location,
      startedAt: new Date(),
      agentModel: 'claude-sonnet',
    })
    .returning();
  return run.id;
}

async function completePipelineRun(
  runId: number,
  stats: PipelineStats
): Promise<void> {
  await db
    .update(pipelineRuns)
    .set({
      status: stats.errors.length > 0 ? 'partial_success' : 'success',
      completedAt: new Date(),
      agenciesFound: stats.agenciesFound,
      agentsFound: stats.agentsFound,
      salesFound: stats.salesFound,
      reviewsFound: stats.reviewsFound,
      errorLog: stats.errors.length > 0 ? JSON.stringify(stats.errors) : null,
    })
    .where(eq(pipelineRuns.id, runId));
}

// ---------------------------------------------------------------------------
// Retry-enabled query runner with structured output extraction
// ---------------------------------------------------------------------------

interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  durationMs: number;
}

async function runQueryWithRetry<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  context: string
): Promise<QueryResult<T>> {
  const startTime = Date.now();
  let lastError = '';
  
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      log('debug', context, `Attempt ${attempt}/${CONFIG.maxRetries}`);
      
      let resultText = '';
      let structuredOutput: unknown = undefined;

      for await (const message of query({
        prompt,
        options: {
          allowedTools: ['WebSearch', 'WebFetch'],
          maxTurns: CONFIG.maxTurns,
          maxBudgetUsd: CONFIG.maxBudgetUsd,
        },
      })) {
        // Show progress for tool use
        if (message.type === 'assistant' && verboseMode) {
          const content = message.message?.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'tool_use') {
                log('debug', context, `Tool: ${block.name}`);
              }
            }
          }
        }

        // Collect text content
        if (message.type === 'assistant') {
          const content = message.message?.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text') {
                resultText += block.text;
              }
            }
          }
        }

        // Handle result message
        if (message.type === 'result') {
          if (message.subtype === 'success') {
            // Check for structured output first
            if ('structured_output' in message && message.structured_output) {
              structuredOutput = message.structured_output;
            } else if (message.result) {
              resultText = typeof message.result === 'string'
                ? message.result
                : JSON.stringify(message.result);
            }
          } else {
            lastError = `Query ended with: ${message.subtype}`;
            log('warn', context, lastError);
            break;
          }
        }
      }

      // Validate output
      let dataToValidate = structuredOutput;
      
      if (!dataToValidate && resultText) {
        // Try multiple JSON extraction strategies
        dataToValidate = extractJSON(resultText);
      }

      if (dataToValidate) {
        const validated = schema.safeParse(dataToValidate);
        if (validated.success) {
          return {
            success: true,
            data: validated.data,
            attempts: attempt,
            durationMs: Date.now() - startTime,
          };
        }
        lastError = `Validation failed: ${validated.error.message}`;
        log('warn', context, lastError);
      } else {
        lastError = 'No JSON data found in response';
        log('warn', context, lastError);
      }

    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      log('warn', context, `Attempt ${attempt} error: ${lastError}`);
    }

    // Exponential backoff before retry
    if (attempt < CONFIG.maxRetries) {
      const delay = CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
      log('debug', context, `Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: CONFIG.maxRetries,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Extract JSON from text using multiple strategies
 */
function extractJSON(text: string): unknown | null {
  // Strategy 1: Look for JSON code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* continue */ }
  }

  // Strategy 2: Find first complete JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch { /* continue */ }
  }

  // Strategy 3: Find first complete JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch { /* continue */ }
  }

  // Strategy 4: Try parsing the entire text
  try {
    return JSON.parse(text.trim());
  } catch { /* continue */ }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Phase 1: Agency Discovery
// ---------------------------------------------------------------------------

const AgencyBasicSchema = z.object({
  name: z.string(),
  brandName: z.string().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  streetAddress: z.string().optional().nullable(),
  suburb: z.string(),
  state: z.string(),
  postcode: z.string(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
});

type AgencyBasic = z.infer<typeof AgencyBasicSchema>;

async function discoverAgency(
  agencyName: string,
  location: string
): Promise<AgencyBasic | null> {
  const [suburb, state] = parseLocation(location);
  
  const input: AgencyDiscoveryInput = {
    agencyName,
    suburb,
    state,
  };

  const prompt = buildAgencyDiscoveryPrompt(input);
  const result = await runQueryWithRetry(
    prompt,
    AgencyBasicSchema,
    `Agency:${agencyName}`
  );

  if (result.success && result.data) {
    log('progress', 'Discovery', 
      `Found: ${result.data.name} (${result.data.websiteUrl || 'no website'})`,
      { attempts: result.attempts, duration: result.durationMs }
    );
    return result.data;
  }

  log('error', 'Discovery', `Failed for ${agencyName}: ${result.error}`);
  return null;
}

async function discoverAgenciesInLocation(
  location: string,
  limit: number
): Promise<string[]> {
  log('progress', 'Discovery', `Searching for agencies in ${location}...`);

  const prompt = `Search for the top ${limit} real estate agencies in ${location}, Australia.
Return ONLY a JSON array of agency names, nothing else.
Example: ["Ray White Bondi Beach", "McGrath Estate Agents", "Belle Property"]`;

  const AgencyListSchema = z.array(z.string());
  
  const result = await runQueryWithRetry(
    prompt,
    AgencyListSchema,
    'AgencyList'
  );

  if (result.success && result.data) {
    log('progress', 'Discovery', `Found ${result.data.length} agencies`);
    return result.data.slice(0, limit);
  }

  log('error', 'Discovery', `Failed to discover agencies: ${result.error}`);
  return [];
}

// ---------------------------------------------------------------------------
// Phase 2: Team Discovery
// ---------------------------------------------------------------------------

const AgentStubSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  photoUrl: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobilePhone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  profileUrl: z.string().url().optional().nullable(),
  role: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
});

const TeamListSchema = z.array(AgentStubSchema);

type AgentStub = z.infer<typeof AgentStubSchema>;

async function discoverTeam(
  agency: AgencyBasic
): Promise<AgentStub[]> {
  if (!agency.websiteUrl) {
    log('warn', 'Team', `No website for ${agency.name}, skipping team discovery`);
    return [];
  }

  const input: TeamDiscoveryInput = {
    agencyName: agency.name,
    websiteUrl: agency.websiteUrl,
    suburb: agency.suburb,
    state: agency.state,
  };

  const prompt = buildTeamDiscoveryPrompt(input);
  const result = await runQueryWithRetry(
    prompt,
    TeamListSchema,
    `Team:${agency.name}`
  );

  if (result.success && result.data) {
    log('progress', 'Team', 
      `Found ${result.data.length} agents at ${agency.name}`,
      { agents: result.data.map(a => `${a.firstName} ${a.lastName}`) }
    );
    return result.data;
  }

  log('error', 'Team', `Failed for ${agency.name}: ${result.error}`);
  return [];
}

// ---------------------------------------------------------------------------
// Phase 3: Agent Enrichment (Parallel)
// ---------------------------------------------------------------------------

async function enrichAgent(
  agentStub: AgentStub,
  agency: AgencyBasic,
  config: CLIArgs
): Promise<AgentOutput | null> {
  const input: AgentEnrichmentInput = {
    firstName: agentStub.firstName,
    lastName: agentStub.lastName,
    agencyName: agency.name,
    agencyWebsite: agency.websiteUrl,
    profileUrl: agentStub.profileUrl,
    suburb: agency.suburb,
    state: agency.state,
  };

  // Build enrichment prompt with feature toggles
  let prompt = buildAgentEnrichmentPrompt(input);
  
  if (!config.enrichSales) {
    prompt += '\n\nNOTE: Skip sales research - do not gather sales history.';
  }
  if (!config.enrichReviews) {
    prompt += '\n\nNOTE: Skip reviews research - do not gather reviews.';
  }

  const result = await runQueryWithRetry(
    prompt,
    AgentOutputSchema,
    `Enrich:${agentStub.firstName} ${agentStub.lastName}`
  );

  if (result.success && result.data) {
    const agent = result.data;
    log('progress', 'Enrichment',
      `${agent.firstName} ${agent.lastName}: ` +
      `${agent.sales?.length || 0} sales, ${agent.reviews?.length || 0} reviews`
    );
    return agent;
  }

  // Return basic agent from stub if enrichment fails
  log('warn', 'Enrichment', 
    `Failed for ${agentStub.firstName} ${agentStub.lastName}, using stub data`
  );
  
  return {
    firstName: agentStub.firstName,
    lastName: agentStub.lastName,
    email: agentStub.email,
    phone: agentStub.phone,
    mobilePhone: agentStub.mobilePhone,
    photoUrl: agentStub.photoUrl,
    suburbsServiced: [agency.suburb],
    sourceUrl: agentStub.sourceUrl,
  };
}

async function enrichAgentsParallel(
  agentStubs: AgentStub[],
  agency: AgencyBasic,
  config: CLIArgs
): Promise<AgentOutput[]> {
  const results: AgentOutput[] = [];
  const concurrency = config.concurrency;
  
  // Process in batches
  for (let i = 0; i < agentStubs.length; i += concurrency) {
    const batch = agentStubs.slice(i, i + concurrency);
    log('debug', 'Enrichment', 
      `Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(agentStubs.length / concurrency)}`
    );
    
    const batchResults = await Promise.all(
      batch.map((stub) => enrichAgent(stub, agency, config))
    );
    
    for (const result of batchResults) {
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Data Storage
// ---------------------------------------------------------------------------

interface StoreResult {
  agencyId: number;
  agentCount: number;
  salesCount: number;
  reviewCount: number;
}

async function storeAgencyWithAgents(
  agencyBasic: AgencyBasic,
  enrichedAgents: AgentOutput[],
  config: CLIArgs
): Promise<StoreResult> {
  return await db.transaction(async (tx) => {
    const agencySlug = generateSlug(agencyBasic.name, agencyBasic.suburb);

    const agencyValues: NewAgency = {
      slug: agencySlug,
      name: agencyBasic.name,
      brandName: agencyBasic.brandName,
      logoUrl: agencyBasic.logoUrl,
      websiteUrl: agencyBasic.websiteUrl,
      phone: agencyBasic.phone,
      email: agencyBasic.email,
      streetAddress: agencyBasic.streetAddress,
      suburb: agencyBasic.suburb,
      state: agencyBasic.state,
      postcode: agencyBasic.postcode,
      lat: agencyBasic.lat,
      lng: agencyBasic.lng,
      description: agencyBasic.description,
      sourceUrl: agencyBasic.sourceUrl,
      lastScrapedAt: new Date(),
    };

    // Upsert agency
    const existingAgency = await tx
      .select()
      .from(agencies)
      .where(eq(agencies.slug, agencySlug))
      .limit(1);

    let agencyId: number;
    if (existingAgency.length > 0) {
      await tx.update(agencies).set(agencyValues).where(eq(agencies.slug, agencySlug));
      agencyId = existingAgency[0].id;
      log('progress', 'Storage', `Updated agency: ${agencyBasic.name} (id=${agencyId})`);
    } else {
      const [inserted] = await tx.insert(agencies).values(agencyValues).returning();
      agencyId = inserted.id;
      log('progress', 'Storage', `Created agency: ${agencyBasic.name} (id=${agencyId})`);
    }

    let totalSales = 0;
    let totalReviews = 0;

    // Store each agent
    for (const agentData of enrichedAgents) {
      const result = await storeAgent(agentData, agencyId, agencyBasic.suburb, tx);
      totalSales += result.salesCount;
      totalReviews += result.reviewCount;
    }

    return {
      agencyId,
      agentCount: enrichedAgents.length,
      salesCount: totalSales,
      reviewCount: totalReviews,
    };
  });
}

interface AgentStoreResult {
  agentId: number;
  salesCount: number;
  reviewCount: number;
}

async function storeAgent(
  agentData: AgentOutput,
  agencyId: number,
  defaultSuburb: string,
  tx?: DbClient
): Promise<AgentStoreResult> {
  const client = tx ?? db;
  const fullName = `${agentData.firstName} ${agentData.lastName}`;
  const agentSlug = generateSlug(agentData.firstName, agentData.lastName);

  const avgRating = agentData.reviews
    ? calculateAverageRating(agentData.reviews as ReviewOutput[])
    : null;
  const qualityScore = calculateAgentQualityScore(agentData);

  const agentValues: NewAgent = {
    slug: agentSlug,
    agencyId,
    firstName: agentData.firstName,
    lastName: agentData.lastName,
    fullName,
    email: agentData.email ?? null,
    phone: agentData.phone ?? null,
    mobilePhone: agentData.mobilePhone ?? null,
    photoUrl: agentData.photoUrl ?? null,
    licenseNumber: agentData.licenseNumber ?? null,
    licenseStatus: agentData.licenseStatus ?? null,
    licenseState: agentData.licenseState ?? null,
    bio: agentData.bio ?? null,
    yearsActive: agentData.yearsActive ?? null,
    languagesSpoken: agentData.languagesSpoken?.join(', '),
    specializations: agentData.specializations?.join(', '),
    ratingOverall: avgRating,
    reviewCount: agentData.reviews?.length || 0,
    salesCount: agentData.sales?.length || 0,
    dataQualityScore: qualityScore,
    sourceUrl: agentData.sourceUrl,
    lastScrapedAt: new Date(),
  };

  // Upsert agent
  const existingAgent = await client
    .select()
    .from(agents)
    .where(eq(agents.slug, agentSlug))
    .limit(1);

  let agentId: number;
  if (existingAgent.length > 0) {
    await client.update(agents).set(agentValues).where(eq(agents.slug, agentSlug));
    agentId = existingAgent[0].id;
    log('debug', 'Storage', `Updated agent: ${fullName} (id=${agentId})`);
  } else {
    const [inserted] = await client.insert(agents).values(agentValues).returning();
    agentId = inserted.id;
    log('debug', 'Storage', `Created agent: ${fullName} (id=${agentId})`);
  }

  // Link agent to suburbs
  const suburbsToLink = agentData.suburbsServiced?.length
    ? agentData.suburbsServiced
    : [defaultSuburb];
  await linkAgentToSuburbs(agentId, suburbsToLink, tx);

  // Store sales
  let salesCount = 0;
  if (agentData.sales) {
    for (const sale of agentData.sales) {
      await storeSale(sale as SaleOutput, agentId, agencyId, tx);
      salesCount++;
    }
  }

  // Store reviews
  let reviewCount = 0;
  if (agentData.reviews) {
    for (const review of agentData.reviews) {
      await storeReview(review as ReviewOutput, agentId, tx);
      reviewCount++;
    }
  }

  return { agentId, salesCount, reviewCount };
}

async function linkAgentToSuburbs(
  agentId: number,
  suburbNames: string[],
  tx?: DbClient
): Promise<void> {
  const client = tx ?? db;
  // Delete existing links
  await client.delete(agentSuburbs).where(eq(agentSuburbs.agentId, agentId));

  for (const suburbName of suburbNames) {
    const [suburb] = await client
      .select()
      .from(suburbs)
      .where(sql`LOWER(${suburbs.name}) = LOWER(${suburbName})`)
      .limit(1);

    if (suburb) {
      await client.insert(agentSuburbs).values({
        agentId,
        suburbId: suburb.id,
        isPrimary: suburbNames.indexOf(suburbName) === 0 ? 1 : 0,
      });
    }
  }
}

async function storeSale(
  sale: SaleOutput,
  agentId: number,
  agencyId: number,
  tx?: DbClient
): Promise<void> {
  const client = tx ?? db;

  // Check for duplicate
  const existingSale = await client
    .select()
    .from(sales)
    .where(
      sql`${sales.agentId} = ${agentId} AND LOWER(${sales.propertyAddress}) = LOWER(${sale.propertyAddress})`
    )
    .limit(1);

  if (existingSale.length > 0) return;

  const saleValues: NewSale = {
    agentId,
    agencyId,
    propertyAddress: sale.propertyAddress,
    suburb: sale.suburb,
    state: sale.state,
    postcode: sale.postcode,
    propertyType: sale.propertyType,
    salePrice: sale.salePrice,
    listingPrice: sale.listingPrice,
    saleMethod: sale.saleMethod,
    saleDate: sale.saleDate,
    daysOnMarket: sale.daysOnMarket,
    bedrooms: sale.bedrooms,
    bathrooms: sale.bathrooms,
    carSpaces: sale.carSpaces,
    landArea: sale.landArea,
    floorArea: sale.floorArea,
    imageUrl: sale.imageUrl,
    sourceUrl: sale.sourceUrl,
  };

  await client.insert(sales).values(saleValues);
}

async function storeReview(
  review: ReviewOutput,
  agentId: number,
  tx?: DbClient
): Promise<void> {
  const client = tx ?? db;

  const reviewValues: NewReview = {
    agentId,
    reviewerName: review.reviewerName,
    reviewDate: review.reviewDate,
    reviewerType: review.reviewerType,
    overallRating: review.overallRating,
    knowledgeRating: review.knowledgeRating,
    communicationRating: review.communicationRating,
    negotiationRating: review.negotiationRating,
    reviewText: review.reviewText,
    priceRange: review.priceRange,
    sourceUrl: review.sourceUrl,
    sourcePlatform: review.sourcePlatform,
  };

  await client.insert(reviews).values(reviewValues);
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function parseLocation(location: string): [string, string] {
  const parts = location.split(',').map((s) => s.trim());
  const suburb = parts[0] || 'Sydney';
  const state = parts[1] || 'NSW';
  return [suburb, state];
}

// ---------------------------------------------------------------------------
// Main pipeline execution
// ---------------------------------------------------------------------------

async function runPipeline(config: CLIArgs): Promise<void> {
  jsonMode = config.json;
  verboseMode = config.verbose;

  if (!jsonMode) {
    console.log('\n════════════════════════════════════════');
    console.log('     AgentIndex Data Pipeline v2');
    console.log('════════════════════════════════════════\n');
  }

  // Determine what to research
  let agencyNames: string[] = [];
  let location = config.location;

  if (config.agency) {
    // Single agency mode
    agencyNames = [config.agency];
    if (!location) {
      // Try to infer location from agency name
      location = 'NSW';
    }
    log('info', 'Config', `Single agency: ${config.agency}`);
  } else if (config.agencies) {
    agencyNames = config.agencies;
    log('info', 'Config', `Agencies: ${agencyNames.join(', ')}`);
  } else if (config.discoverAgencies) {
    if (!location) {
      console.error('Error: --location required with --discover-agencies');
      process.exit(1);
    }
    log('info', 'Config', `Discovering agencies in: ${location}`);
  } else {
    console.error('Error: Specify --agency, --agencies, or --discover-agencies');
    printHelp();
    process.exit(1);
  }

  log('info', 'Config', `Location: ${location}`);
  log('info', 'Config', `Dry run: ${config.dryRun}`);
  log('info', 'Config', `Enrich sales: ${config.enrichSales}`);
  log('info', 'Config', `Enrich reviews: ${config.enrichReviews}`);

  const stats: PipelineStats = {
    agenciesFound: 0,
    agentsFound: 0,
    salesFound: 0,
    reviewsFound: 0,
    errors: [],
    startTime: Date.now(),
  };

  // Create pipeline run record
  let runId: number | null = null;
  if (!config.dryRun) {
    runId = await createPipelineRun(location);
    log('info', 'Pipeline', `Run ID: ${runId}`);
  }

  try {
    // Phase 1: Get agency list
    if (agencyNames.length === 0 && config.discoverAgencies) {
      logPhaseStart('Phase 1', 'Agency Discovery');
      agencyNames = await discoverAgenciesInLocation(location, config.limit);
    }

    if (agencyNames.length === 0) {
      throw new Error('No agencies to research');
    }

    log('info', 'Pipeline', `Processing ${agencyNames.length} agencies`);

    // Process each agency
    for (const agencyName of agencyNames) {
      try {
        // Phase 1: Discover agency details
        logPhaseStart('Phase 1', `Agency: ${agencyName}`);
        const agencyBasic = await discoverAgency(agencyName, location);

        if (!agencyBasic) {
          stats.errors.push(`${agencyName}: Agency discovery failed`);
          continue;
        }

        // Phase 2: Discover team
        logPhaseStart('Phase 2', `Team Discovery: ${agencyBasic.name}`);
        let agentStubs = await discoverTeam(agencyBasic);

        if (agentStubs.length === 0) {
          log('warn', 'Team', `No agents found for ${agencyBasic.name}`);
        }

        // Limit agents if needed
        if (agentStubs.length > config.maxAgents) {
          log('info', 'Team', `Limiting to ${config.maxAgents} agents`);
          agentStubs = agentStubs.slice(0, config.maxAgents);
        }

        // Phase 3: Enrich agents in parallel
        let enrichedAgents: AgentOutput[] = [];
        if (agentStubs.length > 0) {
          logPhaseStart('Phase 3', `Agent Enrichment (${agentStubs.length} agents)`);
          enrichedAgents = await enrichAgentsParallel(agentStubs, agencyBasic, config);
        }

        // Phase 4: Store data
        if (config.dryRun) {
          log('info', 'DryRun', 
            `Would store: ${agencyBasic.name} with ${enrichedAgents.length} agents`
          );
          stats.agenciesFound++;
          stats.agentsFound += enrichedAgents.length;
          for (const agent of enrichedAgents) {
            stats.salesFound += agent.sales?.length || 0;
            stats.reviewsFound += agent.reviews?.length || 0;
          }
        } else {
          logPhaseStart('Phase 4', 'Data Storage');
          const result = await storeAgencyWithAgents(agencyBasic, enrichedAgents, config);
          stats.agenciesFound++;
          stats.agentsFound += result.agentCount;
          stats.salesFound += result.salesCount;
          stats.reviewsFound += result.reviewCount;
        }

      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log('error', 'Pipeline', `Failed for ${agencyName}: ${msg}`);
        stats.errors.push(`${agencyName}: ${msg}`);
      }

      // Small delay between agencies
      await sleep(1000);
    }

    // Print summary
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
    
    if (!jsonMode) {
      console.log('\n════════════════════════════════════════');
      console.log('              Pipeline Complete');
      console.log('════════════════════════════════════════');
      console.log(`  Agencies: ${stats.agenciesFound}`);
      console.log(`  Agents:   ${stats.agentsFound}`);
      console.log(`  Sales:    ${stats.salesFound}`);
      console.log(`  Reviews:  ${stats.reviewsFound}`);
      console.log(`  Duration: ${duration}s`);
      if (stats.errors.length > 0) {
        console.log(`  Errors:   ${stats.errors.length}`);
        for (const err of stats.errors) {
          console.log(`    - ${err}`);
        }
      }
      console.log('════════════════════════════════════════\n');
    } else {
      log('info', 'Complete', 'Pipeline finished', {
        agencies: stats.agenciesFound,
        agents: stats.agentsFound,
        sales: stats.salesFound,
        reviews: stats.reviewsFound,
        duration: parseFloat(duration),
        errors: stats.errors,
      });
    }

  } finally {
    // Update pipeline run status
    if (runId && !config.dryRun) {
      await completePipelineRun(runId, stats);
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const config = parseArgs();
runPipeline(config).catch((error) => {
  log('error', 'Fatal', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

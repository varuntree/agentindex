#!/usr/bin/env tsx
/**
 * AgentIndex Enrichment Pipeline
 *
 * Re-enrich existing agents without full discovery.
 * Targets agents with low data quality scores.
 *
 * Usage:
 *   pnpm pipeline:enrich --where "data_quality_score < 50"
 *   pnpm pipeline:enrich --agent "john-smith"
 *   pnpm pipeline:enrich --agency "ray-white-bondi-beach"
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { eq, sql, lt, and } from 'drizzle-orm';
import { db } from '../../src/lib/db';
import { agents, agencies, sales, reviews, type NewSale, type NewReview } from '../../src/lib/db/schema';
import {
  AgentOutputSchema,
  SaleOutputSchema,
  ReviewOutputSchema,
  calculateAgentQualityScore,
  calculateAverageRating,
  type AgentOutput,
  type SaleOutput,
  type ReviewOutput,
} from '../schemas';
import { buildAgentEnrichmentPrompt, type AgentEnrichmentInput } from '../agents/skills';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  maxTurns: 20,
  maxBudgetUsd: 2.0,
  maxRetries: 3,
  retryDelayMs: 2000,
  batchSize: 5,
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CLIArgs {
  agent?: string;
  agency?: string;
  minQuality?: number;
  maxQuality?: number;
  limit: number;
  focus: ('sales' | 'reviews' | 'license')[];
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  const result: CLIArgs = {
    agent: undefined,
    agency: undefined,
    minQuality: undefined,
    maxQuality: 50, // Default: enrich low quality agents
    limit: 20,
    focus: ['sales', 'reviews'],
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--agent':
        result.agent = args[++i] || '';
        break;
      case '--agency':
        result.agency = args[++i] || '';
        break;
      case '--min-quality':
        result.minQuality = parseInt(args[++i] || '0', 10);
        break;
      case '--max-quality':
        result.maxQuality = parseInt(args[++i] || '50', 10);
        break;
      case '--limit':
        result.limit = parseInt(args[++i] || '20', 10);
        break;
      case '--focus':
        result.focus = (args[++i] || 'sales,reviews')
          .split(',')
          .map((s) => s.trim() as 'sales' | 'reviews' | 'license');
        break;
      case '--dry-run':
        result.dryRun = true;
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

  return result;
}

function printHelp(): void {
  console.log(`
AgentIndex Enrichment Pipeline

Usage:
  pnpm pipeline:enrich [options]

Options:
  --agent <slug>           Enrich specific agent by slug
  --agency <slug>          Enrich all agents in agency
  --min-quality <n>        Minimum quality score (default: 0)
  --max-quality <n>        Maximum quality score (default: 50)
  --limit <n>              Max agents to process (default: 20)
  --focus <list>           Comma-separated: sales,reviews,license (default: sales,reviews)
  --dry-run                Show what would be enriched without saving
  -v, --verbose            Show detailed progress
  -h, --help               Show this help

Examples:
  # Enrich agents with quality < 50
  pnpm pipeline:enrich

  # Enrich specific agent
  pnpm pipeline:enrich --agent "john-smith"

  # Enrich all agents in an agency
  pnpm pipeline:enrich --agency "ray-white-bondi-beach"

  # Focus on sales data only
  pnpm pipeline:enrich --focus sales --limit 10

  # Dry run to see what would be enriched
  pnpm pipeline:enrich --dry-run
`);
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

let verboseMode = false;

function log(level: string, message: string, data?: Record<string, unknown>): void {
  if (level === 'debug' && !verboseMode) return;

  const icons: Record<string, string> = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🔍',
    progress: '➤',
  };
  const icon = icons[level] || '•';
  console.log(`${icon} ${message}`);
  if (data && verboseMode) {
    console.log('   ', JSON.stringify(data, null, 2));
  }
}

// ---------------------------------------------------------------------------
// Agent Selection
// ---------------------------------------------------------------------------

interface AgentToEnrich {
  id: number;
  slug: string;
  firstName: string;
  lastName: string;
  agencyName: string;
  agencyWebsite: string | null;
  suburb: string;
  state: string;
  currentQuality: number | null;
}

async function selectAgentsToEnrich(config: CLIArgs): Promise<AgentToEnrich[]> {
  if (config.agent) {
    // Single agent by slug
    const [agent] = await db
      .select({
        id: agents.id,
        slug: agents.slug,
        firstName: agents.firstName,
        lastName: agents.lastName,
        agencyName: agencies.name,
        agencyWebsite: agencies.websiteUrl,
        suburb: agencies.suburb,
        state: agencies.state,
        currentQuality: agents.dataQualityScore,
      })
      .from(agents)
      .leftJoin(agencies, eq(agents.agencyId, agencies.id))
      .where(eq(agents.slug, config.agent))
      .limit(1);

    if (!agent) {
      throw new Error(`Agent not found: ${config.agent}`);
    }

    return [agent];
  }

  // Build query conditions
  const conditions = [];

  if (config.agency) {
    const [agency] = await db
      .select({ id: agencies.id })
      .from(agencies)
      .where(eq(agencies.slug, config.agency))
      .limit(1);

    if (!agency) {
      throw new Error(`Agency not found: ${config.agency}`);
    }

    conditions.push(eq(agents.agencyId, agency.id));
  }

  if (config.maxQuality !== undefined) {
    conditions.push(
      sql`(${agents.dataQualityScore} IS NULL OR ${agents.dataQualityScore} < ${config.maxQuality})`
    );
  }

  if (config.minQuality !== undefined) {
    conditions.push(
      sql`(${agents.dataQualityScore} IS NOT NULL AND ${agents.dataQualityScore} >= ${config.minQuality})`
    );
  }

  const query = db
    .select({
      id: agents.id,
      slug: agents.slug,
      firstName: agents.firstName,
      lastName: agents.lastName,
      agencyName: agencies.name,
      agencyWebsite: agencies.websiteUrl,
      suburb: agencies.suburb,
      state: agencies.state,
      currentQuality: agents.dataQualityScore,
    })
    .from(agents)
    .leftJoin(agencies, eq(agents.agencyId, agencies.id));

  if (conditions.length > 0) {
    return await query.where(and(...conditions)).limit(config.limit);
  }

  return await query.limit(config.limit);
}

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------

async function enrichAgent(
  agent: AgentToEnrich,
  focus: CLIArgs['focus']
): Promise<AgentOutput | null> {
  const input: AgentEnrichmentInput = {
    firstName: agent.firstName,
    lastName: agent.lastName,
    agencyName: agent.agencyName,
    agencyWebsite: agent.agencyWebsite,
    profileUrl: null,
    suburb: agent.suburb,
    state: agent.state,
  };

  let prompt = buildAgentEnrichmentPrompt(input);

  // Focus modifiers
  if (!focus.includes('sales')) {
    prompt += '\n\nNOTE: Skip sales research - do not gather sales history.';
  }
  if (!focus.includes('reviews')) {
    prompt += '\n\nNOTE: Skip reviews research - do not gather reviews.';
  }
  if (!focus.includes('license')) {
    prompt += '\n\nNOTE: Skip license verification - do not look up license details.';
  }

  let resultText = '';
  let lastError = '';

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      log('debug', `Attempt ${attempt}/${CONFIG.maxRetries} for ${agent.firstName} ${agent.lastName}`);

      for await (const message of query({
        prompt,
        options: {
          allowedTools: ['WebSearch', 'WebFetch'],
          maxTurns: CONFIG.maxTurns,
          maxBudgetUsd: CONFIG.maxBudgetUsd,
        },
      })) {
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

        if (message.type === 'result' && message.subtype === 'success') {
          if ('structured_output' in message && message.structured_output) {
            const validated = AgentOutputSchema.safeParse(message.structured_output);
            if (validated.success) {
              return validated.data;
            }
          }
        }
      }

      // Try to extract JSON from text
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = AgentOutputSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
        lastError = `Validation failed: ${validated.error.message}`;
      } else {
        lastError = 'No JSON found in response';
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      log('debug', `Attempt ${attempt} error: ${lastError}`);
    }

    if (attempt < CONFIG.maxRetries) {
      const delay = CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  log('warn', `Failed to enrich ${agent.firstName} ${agent.lastName}: ${lastError}`);
  return null;
}

async function updateAgent(agentId: number, enriched: AgentOutput): Promise<void> {
  const avgRating = enriched.reviews
    ? calculateAverageRating(enriched.reviews as ReviewOutput[])
    : null;
  const qualityScore = calculateAgentQualityScore(enriched);

  await db.transaction(async (tx) => {
    // Update agent fields
    await tx
      .update(agents)
      .set({
        bio: enriched.bio ?? undefined,
        licenseNumber: enriched.licenseNumber ?? undefined,
        licenseStatus: enriched.licenseStatus ?? undefined,
        licenseState: enriched.licenseState ?? undefined,
        yearsActive: enriched.yearsActive ?? undefined,
        ratingOverall: avgRating ?? undefined,
        reviewCount: (enriched.reviews?.length || 0) + (await tx.select().from(reviews).where(eq(reviews.agentId, agentId))).length,
        salesCount: (enriched.sales?.length || 0) + (await tx.select().from(sales).where(eq(sales.agentId, agentId))).length,
        dataQualityScore: qualityScore,
        lastScrapedAt: new Date(),
      })
      .where(eq(agents.id, agentId));

    // Add new sales (check duplicates by address)
    if (enriched.sales) {
      for (const sale of enriched.sales) {
        const [existing] = await tx
          .select()
          .from(sales)
          .where(
            sql`${sales.agentId} = ${agentId} AND LOWER(${sales.propertyAddress}) = LOWER(${sale.propertyAddress})`
          )
          .limit(1);

        if (!existing) {
          const [agentRecord] = await tx
            .select({ agencyId: agents.agencyId })
            .from(agents)
            .where(eq(agents.id, agentId))
            .limit(1);

          await tx.insert(sales).values({
            agentId,
            agencyId: agentRecord?.agencyId || null,
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
          } as NewSale);
        }
      }
    }

    // Add new reviews
    if (enriched.reviews) {
      for (const review of enriched.reviews) {
        await tx.insert(reviews).values({
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
        } as NewReview);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const config = parseArgs();
  verboseMode = config.verbose;

  console.log('\n════════════════════════════════════════');
  console.log('     AgentIndex Enrichment Pipeline');
  console.log('════════════════════════════════════════\n');

  log('info', `Focus: ${config.focus.join(', ')}`);
  log('info', `Max quality threshold: ${config.maxQuality}`);
  log('info', `Limit: ${config.limit}`);
  log('info', `Dry run: ${config.dryRun}`);

  // Select agents to enrich
  const agentsToEnrich = await selectAgentsToEnrich(config);

  if (agentsToEnrich.length === 0) {
    log('info', 'No agents found matching criteria');
    return;
  }

  log('info', `Found ${agentsToEnrich.length} agents to enrich`);

  if (config.dryRun) {
    console.log('\nAgents that would be enriched:');
    for (const agent of agentsToEnrich) {
      console.log(`  - ${agent.firstName} ${agent.lastName} (${agent.slug}) [quality: ${agent.currentQuality ?? 'N/A'}]`);
    }
    return;
  }

  // Process agents
  let enrichedCount = 0;
  let errorCount = 0;

  for (const agent of agentsToEnrich) {
    log('progress', `Enriching ${agent.firstName} ${agent.lastName}...`);

    const enriched = await enrichAgent(agent, config.focus);

    if (enriched) {
      await updateAgent(agent.id, enriched);
      enrichedCount++;
      log('info', `Updated ${agent.firstName} ${agent.lastName}: ${enriched.sales?.length || 0} sales, ${enriched.reviews?.length || 0} reviews`);
    } else {
      errorCount++;
    }

    // Small delay between agents
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\n════════════════════════════════════════');
  console.log('           Enrichment Complete');
  console.log('════════════════════════════════════════');
  console.log(`  Enriched: ${enrichedCount}`);
  console.log(`  Errors:   ${errorCount}`);
  console.log('════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('Fatal error:', error instanceof Error ? error.message : error);
  process.exit(1);
});

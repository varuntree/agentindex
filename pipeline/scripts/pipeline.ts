#!/usr/bin/env tsx
/**
 * AgentIndex Data Pipeline
 *
 * Uses Claude Agent SDK to research real estate agencies and agents.
 * Stores results in SQLite via Drizzle ORM.
 *
 * Usage:
 *   pnpm pipeline:run --location "Bondi Beach, NSW" --agencies "Ray White,McGrath"
 *   pnpm pipeline:run --location "Bondi Beach, NSW" --discover-agencies --limit 5
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../src/lib/db';
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
  buildAgencyResearchPrompt,
  buildSalesResearchPrompt,
  buildReviewResearchPrompt,
  type AgencyResearchTask,
  type AgentEnrichmentTask,
} from '../agents';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CLIArgs {
  location: string;
  agencies?: string[];
  discoverAgencies: boolean;
  limit: number;
  enrichSales: boolean;
  enrichReviews: boolean;
  dryRun: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    location: '',
    agencies: undefined,
    discoverAgencies: false,
    limit: 10,
    enrichSales: true,
    enrichReviews: true,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--location':
      case '-l':
        result.location = args[++i] || '';
        break;
      case '--agencies':
      case '-a':
        result.agencies = (args[++i] || '').split(',').map((s) => s.trim());
        break;
      case '--discover-agencies':
        result.discoverAgencies = true;
        break;
      case '--limit':
        result.limit = parseInt(args[++i] || '10', 10);
        break;
      case '--no-sales':
        result.enrichSales = false;
        break;
      case '--no-reviews':
        result.enrichReviews = false;
        break;
      case '--dry-run':
        result.dryRun = true;
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
AgentIndex Data Pipeline

Usage:
  pnpm pipeline:run --location "Suburb, STATE" [options]

Options:
  -l, --location <loc>     Target location (required)
  -a, --agencies <list>    Comma-separated agency names
  --discover-agencies      Auto-discover agencies in location
  --limit <n>              Max agencies to process (default: 10)
  --no-sales               Skip sales enrichment
  --no-reviews             Skip reviews enrichment
  --dry-run                Validate without saving to DB
  -h, --help               Show this help

Examples:
  pnpm pipeline:run --location "Bondi Beach, NSW" --agencies "Ray White,McGrath"
  pnpm pipeline:run --location "Surry Hills, NSW" --discover-agencies --limit 5
`);
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
// SDK helper to run query and extract result
// ---------------------------------------------------------------------------

interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function runQuery<T>(
  prompt: string,
  schema?: z.ZodSchema<T>
): Promise<QueryResult<T>> {
  try {
    let resultText = '';

    for await (const message of query({
      prompt,
      options: {
        allowedTools: ['WebSearch', 'WebFetch'],
        maxTurns: 10,
        maxBudgetUsd: 0.50,
      },
    })) {
      // Collect assistant messages
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

      // Check for result message
      if (message.type === 'result') {
        if (message.subtype === 'success' && message.result) {
          resultText = typeof message.result === 'string'
            ? message.result
            : JSON.stringify(message.result);
        } else if (message.subtype.startsWith('error')) {
          // Handle various error subtypes: error_during_execution, error_max_turns, etc.
          return {
            success: false,
            error: `Query failed: ${message.subtype}`,
          };
        }
      }
    }

    // Try to extract JSON from the result
    if (schema && resultText) {
      // Find JSON object or array in the text
      const jsonMatch = resultText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        const validated = schema.safeParse(parsed);
        if (validated.success) {
          return { success: true, data: validated.data };
        }
        return { success: false, error: `Validation failed: ${validated.error.message}` };
      }
    }

    // Return raw text if no schema
    return { success: true, data: resultText as unknown as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ---------------------------------------------------------------------------
// Agency discovery
// ---------------------------------------------------------------------------

const AgencyListSchema = z.array(z.string());

async function discoverAgencies(location: string, limit: number): Promise<string[]> {
  console.log(`Discovering agencies in ${location}...`);

  const prompt = `Find the top ${limit} real estate agencies in ${location}, Australia.

Search for major agencies like Ray White, McGrath, LJ Hooker, Belle Property, etc.
Also include local independent agencies operating in that area.

Return ONLY a JSON array of agency names (including the suburb in the name if relevant).
Example format: ["Ray White Bondi Beach", "McGrath Estate Agents Bondi Beach", "Belle Property Bondi"]

Do NOT include any explanation - just the JSON array.`;

  const result = await runQuery(prompt, AgencyListSchema);
  if (result.success && result.data) {
    console.log(`Found ${result.data.length} agencies`);
    return result.data.slice(0, limit);
  }

  console.error('Failed to discover agencies:', result.error);
  return [];
}

// ---------------------------------------------------------------------------
// Agency research
// ---------------------------------------------------------------------------

async function researchAgency(task: AgencyResearchTask): Promise<AgencyOutput | null> {
  console.log(`Researching agency: ${task.agencyName}...`);

  const result = await runQuery(buildAgencyResearchPrompt(task), AgencyOutputSchema);

  if (result.success && result.data) {
    console.log(`  Found ${result.data.agents.length} agents`);
    return result.data;
  }

  console.error(`  Research failed: ${result.error}`);
  return null;
}

// ---------------------------------------------------------------------------
// Agent enrichment (sales + reviews)
// ---------------------------------------------------------------------------

const SalesArraySchema = z.array(SaleOutputSchema);
const ReviewsArraySchema = z.array(ReviewOutputSchema);

async function enrichAgentSales(task: AgentEnrichmentTask): Promise<SaleOutput[]> {
  console.log(`  Fetching sales for ${task.agentName}...`);

  const result = await runQuery(buildSalesResearchPrompt(task), SalesArraySchema);

  if (result.success && result.data) {
    console.log(`    Found ${result.data.length} sales`);
    return result.data;
  }

  console.error(`    Sales fetch failed: ${result.error}`);
  return [];
}

async function enrichAgentReviews(task: AgentEnrichmentTask): Promise<ReviewOutput[]> {
  console.log(`  Fetching reviews for ${task.agentName}...`);

  const result = await runQuery(buildReviewResearchPrompt(task), ReviewsArraySchema);

  if (result.success && result.data) {
    console.log(`    Found ${result.data.length} reviews`);
    return result.data;
  }

  console.error(`    Reviews fetch failed: ${result.error}`);
  return [];
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

async function storeAgency(
  agencyData: AgencyOutput,
  config: CLIArgs
): Promise<{ agencyId: number; agentCount: number; salesCount: number; reviewCount: number }> {
  const agencySlug = generateSlug(agencyData.name, agencyData.suburb);

  // Upsert agency
  const agencyValues: NewAgency = {
    slug: agencySlug,
    name: agencyData.name,
    brandName: agencyData.brandName,
    logoUrl: agencyData.logoUrl,
    websiteUrl: agencyData.websiteUrl,
    phone: agencyData.phone,
    email: agencyData.email,
    streetAddress: agencyData.streetAddress,
    suburb: agencyData.suburb,
    state: agencyData.state,
    postcode: agencyData.postcode,
    lat: agencyData.lat,
    lng: agencyData.lng,
    description: agencyData.description,
    sourceUrl: agencyData.sourceUrl,
    totalAgents: agencyData.agents.length,
    lastScrapedAt: new Date(),
  };

  // Check if agency exists
  const existing = await db
    .select()
    .from(agencies)
    .where(eq(agencies.slug, agencySlug))
    .limit(1);

  let agencyId: number;
  if (existing.length > 0) {
    await db.update(agencies).set(agencyValues).where(eq(agencies.slug, agencySlug));
    agencyId = existing[0].id;
    console.log(`  Updated agency: ${agencyData.name} (id=${agencyId})`);
  } else {
    const [inserted] = await db.insert(agencies).values(agencyValues).returning();
    agencyId = inserted.id;
    console.log(`  Created agency: ${agencyData.name} (id=${agencyId})`);
  }

  // Store agents
  let totalSales = 0;
  let totalReviews = 0;

  for (const agentData of agencyData.agents) {
    const { salesCount, reviewCount } = await storeAgent(
      agentData,
      agencyId,
      agencyData.name,
      `${agencyData.suburb}, ${agencyData.state}`,
      config
    );
    totalSales += salesCount;
    totalReviews += reviewCount;
  }

  // Update agency stats
  await db
    .update(agencies)
    .set({
      totalAgents: agencyData.agents.length,
      totalSalesCount: totalSales,
    })
    .where(eq(agencies.id, agencyId));

  return {
    agencyId,
    agentCount: agencyData.agents.length,
    salesCount: totalSales,
    reviewCount: totalReviews,
  };
}

async function storeAgent(
  agentData: AgentOutput,
  agencyId: number,
  agencyName: string,
  agencyLocation: string,
  config: CLIArgs
): Promise<{ agentId: number; salesCount: number; reviewCount: number }> {
  const fullName = `${agentData.firstName} ${agentData.lastName}`;
  const agentSlug = generateSlug(agentData.firstName, agentData.lastName, agencyName);

  // Enrich with sales and reviews if configured
  let salesData: SaleOutput[] = [];
  let reviewsData: ReviewOutput[] = [];

  if (config.enrichSales) {
    salesData = await enrichAgentSales({
      agentName: fullName,
      agencyName,
      agencyLocation,
    });
  }

  if (config.enrichReviews) {
    reviewsData = await enrichAgentReviews({
      agentName: fullName,
      agencyName,
      agencyLocation,
    });
  }

  // Calculate metrics
  const qualityScore = calculateAgentQualityScore({
    ...agentData,
    sales: salesData,
    reviews: reviewsData,
  });
  const avgRating = calculateAverageRating(reviewsData);
  const totalSalesValue = salesData.reduce(
    (sum, s) => sum + (s.salePrice || 0),
    0
  );
  const medianPrice = calculateMedian(
    salesData.filter((s) => s.salePrice).map((s) => s.salePrice!)
  );

  // Prepare agent record
  const agentValues: NewAgent = {
    slug: agentSlug,
    firstName: agentData.firstName,
    lastName: agentData.lastName,
    fullName,
    email: agentData.email,
    phone: agentData.phone,
    mobilePhone: agentData.mobilePhone,
    photoUrl: agentData.photoUrl,
    licenseNumber: agentData.licenseNumber,
    licenseStatus: agentData.licenseStatus,
    licenseState: agentData.licenseState,
    agencyId,
    bio: agentData.bio,
    yearsActive: agentData.yearsActive,
    languagesSpoken: agentData.languagesSpoken
      ? JSON.stringify(agentData.languagesSpoken)
      : null,
    specializations: agentData.specializations
      ? JSON.stringify(agentData.specializations)
      : null,
    suburbsServiced: agentData.suburbsServiced
      ? JSON.stringify(agentData.suburbsServiced)
      : null,
    totalSalesCount: salesData.length,
    totalSalesVolume: totalSalesValue,
    medianSalePrice: medianPrice,
    ratingsAverage: avgRating,
    ratingsCount: reviewsData.length,
    dataQualityScore: qualityScore,
    sourceUrl: agentData.sourceUrl,
    lastScrapedAt: new Date(),
  };

  // Upsert agent
  const existingAgent = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, agentSlug))
    .limit(1);

  let agentId: number;
  if (existingAgent.length > 0) {
    await db.update(agents).set(agentValues).where(eq(agents.slug, agentSlug));
    agentId = existingAgent[0].id;
    console.log(`    Updated agent: ${fullName} (id=${agentId})`);
  } else {
    const [inserted] = await db.insert(agents).values(agentValues).returning();
    agentId = inserted.id;
    console.log(`    Created agent: ${fullName} (id=${agentId})`);
  }

  // Link agent to suburbs
  await linkAgentToSuburbs(agentId, agentData.suburbsServiced);

  // Store sales
  for (const sale of salesData) {
    await storeSale(sale, agentId, agencyId);
  }

  // Store reviews
  for (const review of reviewsData) {
    await storeReview(review, agentId);
  }

  return { agentId, salesCount: salesData.length, reviewCount: reviewsData.length };
}

async function linkAgentToSuburbs(
  agentId: number,
  suburbNames: string[]
): Promise<void> {
  // Delete existing links
  await db.delete(agentSuburbs).where(eq(agentSuburbs.agentId, agentId));

  for (const suburbName of suburbNames) {
    // Find suburb in database
    const [suburb] = await db
      .select()
      .from(suburbs)
      .where(
        sql`LOWER(${suburbs.name}) = LOWER(${suburbName})`
      )
      .limit(1);

    if (suburb) {
      await db.insert(agentSuburbs).values({
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
  agencyId: number
): Promise<void> {
  // Check for duplicate (same address + date)
  const existingSale = await db
    .select()
    .from(sales)
    .where(
      sql`${sales.agentId} = ${agentId} AND LOWER(${sales.propertyAddress}) = LOWER(${sale.propertyAddress})`
    )
    .limit(1);

  if (existingSale.length > 0) {
    return; // Skip duplicate
  }

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

  await db.insert(sales).values(saleValues);
}

async function storeReview(review: ReviewOutput, agentId: number): Promise<void> {
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

  await db.insert(reviews).values(reviewValues);
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Main pipeline execution
// ---------------------------------------------------------------------------

async function runPipeline(config: CLIArgs): Promise<void> {
  console.log('\n========================================');
  console.log('AgentIndex Data Pipeline');
  console.log('========================================\n');

  if (!config.location) {
    console.error('Error: --location is required');
    printHelp();
    process.exit(1);
  }

  console.log(`Location: ${config.location}`);
  console.log(`Dry run: ${config.dryRun}`);
  console.log(`Enrich sales: ${config.enrichSales}`);
  console.log(`Enrich reviews: ${config.enrichReviews}`);
  console.log('');

  const stats: PipelineStats = {
    agenciesFound: 0,
    agentsFound: 0,
    salesFound: 0,
    reviewsFound: 0,
    errors: [],
  };

  // Create pipeline run record
  let runId: number | null = null;
  if (!config.dryRun) {
    runId = await createPipelineRun(config.location);
    console.log(`Pipeline run ID: ${runId}\n`);
  }

  try {
    // Get agencies to research
    let agencyNames = config.agencies || [];
    if (config.discoverAgencies || agencyNames.length === 0) {
      agencyNames = await discoverAgencies(config.location, config.limit);
    }

    if (agencyNames.length === 0) {
      throw new Error('No agencies to research');
    }

    console.log(`\nProcessing ${agencyNames.length} agencies...\n`);

    // Research each agency
    for (const agencyName of agencyNames) {
      try {
        const agencyData = await researchAgency({
          agencyName,
          location: config.location,
        });

        if (agencyData) {
          if (config.dryRun) {
            console.log(`  [DRY RUN] Would store: ${agencyData.name}`);
            console.log(`    Agents: ${agencyData.agents.length}`);
            stats.agenciesFound++;
            stats.agentsFound += agencyData.agents.length;
          } else {
            const result = await storeAgency(agencyData, config);
            stats.agenciesFound++;
            stats.agentsFound += result.agentCount;
            stats.salesFound += result.salesCount;
            stats.reviewsFound += result.reviewCount;
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`Failed to process ${agencyName}: ${msg}`);
        stats.errors.push(`${agencyName}: ${msg}`);
      }

      // Small delay between agencies
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Print summary
    console.log('\n========================================');
    console.log('Pipeline Complete');
    console.log('========================================');
    console.log(`Agencies: ${stats.agenciesFound}`);
    console.log(`Agents: ${stats.agentsFound}`);
    console.log(`Sales: ${stats.salesFound}`);
    console.log(`Reviews: ${stats.reviewsFound}`);
    if (stats.errors.length > 0) {
      console.log(`Errors: ${stats.errors.length}`);
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
  console.error('Pipeline failed:', error);
  process.exit(1);
});

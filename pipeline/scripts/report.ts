#!/usr/bin/env npx tsx
/**
 * Generate report from pipeline run
 * Usage: pnpm pipeline:report --run-id <id>
 */
import { db } from '../../src/lib/db';
import { pipelineRuns } from '../../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);
const runIdIdx = args.findIndex(a => a === '--run-id');
const helpIdx = args.findIndex(a => a === '--help' || a === '-h');

if (helpIdx !== -1) {
  console.log(`
Usage: pnpm pipeline:report --run-id <id>

Generates a report from a previous pipeline run.

Options:
  --run-id <id>  Pipeline run ID (required)
  -h, --help     Show this help message
`);
  process.exit(0);
}

if (runIdIdx === -1 || !args[runIdIdx + 1]) {
  console.error('Error: --run-id <id> is required');
  process.exit(1);
}

const runId = parseInt(args[runIdIdx + 1], 10);

if (isNaN(runId)) {
  console.error('Error: --run-id must be a valid number');
  process.exit(1);
}

async function main() {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, runId),
  });

  if (!run) {
    console.error(`Run not found: ${runId}`);
    process.exit(1);
  }

  console.log('\n=== Pipeline Run Report ===\n');
  console.log(`Run ID: ${run.id}`);
  console.log(`Status: ${run.status}`);
  console.log(`Model: ${run.agentModel || 'N/A'}`);
  console.log(`Target Location: ${run.targetLocation || 'N/A'}`);
  console.log(`Started: ${run.startedAt}`);
  console.log(`Completed: ${run.completedAt || 'In progress'}`);

  console.log(`\nStats:`);
  console.log(`  Agencies found: ${run.agenciesFound || 0}`);
  console.log(`  Agents found: ${run.agentsFound || 0}`);
  console.log(`  Sales found: ${run.salesFound || 0}`);
  console.log(`  Reviews found: ${run.reviewsFound || 0}`);
  console.log(`  Total cost (USD): $${(run.totalCostUsd || 0).toFixed(4)}`);

  if (run.errorLog) {
    console.log(`\nErrors:`);
    console.log(run.errorLog);
  }
}

main().catch(console.error);

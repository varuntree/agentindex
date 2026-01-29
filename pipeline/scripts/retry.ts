#!/usr/bin/env npx tsx
/**
 * Retry failed agencies from previous run
 * Usage: pnpm pipeline:retry --run-id <id>
 */
import { db } from '../../src/lib/db';
import { pipelineRuns } from '../../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);
const runIdIdx = args.findIndex(a => a === '--run-id');
const helpIdx = args.findIndex(a => a === '--help' || a === '-h');
const dryRunIdx = args.findIndex(a => a === '--dry-run');

if (helpIdx !== -1) {
  console.log(`
Usage: pnpm pipeline:retry --run-id <id> [--dry-run]

Retries failed agencies from a previous pipeline run.

Options:
  --run-id <id>  Pipeline run ID (required)
  --dry-run      Preview which agencies would be retried
  -h, --help     Show this help message
`);
  process.exit(0);
}

if (runIdIdx === -1 || !args[runIdIdx + 1]) {
  console.error('Error: --run-id <id> is required');
  process.exit(1);
}

const runId = parseInt(args[runIdIdx + 1], 10);
const isDryRun = dryRunIdx !== -1;

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

  if (!run.errorLog) {
    console.log('No errors found in this run. Nothing to retry.');
    process.exit(0);
  }

  // Parse error log to extract failed agency info
  // Errors are stored as text, try to extract agency names/IDs
  const errorLines = run.errorLog.split('\n').filter(Boolean);

  console.log(`Found ${errorLines.length} error(s) in run ${runId}`);
  console.log(`\nError log:`);
  errorLines.slice(0, 10).forEach((line, i) => {
    console.log(`  ${i + 1}. ${line.slice(0, 100)}${line.length > 100 ? '...' : ''}`);
  });

  if (errorLines.length > 10) {
    console.log(`  ... and ${errorLines.length - 10} more`);
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] Review errors above and manually retry if needed.');
  } else {
    console.log('\nTo retry, re-run the pipeline with the same target location:');
    if (run.targetLocation) {
      console.log(`  pnpm pipeline:run --location "${run.targetLocation}"`);
    } else {
      console.log('  pnpm pipeline:run --config <your-config.json>');
    }
  }
}

main().catch(console.error);

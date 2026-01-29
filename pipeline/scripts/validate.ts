#!/usr/bin/env npx tsx
/**
 * Validate pipeline config without executing
 * Usage: pnpm pipeline:validate --config pipeline-config.json
 */
import { loadPipelineConfig } from '../config/schema';

const args = process.argv.slice(2);
const configIdx = args.findIndex(a => a === '--config' || a === '-c');
const helpIdx = args.findIndex(a => a === '--help' || a === '-h');

if (helpIdx !== -1) {
  console.log(`
Usage: pnpm pipeline:validate --config <path>

Validates a pipeline configuration file against the schema.

Options:
  -c, --config <path>  Path to pipeline-config.json (required)
  -h, --help           Show this help message
`);
  process.exit(0);
}

if (configIdx === -1 || !args[configIdx + 1]) {
  console.error('Error: --config <path> is required');
  process.exit(1);
}

const configPath = args[configIdx + 1];

try {
  const config = loadPipelineConfig(configPath);
  console.log('✓ Config is valid');
  console.log(`  Locations: ${config.locations.length}`);
  console.log(`  Agencies mode: ${config.agencies.mode}`);
  console.log(`  Enrichment: licenses=${config.enrichment.licenses}, sales=${config.enrichment.sales}, reviews=${config.enrichment.reviews}`);
  process.exit(0);
} catch (err) {
  console.error('✗ Config validation failed:');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

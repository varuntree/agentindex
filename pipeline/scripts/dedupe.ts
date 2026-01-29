#!/usr/bin/env npx tsx
/**
 * Clean duplicate records
 * Usage: pnpm pipeline:dedupe [--dry-run|--execute]
 */
import { db, sqliteDb } from '../../src/lib/db';
import { agents, sales } from '../../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);
const helpIdx = args.findIndex(a => a === '--help' || a === '-h');
const executeIdx = args.findIndex(a => a === '--execute');

if (helpIdx !== -1) {
  console.log(`
Usage: pnpm pipeline:dedupe [--dry-run|--execute]

Finds and removes duplicate records.

Options:
  --dry-run   Preview duplicates without making changes (default)
  --execute   Actually remove duplicates
  -h, --help  Show this help message
`);
  process.exit(0);
}

const shouldExecute = executeIdx !== -1;

interface DupeRow {
  name: string;
  agencyId: number | null;
  count: number;
  ids: string;
}

interface SaleDupeRow {
  address: string;
  saleDate: string | null;
  count: number;
  ids: string;
}

function findDuplicateAgents(): DupeRow[] {
  // Find agents with same fullName + agencyId
  const stmt = sqliteDb.prepare(`
    SELECT full_name as name, agency_id as agencyId, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM agents
    GROUP BY full_name, agency_id
    HAVING count > 1
  `);
  return stmt.all() as DupeRow[];
}

function findDuplicateSales(): SaleDupeRow[] {
  // Find sales with same address + saleDate
  const stmt = sqliteDb.prepare(`
    SELECT property_address as address, sale_date as saleDate, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM sales
    GROUP BY property_address, sale_date
    HAVING count > 1
  `);
  return stmt.all() as SaleDupeRow[];
}

async function main() {
  console.log(shouldExecute ? 'Deduplication (EXECUTE mode)' : 'Deduplication (DRY RUN)');
  console.log('=========================================\n');

  const dupeAgents = findDuplicateAgents();
  console.log(`Duplicate agents: ${dupeAgents.length} groups`);
  dupeAgents.slice(0, 5).forEach(d => {
    console.log(`  - "${d.name}": ${d.count} copies`);
  });
  if (dupeAgents.length > 5) {
    console.log(`  ... and ${dupeAgents.length - 5} more groups`);
  }

  const dupeSales = findDuplicateSales();
  console.log(`\nDuplicate sales: ${dupeSales.length} groups`);
  dupeSales.slice(0, 5).forEach(d => {
    console.log(`  - "${d.address}" on ${d.saleDate || 'unknown'}: ${d.count} copies`);
  });
  if (dupeSales.length > 5) {
    console.log(`  ... and ${dupeSales.length - 5} more groups`);
  }

  if (!shouldExecute) {
    console.log('\nRun with --execute to remove duplicates');
    return;
  }

  // Execute deduplication
  let agentsRemoved = 0;
  for (const dupe of dupeAgents) {
    const ids = dupe.ids.split(',').map(Number);
    const keepId = ids[0]; // Keep first, remove rest
    for (const id of ids.slice(1)) {
      await db.delete(agents).where(eq(agents.id, id));
      agentsRemoved++;
    }
  }

  let salesRemoved = 0;
  for (const dupe of dupeSales) {
    const ids = dupe.ids.split(',').map(Number);
    const keepId = ids[0];
    for (const id of ids.slice(1)) {
      await db.delete(sales).where(eq(sales.id, id));
      salesRemoved++;
    }
  }

  console.log(`\n✓ Removed ${agentsRemoved} duplicate agents`);
  console.log(`✓ Removed ${salesRemoved} duplicate sales`);
}

main().catch(console.error);

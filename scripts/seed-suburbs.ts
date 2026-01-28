/**
 * Seed suburbs table from Matthew Proctor Australian postcodes CSV.
 * Run: pnpm pipeline:suburbs
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { suburbs } from "../src/lib/db/schema";
import { generateSuburbSlug } from "../src/lib/utils/slug";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CSV_URL =
  "https://www.matthewproctor.com/Content/postcodes/australian_postcodes.csv";
const DATA_DIR = path.resolve("./data");
const CSV_PATH = path.join(DATA_DIR, "australian_postcodes.csv");
const DB_PATH = "./data/agentindex.db";
const BATCH_SIZE = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Title-case a string: "BONDI BEACH" -> "Bondi Beach" */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Download a file via fetch, following redirects automatically. */
async function downloadCSV(): Promise<void> {
  if (fs.existsSync(CSV_PATH)) {
    console.log(`CSV already exists at ${CSV_PATH}, skipping download.`);
    return;
  }

  console.log(`Downloading CSV from ${CSV_URL} ...`);
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CSV_PATH, buffer);
  console.log(`Saved ${buffer.length} bytes to ${CSV_PATH}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Download CSV if needed
  await downloadCSV();

  // 2. Parse CSV
  console.log("Parsing CSV...");
  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`Parsed ${records.length} rows from CSV.`);

  // 3. Map to suburb insert objects
  const now = new Date();
  const rows = records.map((r) => {
    const name = toTitleCase(r["locality"] ?? "");
    const state = (r["state"] ?? "").toUpperCase();
    const postcode = r["postcode"] ?? "";

    // Prefer precise coords, fall back to standard
    const latStr = r["Lat_precise"] || r["lat"] || "";
    const lngStr = r["Long_precise"] || r["long"] || "";
    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;

    const localGovernmentArea = r["Local Government Area"] || null;
    const stateElectorate = r["State Electorate"] || null;

    const slug = generateSuburbSlug(name, state);

    return {
      slug,
      name,
      state,
      postcode,
      lat: lat !== null && !isNaN(lat) ? lat : null,
      lng: lng !== null && !isNaN(lng) ? lng : null,
      localGovernmentArea,
      stateElectorate,
      createdAt: now,
      updatedAt: now,
    };
  });

  // 4. Connect to DB
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);

  // 5. Batch insert with onConflictDoNothing on slug
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = db
      .insert(suburbs)
      .values(batch)
      .onConflictDoNothing({ target: suburbs.slug })
      .run();
    inserted += result.changes;
    console.log(
      `Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${result.changes} rows`
    );
  }

  console.log(`Done. Total inserted: ${inserted} / ${rows.length} rows.`);

  // 6. Cleanup
  sqlite.close();
}

main().catch((err) => {
  console.error("seed-suburbs failed:", err);
  process.exit(1);
});

/**
 * Pipeline Storage Module
 *
 * Handles storing agencies, agents, sales, and reviews to SQLite database.
 * Handles duplicates gracefully.
 */

import slugify from 'slugify';
import { sqliteDb } from '@/lib/db';
import type { AgencyBasic, EnrichedAgent, SaleOutput, ReviewOutput } from './types';
import type { Agency, Agent, NewAgent, NewAgency, NewSale, NewReview, NewAgentSuburb } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// Slug Generation
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
}

function generateAgentSlug(firstName: string, lastName: string): string {
  return generateSlug(`${firstName} ${lastName}`);
}

function generateAgentSlugForAgency(baseSlug: string, agencyId: number, attempt?: number): string {
  const suffix = attempt && attempt > 0 ? `-${agencyId}-${attempt}` : `-${agencyId}`;
  return `${baseSlug}${suffix}`;
}

// ---------------------------------------------------------------------------
// Agency Storage
// ---------------------------------------------------------------------------

export async function storeAgency(agency: AgencyBasic): Promise<Agency> {
  const slug = generateSlug(agency.name);

  // Check for existing
  const existing = sqliteDb
    .prepare(`SELECT * FROM agencies WHERE slug = ? LIMIT 1`)
    .get(slug) as Agency | undefined;

  if (existing) {
    // Update existing agency
    sqliteDb
      .prepare(
        `UPDATE agencies SET
          name = ?,
          brand_name = ?,
          logo_url = ?,
          website_url = ?,
          phone = ?,
          email = ?,
          street_address = ?,
          suburb = ?,
          state = ?,
          postcode = ?,
          updated_at = ?
        WHERE id = ?`
      )
      .run(
        agency.name,
        agency.brandName ?? null,
        agency.logoUrl ?? null,
        agency.websiteUrl ?? null,
        agency.phone ?? null,
        agency.email ?? null,
        agency.streetAddress ?? null,
        agency.suburb,
        agency.state,
        agency.postcode,
        Date.now(),
        existing.id
      );

    return { ...existing, ...agency, id: existing.id } as Agency;
  }

  // Insert new agency
  const result = sqliteDb
    .prepare(
      `INSERT INTO agencies (
        slug, name, brand_name, logo_url, website_url, phone, email,
        street_address, suburb, state, postcode, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      agency.name,
      agency.brandName ?? null,
      agency.logoUrl ?? null,
      agency.websiteUrl ?? null,
      agency.phone ?? null,
      agency.email ?? null,
      agency.streetAddress ?? null,
      agency.suburb,
      agency.state,
      agency.postcode,
      Date.now(),
      Date.now()
    );

  return {
    id: Number(result.lastInsertRowid),
    slug,
    name: agency.name,
    brandName: agency.brandName ?? null,
    logoUrl: agency.logoUrl ?? null,
    websiteUrl: agency.websiteUrl ?? null,
    phone: agency.phone ?? null,
    email: agency.email ?? null,
    streetAddress: agency.streetAddress ?? null,
    suburb: agency.suburb,
    state: agency.state,
    postcode: agency.postcode,
  } as Agency;
}

// ---------------------------------------------------------------------------
// Agent Storage
// ---------------------------------------------------------------------------

export async function storeAgent(
  enriched: EnrichedAgent,
  agencyId: number,
  primarySuburb: { id: number; name: string; state: string } | null
): Promise<Agent> {
  const fullName = `${enriched.firstName} ${enriched.lastName}`;
  const baseSlug = generateAgentSlug(enriched.firstName, enriched.lastName);

  // Resolve slug collisions across agencies:
  // - keep baseSlug for existing agents in the same agency
  // - if baseSlug exists for a different agency, suffix with agencyId
  let slug = baseSlug;
  const existingForBase = sqliteDb
    .prepare(`SELECT id, agency_id as agencyId FROM agents WHERE slug = ? LIMIT 1`)
    .get(baseSlug) as { id: number; agencyId: number | null } | undefined;

  if (existingForBase && existingForBase.agencyId && existingForBase.agencyId !== agencyId) {
    let attempt = 0;
    while (attempt < 10) {
      const candidate = generateAgentSlugForAgency(baseSlug, agencyId, attempt === 0 ? undefined : attempt);
      const exists = sqliteDb
        .prepare(`SELECT id FROM agents WHERE slug = ? LIMIT 1`)
        .get(candidate) as { id: number } | undefined;
      if (!exists) {
        slug = candidate;
        break;
      }
      attempt++;
    }
  }

  // Check for existing
  const existing = sqliteDb
    .prepare(`SELECT * FROM agents WHERE slug = ? LIMIT 1`)
    .get(slug) as Agent | undefined;

  let agentId: number;

  if (existing) {
    // Update existing agent
    sqliteDb
      .prepare(
        `UPDATE agents SET
          first_name = ?,
          last_name = ?,
          full_name = ?,
          email = ?,
          phone = ?,
          photo_url = ?,
          bio = ?,
          years_active = ?,
          languages_spoken = ?,
          specializations = ?,
          suburbs_serviced = ?,
          agency_id = ?,
          updated_at = ?
        WHERE id = ?`
      )
      .run(
        enriched.firstName,
        enriched.lastName,
        fullName,
        enriched.email ?? null,
        enriched.phone ?? null,
        enriched.photoUrl ?? null,
        enriched.bio ?? null,
        enriched.yearsActive ?? null,
        JSON.stringify(enriched.languagesSpoken ?? []),
        JSON.stringify(enriched.specializations ?? []),
        JSON.stringify(enriched.suburbsServiced ?? []),
        agencyId,
        Date.now(),
        existing.id
      );

    agentId = existing.id;
  } else {
    // Insert new agent
    const result = sqliteDb
      .prepare(
        `INSERT INTO agents (
          slug, first_name, last_name, full_name, email, phone, photo_url,
          bio, years_active, languages_spoken, specializations, suburbs_serviced,
          agency_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        slug,
        enriched.firstName,
        enriched.lastName,
        fullName,
        enriched.email ?? null,
        enriched.phone ?? null,
        enriched.photoUrl ?? null,
        enriched.bio ?? null,
        enriched.yearsActive ?? null,
        JSON.stringify(enriched.languagesSpoken ?? []),
        JSON.stringify(enriched.specializations ?? []),
        JSON.stringify(enriched.suburbsServiced ?? []),
        agencyId,
        Date.now(),
        Date.now()
      );

    agentId = Number(result.lastInsertRowid);
  }

  // Store agent-suburb relationship if we have a matched suburb
  if (primarySuburb) {
    await upsertAgentSuburb(agentId, primarySuburb.id, true);
  }

  // Store sales
  if (enriched.sales && enriched.sales.length > 0) {
    for (const sale of enriched.sales) {
      await storeSale(sale, agentId, agencyId, primarySuburb);
    }
  }

  // Store reviews
  if (enriched.reviews && enriched.reviews.length > 0) {
    for (const review of enriched.reviews) {
      await storeReview(review, agentId);
    }
  }

  // Update agent stats
  await updateAgentStats(agentId);

  // Update agency stats
  await updateAgencyStats(agencyId);

  return {
    id: agentId,
    slug,
    firstName: enriched.firstName,
    lastName: enriched.lastName,
    fullName,
  } as Agent;
}

// ---------------------------------------------------------------------------
// Agent Suburb Relationship
// ---------------------------------------------------------------------------

async function upsertAgentSuburb(
  agentId: number,
  suburbId: number,
  isPrimary: boolean
): Promise<void> {
  // Check if relationship already exists
  const existing = sqliteDb
    .prepare(`SELECT id FROM agent_suburbs WHERE agent_id = ? AND suburb_id = ? LIMIT 1`)
    .get(agentId, suburbId);

  if (existing) {
    // Ensure primary flag is set if requested
    sqliteDb
      .prepare(
        `UPDATE agent_suburbs SET is_primary = ? WHERE agent_id = ? AND suburb_id = ?`
      )
      .run(isPrimary ? 1 : 0, agentId, suburbId);
    return;
  }

  // Insert new relationship
  sqliteDb
    .prepare(
      `INSERT INTO agent_suburbs (agent_id, suburb_id, is_primary, sales_count) VALUES (?, ?, ?, ?)`
    )
    .run(agentId, suburbId, isPrimary ? 1 : 0, 0);
}

async function incrementAgentSuburbSalesCount(agentId: number, suburbId: number, delta: number): Promise<void> {
  sqliteDb
    .prepare(`UPDATE agent_suburbs SET sales_count = COALESCE(sales_count, 0) + ? WHERE agent_id = ? AND suburb_id = ?`)
    .run(delta, agentId, suburbId);
}

// ---------------------------------------------------------------------------
// Sale Storage
// ---------------------------------------------------------------------------

async function storeSale(
  sale: SaleOutput,
  agentId: number,
  agencyId: number,
  primarySuburb: { id: number; name: string; state: string } | null
): Promise<void> {
  // Check for duplicate (same address and date)
  const existing = sqliteDb
    .prepare(
      `SELECT id FROM sales WHERE agent_id = ? AND property_address = ? AND sale_date = ? LIMIT 1`
    )
    .get(agentId, sale.propertyAddress, sale.saleDate ?? null);

  if (existing) return; // Skip duplicate

  sqliteDb
    .prepare(
      `INSERT INTO sales (
        agent_id, agency_id, property_address, suburb, state, postcode,
        property_type, sale_price, sale_date, bedrooms, bathrooms, car_spaces, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      agentId,
      agencyId,
      sale.propertyAddress,
      sale.suburb ?? null,
      sale.state ?? null,
      sale.postcode ?? null,
      sale.propertyType ?? null,
      sale.salePrice ?? null,
      sale.saleDate ?? null,
      sale.bedrooms ?? null,
      sale.bathrooms ?? null,
      sale.carSpaces ?? null,
      Date.now()
    );

  // If sale suburb matches the primary suburb, increment per-suburb sales count
  if (
    primarySuburb &&
    sale.suburb &&
    sale.suburb.trim().toLowerCase() === primarySuburb.name.trim().toLowerCase()
  ) {
    await incrementAgentSuburbSalesCount(agentId, primarySuburb.id, 1);
  }
}

// ---------------------------------------------------------------------------
// Review Storage
// ---------------------------------------------------------------------------

async function storeReview(review: ReviewOutput, agentId: number): Promise<void> {
  // Check for duplicate (same reviewer and date)
  const existing = sqliteDb
    .prepare(
      `SELECT id FROM reviews WHERE agent_id = ? AND reviewer_name = ? AND review_date = ? LIMIT 1`
    )
    .get(agentId, review.reviewerName ?? 'Anonymous', review.reviewDate ?? null);

  if (existing) return; // Skip duplicate

  sqliteDb
    .prepare(
      `INSERT INTO reviews (
        agent_id, reviewer_name, review_date, overall_rating, review_text, source_platform, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      agentId,
      review.reviewerName ?? 'Anonymous',
      review.reviewDate ?? null,
      review.overallRating,
      review.reviewText ?? null,
      review.sourcePlatform ?? null,
      Date.now()
    );
}

// ---------------------------------------------------------------------------
// Stats Updates
// ---------------------------------------------------------------------------

async function updateAgentStats(agentId: number): Promise<void> {
  // Calculate sales stats
  const salesStats = sqliteDb
    .prepare(
      `SELECT
        COUNT(*) as total_sales,
        SUM(sale_price) as total_volume,
        AVG(sale_price) as avg_price
      FROM sales WHERE agent_id = ? AND sale_price IS NOT NULL`
    )
    .get(agentId) as { total_sales: number; total_volume: number | null; avg_price: number | null };

  // Calculate median sale price
  const prices = sqliteDb
    .prepare(`SELECT sale_price FROM sales WHERE agent_id = ? AND sale_price IS NOT NULL ORDER BY sale_price`)
    .all(agentId) as { sale_price: number }[];

  let medianPrice: number | null = null;
  if (prices.length > 0) {
    const mid = Math.floor(prices.length / 2);
    medianPrice =
      prices.length % 2 !== 0
        ? prices[mid].sale_price
        : (prices[mid - 1].sale_price + prices[mid].sale_price) / 2;
  }

  // Calculate review stats
  const reviewStats = sqliteDb
    .prepare(
      `SELECT
        COUNT(*) as review_count,
        AVG(overall_rating) as avg_rating
      FROM reviews WHERE agent_id = ?`
    )
    .get(agentId) as { review_count: number; avg_rating: number | null };

  // Update agent
  sqliteDb
    .prepare(
      `UPDATE agents SET
        total_sales_count = ?,
        total_sales_volume = ?,
        median_sale_price = ?,
        ratings_count = ?,
        ratings_average = ?,
        updated_at = ?
      WHERE id = ?`
    )
    .run(
      salesStats.total_sales,
      salesStats.total_volume ?? 0,
      medianPrice,
      reviewStats.review_count,
      reviewStats.avg_rating ? Math.round(reviewStats.avg_rating * 10) / 10 : null,
      Date.now(),
      agentId
    );
}

async function updateAgencyStats(agencyId: number): Promise<void> {
  // Count agents
  const agentCount = sqliteDb
    .prepare(`SELECT COUNT(*) as cnt FROM agents WHERE agency_id = ?`)
    .get(agencyId) as { cnt: number };

  // Calculate sales stats from all agents
  const salesStats = sqliteDb
    .prepare(
      `SELECT
        COUNT(*) as total_sales,
        SUM(sale_price) as total_volume
      FROM sales WHERE agency_id = ? AND sale_price IS NOT NULL`
    )
    .get(agencyId) as { total_sales: number; total_volume: number | null };

  // Update agency
  sqliteDb
    .prepare(
      `UPDATE agencies SET
        total_agents = ?,
        total_sales_count = ?,
        total_sales_volume = ?,
        updated_at = ?
      WHERE id = ?`
    )
    .run(
      agentCount.cnt,
      salesStats.total_sales,
      salesStats.total_volume ?? 0,
      Date.now(),
      agencyId
    );
}

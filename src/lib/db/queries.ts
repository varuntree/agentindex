import { eq, and, desc, asc, count, inArray } from "drizzle-orm";
import { db, sqliteDb } from "./index";
import {
  agents,
  agencies,
  suburbs,
  sales,
  reviews,
  type Agent,
  type Agency,
  type Suburb,
  type AgentWithRelations,
  type AgencyWithAgents,
} from "./schema";

// ---------------------------------------------------------------------------
// Result types for search
// ---------------------------------------------------------------------------
export type SearchResult = {
  type: "agent" | "agency" | "suburb";
  slug: string;
  label: string;
  sublabel: string;
};

export type AutocompleteResult = {
  type: "agent" | "agency" | "suburb";
  slug: string;
  label: string;
};

// ===========================================================================
// Agent queries
// ===========================================================================

export async function getAgentBySlug(
  slug: string
): Promise<AgentWithRelations | null> {
  const result = db.query.agents
    .findFirst({
      where: eq(agents.slug, slug),
      with: {
        agency: true,
        agentSuburbs: {
          with: {
            suburb: true,
          },
        },
        sales: {
          limit: 20,
          orderBy: [desc(sales.saleDate)],
        },
        reviews: {
          limit: 10,
          orderBy: [desc(reviews.reviewDate)],
        },
      },
    })
    .sync();

  if (!result) return null;

  return {
    ...result,
    agency: result.agency ?? null,
    suburbs: result.agentSuburbs,
  } as unknown as AgentWithRelations;
}

export async function getAgentsList(filters: {
  suburb?: string;
  agency?: string;
  state?: string;
  propertyType?: string;
  sort?: "rating" | "sales" | "name" | "quality";
  page?: number;
  limit?: number;
}): Promise<{ agents: Agent[]; total: number }> {
  const pageSize = Math.min(filters.limit ?? 20, 50);
  const page = filters.page ?? 1;
  const offset = (page - 1) * pageSize;

  // Build WHERE clauses
  const whereClauses: string[] = ["1=1"];
  const params: (string | number)[] = [];

  if (filters.state) {
    whereClauses.push("a.license_state = ?");
    params.push(filters.state);
  }

  if (filters.agency) {
    whereClauses.push("EXISTS (SELECT 1 FROM agencies ag WHERE ag.id = a.agency_id AND ag.slug = ?)");
    params.push(filters.agency);
  }

  if (filters.suburb) {
    whereClauses.push("EXISTS (SELECT 1 FROM agent_suburbs asub JOIN suburbs s ON s.id = asub.suburb_id WHERE asub.agent_id = a.id AND s.slug = ?)");
    params.push(filters.suburb);
  }

  if (filters.propertyType) {
    whereClauses.push("EXISTS (SELECT 1 FROM sales sa WHERE sa.agent_id = a.id AND sa.property_type = ?)");
    params.push(filters.propertyType);
  }

  const whereClause = whereClauses.join(" AND ");

  // Determine ORDER BY
  let orderBy: string;
  switch (filters.sort) {
    case "rating":
      orderBy = "a.ratings_average DESC NULLS LAST";
      break;
    case "sales":
      orderBy = "a.total_sales_count DESC NULLS LAST";
      break;
    case "name":
      orderBy = "a.full_name ASC";
      break;
    case "quality":
      orderBy = "a.data_quality_score DESC NULLS LAST";
      break;
    default:
      orderBy = "a.ratings_average DESC NULLS LAST";
  }

  // Get paginated results
  const rows = sqliteDb
    .prepare(
      `SELECT a.* FROM agents a WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as Agent[];

  // Get total count
  const countResult = sqliteDb
    .prepare(`SELECT COUNT(*) as cnt FROM agents a WHERE ${whereClause}`)
    .get(...params) as { cnt: number };

  return {
    agents: rows,
    total: countResult?.cnt ?? 0,
  };
}

export async function getSimilarAgents(
  agentId: number,
  suburbIds: number[],
  limit: number = 6
): Promise<Agent[]> {
  if (suburbIds.length === 0) return [];

  const placeholders = suburbIds.map(() => "?").join(",");
  const rows = sqliteDb
    .prepare(
      `SELECT DISTINCT a.*
       FROM agents a
       INNER JOIN agent_suburbs asub ON a.id = asub.agent_id
       WHERE asub.suburb_id IN (${placeholders})
         AND a.id != ?
       ORDER BY a.ratings_average DESC
       LIMIT ?`
    )
    .all(...suburbIds, agentId, limit) as Agent[];

  return rows;
}

export async function getAgentCount(filters?: {
  suburb?: string;
  state?: string;
}): Promise<number> {
  const whereClauses: string[] = ["1=1"];
  const params: (string | number)[] = [];

  if (filters?.state) {
    whereClauses.push("a.license_state = ?");
    params.push(filters.state);
  }

  if (filters?.suburb) {
    whereClauses.push("EXISTS (SELECT 1 FROM agent_suburbs asub JOIN suburbs s ON s.id = asub.suburb_id WHERE asub.agent_id = a.id AND s.slug = ?)");
    params.push(filters.suburb);
  }

  const whereClause = whereClauses.join(" AND ");

  const result = sqliteDb
    .prepare(`SELECT COUNT(*) as cnt FROM agents a WHERE ${whereClause}`)
    .get(...params) as { cnt: number };

  return result?.cnt ?? 0;
}

// ===========================================================================
// Agency queries
// ===========================================================================

export async function getAgencyBySlug(
  slug: string
): Promise<AgencyWithAgents | null> {
  const result = db.query.agencies
    .findFirst({
      where: eq(agencies.slug, slug),
      with: {
        agents: {
          orderBy: [desc(agents.totalSalesCount)],
        },
      },
    })
    .sync();

  if (!result) return null;

  return result as unknown as AgencyWithAgents;
}

export async function getAgenciesList(filters: {
  state?: string;
  sort?: "name" | "agents" | "sales";
  page?: number;
  limit?: number;
}): Promise<{ agencies: Agency[]; total: number }> {
  const pageSize = Math.min(filters.limit ?? 20, 50);
  const page = filters.page ?? 1;
  const offset = (page - 1) * pageSize;

  const whereClause = filters.state
    ? eq(agencies.state, filters.state)
    : undefined;

  let orderByClause;
  switch (filters.sort) {
    case "name":
      orderByClause = [asc(agencies.name)];
      break;
    case "agents":
      orderByClause = [desc(agencies.totalAgents)];
      break;
    case "sales":
      orderByClause = [desc(agencies.totalSalesCount)];
      break;
    default:
      orderByClause = [asc(agencies.name)];
  }

  const rows = db.query.agencies
    .findMany({
      where: whereClause,
      orderBy: orderByClause,
      limit: pageSize,
      offset,
    })
    .sync();

  const totalResult = db
    .select({ value: count() })
    .from(agencies)
    .where(whereClause)
    .get();

  return {
    agencies: rows,
    total: totalResult?.value ?? 0,
  };
}

export async function getAgencyCount(filters?: {
  state?: string;
}): Promise<number> {
  const whereClause = filters?.state
    ? eq(agencies.state, filters.state)
    : undefined;

  const result = db
    .select({ value: count() })
    .from(agencies)
    .where(whereClause)
    .get();

  return result?.value ?? 0;
}

// ===========================================================================
// Suburb queries
// ===========================================================================

export async function getSuburbBySlug(slug: string): Promise<Suburb | null> {
  const result = db.query.suburbs
    .findFirst({
      where: eq(suburbs.slug, slug),
    })
    .sync();

  return (result as Suburb | undefined) ?? null;
}

export async function getSuburbsList(filters: {
  state?: string;
  sort?: "name" | "agents" | "median_price";
  page?: number;
  limit?: number;
}): Promise<{ suburbs: Suburb[]; total: number }> {
  const pageSize = Math.min(filters.limit ?? 20, 50);
  const page = filters.page ?? 1;
  const offset = (page - 1) * pageSize;

  const whereClause = filters.state
    ? eq(suburbs.state, filters.state)
    : undefined;

  let orderByClause;
  switch (filters.sort) {
    case "name":
      orderByClause = [asc(suburbs.name)];
      break;
    case "agents":
      orderByClause = [desc(suburbs.totalAgents)];
      break;
    case "median_price":
      orderByClause = [desc(suburbs.medianHousePrice)];
      break;
    default:
      orderByClause = [asc(suburbs.name)];
  }

  const rows = db.query.suburbs
    .findMany({
      where: whereClause,
      orderBy: orderByClause,
      limit: pageSize,
      offset,
    })
    .sync();

  const totalResult = db
    .select({ value: count() })
    .from(suburbs)
    .where(whereClause)
    .get();

  return {
    suburbs: rows as Suburb[],
    total: totalResult?.value ?? 0,
  };
}

export async function getNearbySuburbs(
  lat: number,
  lng: number,
  radiusKm: number,
  limit: number = 10
): Promise<Suburb[]> {
  // Flat-earth approximation for distance:
  //   dist_sq = (dlat)^2 + (dlng * cos(lat))^2
  // 1 degree lat ~ 111.12 km, so radiusKm -> degrees squared
  const radiusDegSq = Math.pow(radiusKm / 111.12, 2);
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const cosLatSq = cosLat * cosLat;

  const rows = sqliteDb
    .prepare(
      `SELECT *,
              ((lat - ?) * (lat - ?) + (lng - ?) * (lng - ?) * ?) AS dist_sq
       FROM suburbs
       WHERE lat IS NOT NULL
         AND lng IS NOT NULL
         AND ((lat - ?) * (lat - ?) + (lng - ?) * (lng - ?) * ?) < ?
       ORDER BY dist_sq ASC
       LIMIT ?`
    )
    .all(
      lat, lat, lng, lng, cosLatSq,
      lat, lat, lng, lng, cosLatSq, radiusDegSq,
      limit
    ) as Suburb[];

  return rows;
}

export async function getTopSuburbs(
  state: string,
  limit: number = 10
): Promise<Suburb[]> {
  const rows = db.query.suburbs
    .findMany({
      where: eq(suburbs.state, state),
      orderBy: [desc(suburbs.totalAgents)],
      limit,
    })
    .sync();

  return rows as Suburb[];
}

/** Get top-performing agents in a suburb by sales count (matches SuburbAgentContext type) */
export async function getTopAgentsInSuburb(
  suburbSlug: string,
  limit: number = 5
): Promise<{
  fullName: string;
  agencyName: string;
  salesCountSuburb: number;
  specializations: string[];
  rating: number;
}[]> {
  const rows = sqliteDb
    .prepare(
      `SELECT a.full_name, a.total_sales_count, a.ratings_average, a.specializations,
              COALESCE(ag.name, 'Independent Agent') as agency_name
       FROM agents a
       LEFT JOIN agencies ag ON a.agency_id = ag.id
       INNER JOIN agent_suburbs asub ON a.id = asub.agent_id
       INNER JOIN suburbs s ON s.id = asub.suburb_id
       WHERE s.slug = ?
       ORDER BY a.total_sales_count DESC NULLS LAST
       LIMIT ?`
    )
    .all(suburbSlug, limit) as {
    full_name: string;
    agency_name: string;
    total_sales_count: number | null;
    ratings_average: number | null;
    specializations: string | null;
  }[];

  return rows.map((r) => {
    // Parse specializations JSON or comma-separated
    let specs: string[] = [];
    if (r.specializations) {
      try {
        const parsed = JSON.parse(r.specializations);
        specs = Array.isArray(parsed) ? parsed : [];
      } catch {
        specs = r.specializations.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return {
      fullName: r.full_name,
      agencyName: r.agency_name,
      salesCountSuburb: r.total_sales_count ?? 0,
      specializations: specs,
      rating: r.ratings_average ?? 0,
    };
  });
}

// ===========================================================================
// Search queries (FTS5)
// ===========================================================================

export async function searchFTS(
  query: string,
  type?: "agent" | "agency" | "suburb",
  limit: number = 20
): Promise<SearchResult[]> {
  const sanitized = sanitizeFtsQuery(query);
  if (!sanitized) return [];

  const results: SearchResult[] = [];

  if (!type || type === "agent") {
    try {
      const agentRows = sqliteDb
        .prepare(
          `SELECT a.slug, a.full_name, ag.name AS agency_name
           FROM agents_fts
           JOIN agents a ON a.id = agents_fts.rowid
           LEFT JOIN agencies ag ON a.agency_id = ag.id
           WHERE agents_fts MATCH ?
           LIMIT ?`
        )
        .all(sanitized, limit) as {
        slug: string;
        full_name: string;
        agency_name: string | null;
      }[];

      for (const row of agentRows) {
        results.push({
          type: "agent",
          slug: row.slug,
          label: row.full_name,
          sublabel: row.agency_name ?? "Independent Agent",
        });
      }
    } catch {
      // FTS table may not exist
    }
  }

  if (!type || type === "agency") {
    try {
      const agencyRows = sqliteDb
        .prepare(
          `SELECT a.slug, a.name, a.state
           FROM agencies_fts
           JOIN agencies a ON a.id = agencies_fts.rowid
           WHERE agencies_fts MATCH ?
           LIMIT ?`
        )
        .all(sanitized, limit) as {
        slug: string;
        name: string;
        state: string | null;
      }[];

      for (const row of agencyRows) {
        results.push({
          type: "agency",
          slug: row.slug,
          label: row.name,
          sublabel: row.state ?? "",
        });
      }
    } catch {
      // FTS table may not exist
    }
  }

  if (!type || type === "suburb") {
    try {
      const suburbRows = sqliteDb
        .prepare(
          `SELECT s.slug, s.name, s.state, s.postcode
           FROM suburbs_fts
           JOIN suburbs s ON s.id = suburbs_fts.rowid
           WHERE suburbs_fts MATCH ?
           LIMIT ?`
        )
        .all(sanitized, limit) as {
        slug: string;
        name: string;
        state: string;
        postcode: string;
      }[];

      for (const row of suburbRows) {
        results.push({
          type: "suburb",
          slug: row.slug,
          label: row.name,
          sublabel: `${row.state} ${row.postcode}`,
        });
      }
    } catch {
      // FTS table may not exist
    }
  }

  return results.slice(0, limit);
}

export async function autocompleteFTS(
  prefix: string,
  limit: number = 10
): Promise<AutocompleteResult[]> {
  const sanitized = sanitizeFtsQuery(prefix);
  if (!sanitized) return [];

  const prefixQuery = sanitized + "*";
  const results: AutocompleteResult[] = [];

  try {
    const agentRows = sqliteDb
      .prepare(
        `SELECT a.slug, a.full_name
         FROM agents_fts
         JOIN agents a ON a.id = agents_fts.rowid
         WHERE agents_fts MATCH ?
         LIMIT ?`
      )
      .all(prefixQuery, limit) as { slug: string; full_name: string }[];

    for (const row of agentRows) {
      results.push({ type: "agent", slug: row.slug, label: row.full_name });
    }
  } catch {
    // FTS table may not exist
  }

  try {
    const agencyRows = sqliteDb
      .prepare(
        `SELECT a.slug, a.name
         FROM agencies_fts
         JOIN agencies a ON a.id = agencies_fts.rowid
         WHERE agencies_fts MATCH ?
         LIMIT ?`
      )
      .all(prefixQuery, limit) as { slug: string; name: string }[];

    for (const row of agencyRows) {
      results.push({ type: "agency", slug: row.slug, label: row.name });
    }
  } catch {
    // FTS table may not exist
  }

  try {
    const suburbRows = sqliteDb
      .prepare(
        `SELECT s.slug, s.name, s.state
         FROM suburbs_fts
         JOIN suburbs s ON s.id = suburbs_fts.rowid
         WHERE suburbs_fts MATCH ?
         LIMIT ?`
      )
      .all(prefixQuery, limit) as {
      slug: string;
      name: string;
      state: string;
    }[];

    for (const row of suburbRows) {
      results.push({
        type: "suburb",
        slug: row.slug,
        label: `${row.name}, ${row.state}`,
      });
    }
  } catch {
    // FTS table may not exist
  }

  return results.slice(0, limit);
}

// ===========================================================================
// Stats queries
// ===========================================================================

export async function getSiteStats(): Promise<{
  totalAgents: number;
  totalSuburbs: number;
  totalAgencies: number;
  totalSales: number;
}> {
  const agentCount = db
    .select({ value: count() })
    .from(agents)
    .get();

  const suburbCount = db
    .select({ value: count() })
    .from(suburbs)
    .get();

  const agencyCount = db
    .select({ value: count() })
    .from(agencies)
    .get();

  const saleCount = db
    .select({ value: count() })
    .from(sales)
    .get();

  return {
    totalAgents: agentCount?.value ?? 0,
    totalSuburbs: suburbCount?.value ?? 0,
    totalAgencies: agencyCount?.value ?? 0,
    totalSales: saleCount?.value ?? 0,
  };
}

export async function getStateStats(state: string): Promise<{
  agents: number;
  suburbs: number;
  agencies: number;
}> {
  const agentCount = db
    .select({ value: count() })
    .from(agents)
    .where(eq(agents.licenseState, state))
    .get();

  const suburbCount = db
    .select({ value: count() })
    .from(suburbs)
    .where(eq(suburbs.state, state))
    .get();

  const agencyCount = db
    .select({ value: count() })
    .from(agencies)
    .where(eq(agencies.state, state))
    .get();

  return {
    agents: agentCount?.value ?? 0,
    suburbs: suburbCount?.value ?? 0,
    agencies: agencyCount?.value ?? 0,
  };
}

export type SuburbMarketStats = {
  medianPrice: number | null;
  medianPriceHouse: number | null;
  medianPriceApartment: number | null;
  priceChangeYoy: number | null;
  salesVolume12m: number | null;
  avgDaysOnMarket: number | null;
  clearanceRate: number | null;
  rentalYield: number | null;
};

export type SuburbDemographics = {
  population: number | null;
  medianAge: number | null;
  medianHouseholdIncome: number | null;
};

export async function getSuburbMarketStats(suburbSlug: string): Promise<{
  marketStats: SuburbMarketStats;
  demographics: SuburbDemographics;
  totalAgents: number;
}> {
  const sub = db.query.suburbs
    .findFirst({
      where: eq(suburbs.slug, suburbSlug),
    })
    .sync();

  if (!sub) {
    return {
      marketStats: {
        medianPrice: null,
        medianPriceHouse: null,
        medianPriceApartment: null,
        priceChangeYoy: null,
        salesVolume12m: null,
        avgDaysOnMarket: null,
        clearanceRate: null,
        rentalYield: null,
      },
      demographics: {
        population: null,
        medianAge: null,
        medianHouseholdIncome: null,
      },
      totalAgents: 0,
    };
  }

  return {
    marketStats: {
      medianPrice: sub.medianPrice ?? sub.medianHousePrice,
      medianPriceHouse: sub.medianHousePrice,
      medianPriceApartment: sub.medianUnitPrice,
      priceChangeYoy: sub.priceChangeYoy,
      salesVolume12m: sub.salesVolume12m,
      avgDaysOnMarket: sub.avgDaysOnMarket,
      clearanceRate: sub.clearanceRate,
      rentalYield: sub.rentalYield,
    },
    demographics: {
      population: sub.population,
      medianAge: sub.medianAge,
      medianHouseholdIncome: sub.medianHouseholdIncome,
    },
    totalAgents: sub.totalAgents ?? 0,
  };
}

/** Get paginated list of agents for a suburb */
export async function getAgentsBySuburb(filters: {
  suburbSlug: string;
  sort?: "sales_count" | "avg_price" | "name" | "rating";
  page?: number;
  limit?: number;
}): Promise<{
  agents: {
    id: number;
    slug: string;
    fullName: string;
    photoUrl: string | null;
    agencyName: string | null;
    agencyLogoUrl: string | null;
    salesCountSuburb: number;
    avgSalePriceSuburb: number | null;
    totalSalesCount: number;
    avgRating: number | null;
  }[];
  total: number;
}> {
  const pageSize = Math.min(filters.limit ?? 20, 50);
  const page = filters.page ?? 1;
  const offset = (page - 1) * pageSize;

  // Determine ORDER BY
  let orderBy: string;
  switch (filters.sort) {
    case "avg_price":
      orderBy = "a.median_sale_price DESC NULLS LAST";
      break;
    case "name":
      orderBy = "a.full_name ASC";
      break;
    case "rating":
      orderBy = "a.ratings_average DESC NULLS LAST";
      break;
    case "sales_count":
    default:
      orderBy = "asub.sales_count DESC NULLS LAST, a.total_sales_count DESC NULLS LAST";
  }

  const rows = sqliteDb
    .prepare(
      `SELECT
         a.id, a.slug, a.full_name, a.photo_url,
         a.total_sales_count, a.ratings_average, a.median_sale_price,
         ag.name AS agency_name, ag.logo_url AS agency_logo_url,
         asub.sales_count AS sales_count_suburb
       FROM agents a
       INNER JOIN agent_suburbs asub ON a.id = asub.agent_id
       INNER JOIN suburbs s ON s.id = asub.suburb_id
       LEFT JOIN agencies ag ON a.agency_id = ag.id
       WHERE s.slug = ?
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .all(filters.suburbSlug, pageSize, offset) as {
    id: number;
    slug: string;
    full_name: string;
    photo_url: string | null;
    total_sales_count: number | null;
    ratings_average: number | null;
    median_sale_price: number | null;
    agency_name: string | null;
    agency_logo_url: string | null;
    sales_count_suburb: number | null;
  }[];

  // Get total count
  const countResult = sqliteDb
    .prepare(
      `SELECT COUNT(*) as cnt
       FROM agents a
       INNER JOIN agent_suburbs asub ON a.id = asub.agent_id
       INNER JOIN suburbs s ON s.id = asub.suburb_id
       WHERE s.slug = ?`
    )
    .get(filters.suburbSlug) as { cnt: number };

  return {
    agents: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      fullName: r.full_name,
      photoUrl: r.photo_url,
      agencyName: r.agency_name,
      agencyLogoUrl: r.agency_logo_url,
      salesCountSuburb: r.sales_count_suburb ?? 0,
      avgSalePriceSuburb: r.median_sale_price,
      totalSalesCount: r.total_sales_count ?? 0,
      avgRating: r.ratings_average,
    })),
    total: countResult?.cnt ?? 0,
  };
}

// ===========================================================================
// Helpers
// ===========================================================================

/** Strip FTS5-unsafe chars from user input */
function sanitizeFtsQuery(input: string): string {
  return input
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

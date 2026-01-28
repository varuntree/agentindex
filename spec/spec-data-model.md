# AgentIndex Data Model Specification

## Table of Contents

- [Overview](#overview)
- [Technology](#technology)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Schema: agents](#schema-agents)
- [Schema: agencies](#schema-agencies)
- [Schema: suburbs](#schema-suburbs)
- [Schema: agent_suburbs](#schema-agent_suburbs)
- [Schema: sales](#schema-sales)
- [Schema: reviews](#schema-reviews)
- [Schema: pipeline_runs](#schema-pipeline_runs)
- [FTS5 Virtual Tables](#fts5-virtual-tables)
- [Indexes](#indexes)
- [TypeScript Type Exports](#typescript-type-exports)
- [Data Quality Score](#data-quality-score)
- [Slug Generation](#slug-generation)
- [JSON Field Schemas](#json-field-schemas)
- [Seed Data: Suburbs](#seed-data-suburbs)
- [Migrations](#migrations)

---

## Overview

7 core tables, 3 FTS5 virtual tables, junction table for agent-suburb many-to-many. All data written by pipeline, read-only from web app. SQLite single-file database at `data/agentindex.db`.

---

## Technology

- **Database:** SQLite 3 (via `better-sqlite3`)
- **ORM:** Drizzle ORM (`drizzle-orm/sqlite-core`)
- **FTS:** SQLite FTS5 extension (built-in)
- **Migrations:** Drizzle Kit (`drizzle-kit`)
- **Validation:** Zod (pipeline-side, pre-insert)

---

## Entity Relationship Diagram

```
agencies 1───∞ agents
agents   1───∞ sales
agents   1───∞ reviews
agents   ∞───∞ suburbs  (via agent_suburbs)
agencies 1───∞ sales
pipeline_runs (standalone)
```

---

## Schema: agents

~35 columns. Central entity. One agent belongs to one agency, has many sales, reviews, and suburbs.

### Drizzle Schema

```typescript
import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const agents = sqliteTable('agents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),

  // Identity
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  fullName: text('full_name').notNull(),

  // Contact
  email: text('email'),
  phone: text('phone'),
  mobilePhone: text('mobile_phone'),

  // Media
  photoUrl: text('photo_url'),

  // Licensing
  licenseNumber: text('license_number'),
  licenseStatus: text('license_status'), // 'active' | 'suspended' | 'cancelled' | 'unknown'
  licenseState: text('license_state'),   // 'NSW' | 'VIC' | 'QLD' | etc.

  // Agency FK
  agencyId: integer('agency_id').references(() => agencies.id),

  // Profile
  bio: text('bio'),
  yearsActive: integer('years_active'),
  languagesSpoken: text('languages_spoken'),       // JSON array: ["English","Mandarin"]
  specializations: text('specializations'),         // JSON array: ["residential","commercial","auctions"]
  suburbsServiced: text('suburbs_serviced'),         // JSON array of suburb names for display

  // Performance metrics (denormalized, computed by pipeline)
  totalSalesCount: integer('total_sales_count').default(0),
  totalSalesVolume: real('total_sales_volume').default(0),
  medianSalePrice: real('median_sale_price'),
  averageDaysOnMarket: real('average_days_on_market'),
  listingAccuracy: real('listing_accuracy'),         // sale price / listing price ratio

  // Ratings (denormalized from reviews)
  ratingsAverage: real('ratings_average'),
  ratingsCount: integer('ratings_count').default(0),

  // Data quality
  profileCompleteness: real('profile_completeness').default(0), // 0.0 - 1.0
  dataQualityScore: real('data_quality_score').default(0),       // 0.0 - 1.0

  // Source tracking
  sourceUrl: text('source_url'),
  lastScrapedAt: text('last_scraped_at'),

  // Timestamps
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => [
  uniqueIndex('agents_slug_idx').on(table.slug),
  index('agents_agency_id_idx').on(table.agencyId),
  index('agents_license_number_idx').on(table.licenseNumber),
  index('agents_license_state_idx').on(table.licenseState),
  index('agents_ratings_average_idx').on(table.ratingsAverage),
  index('agents_total_sales_count_idx').on(table.totalSalesCount),
  index('agents_data_quality_score_idx').on(table.dataQualityScore),
]);
```

### Raw SQL

```sql
CREATE TABLE agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,

  email TEXT,
  phone TEXT,
  mobile_phone TEXT,

  photo_url TEXT,

  license_number TEXT,
  license_status TEXT,
  license_state TEXT,

  agency_id INTEGER REFERENCES agencies(id),

  bio TEXT,
  years_active INTEGER,
  languages_spoken TEXT,      -- JSON array
  specializations TEXT,        -- JSON array
  suburbs_serviced TEXT,       -- JSON array

  total_sales_count INTEGER DEFAULT 0,
  total_sales_volume REAL DEFAULT 0,
  median_sale_price REAL,
  average_days_on_market REAL,
  listing_accuracy REAL,

  ratings_average REAL,
  ratings_count INTEGER DEFAULT 0,

  profile_completeness REAL DEFAULT 0,
  data_quality_score REAL DEFAULT 0,

  source_url TEXT,
  last_scraped_at TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX agents_slug_idx ON agents(slug);
CREATE INDEX agents_agency_id_idx ON agents(agency_id);
CREATE INDEX agents_license_number_idx ON agents(license_number);
CREATE INDEX agents_license_state_idx ON agents(license_state);
CREATE INDEX agents_ratings_average_idx ON agents(ratings_average);
CREATE INDEX agents_total_sales_count_idx ON agents(total_sales_count);
CREATE INDEX agents_data_quality_score_idx ON agents(data_quality_score);
```

---

## Schema: agencies

### Drizzle Schema

```typescript
export const agencies = sqliteTable('agencies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),

  // Identity
  name: text('name').notNull(),
  brandName: text('brand_name'),           // e.g. "Ray White" (parent brand)

  // Media & contact
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  phone: text('phone'),
  email: text('email'),

  // Address
  streetAddress: text('street_address'),
  suburb: text('suburb'),
  state: text('state'),
  postcode: text('postcode'),
  latitude: real('latitude'),
  longitude: real('longitude'),

  // Profile
  description: text('description'),

  // Denormalized stats (computed by pipeline)
  totalAgents: integer('total_agents').default(0),
  totalSalesCount: integer('total_sales_count').default(0),
  totalSalesVolume: real('total_sales_volume').default(0),

  // Source tracking
  sourceUrl: text('source_url'),
  lastScrapedAt: text('last_scraped_at'),

  // Timestamps
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => [
  uniqueIndex('agencies_slug_idx').on(table.slug),
  index('agencies_state_idx').on(table.state),
  index('agencies_postcode_idx').on(table.postcode),
]);
```

### Raw SQL

```sql
CREATE TABLE agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,

  name TEXT NOT NULL,
  brand_name TEXT,

  logo_url TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,

  street_address TEXT,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  latitude REAL,
  longitude REAL,

  description TEXT,

  total_agents INTEGER DEFAULT 0,
  total_sales_count INTEGER DEFAULT 0,
  total_sales_volume REAL DEFAULT 0,

  source_url TEXT,
  last_scraped_at TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX agencies_slug_idx ON agencies(slug);
CREATE INDEX agencies_state_idx ON agencies(state);
CREATE INDEX agencies_postcode_idx ON agencies(postcode);
```

---

## Schema: suburbs

Seeded from Matthew Proctor's Australian Postcodes CSV (~16,000 rows). Market stats populated by pipeline.

### Drizzle Schema

```typescript
export const suburbs = sqliteTable('suburbs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),

  // Identity
  name: text('name').notNull(),
  state: text('state').notNull(),          // NSW, VIC, QLD, SA, WA, TAS, NT, ACT
  postcode: text('postcode').notNull(),

  // Geography
  latitude: real('latitude'),
  longitude: real('longitude'),

  // Administrative
  localGovernmentArea: text('local_government_area'),
  stateElectorate: text('state_electorate'),

  // Denormalized stats (computed by pipeline)
  totalAgents: integer('total_agents').default(0),
  medianHousePrice: real('median_house_price'),
  medianUnitPrice: real('median_unit_price'),

  // Timestamps
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => [
  uniqueIndex('suburbs_slug_idx').on(table.slug),
  index('suburbs_state_idx').on(table.state),
  index('suburbs_postcode_idx').on(table.postcode),
  index('suburbs_name_state_idx').on(table.name, table.state),
]);
```

### Raw SQL

```sql
CREATE TABLE suburbs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,

  name TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,

  latitude REAL,
  longitude REAL,

  local_government_area TEXT,
  state_electorate TEXT,

  total_agents INTEGER DEFAULT 0,
  median_house_price REAL,
  median_unit_price REAL,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX suburbs_slug_idx ON suburbs(slug);
CREATE INDEX suburbs_state_idx ON suburbs(state);
CREATE INDEX suburbs_postcode_idx ON suburbs(postcode);
CREATE INDEX suburbs_name_state_idx ON suburbs(name, state);
```

---

## Schema: agent_suburbs

Junction table. Many-to-many between agents and suburbs. Tracks per-suburb sales count and primary suburb flag.

### Drizzle Schema

```typescript
export const agentSuburbs = sqliteTable('agent_suburbs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  suburbId: integer('suburb_id').notNull().references(() => suburbs.id, { onDelete: 'cascade' }),

  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  salesCount: integer('sales_count').default(0),
}, (table) => [
  uniqueIndex('agent_suburbs_unique_idx').on(table.agentId, table.suburbId),
  index('agent_suburbs_agent_id_idx').on(table.agentId),
  index('agent_suburbs_suburb_id_idx').on(table.suburbId),
]);
```

### Raw SQL

```sql
CREATE TABLE agent_suburbs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  suburb_id INTEGER NOT NULL REFERENCES suburbs(id) ON DELETE CASCADE,

  is_primary INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0
);

CREATE UNIQUE INDEX agent_suburbs_unique_idx ON agent_suburbs(agent_id, suburb_id);
CREATE INDEX agent_suburbs_agent_id_idx ON agent_suburbs(agent_id);
CREATE INDEX agent_suburbs_suburb_id_idx ON agent_suburbs(suburb_id);
```

---

## Schema: sales

Individual property sale records linked to agent and agency.

### Drizzle Schema

```typescript
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  agencyId: integer('agency_id').references(() => agencies.id, { onDelete: 'set null' }),

  // Property details
  propertyAddress: text('property_address').notNull(),
  suburb: text('suburb'),
  state: text('state'),
  postcode: text('postcode'),
  propertyType: text('property_type'),     // 'house' | 'unit' | 'land' | 'townhouse' | 'villa'

  // Pricing
  salePrice: real('sale_price'),
  listingPrice: real('listing_price'),

  // Sale info
  saleMethod: text('sale_method'),         // 'auction' | 'private_treaty' | 'expression_of_interest'
  saleDate: text('sale_date'),             // ISO date YYYY-MM-DD
  daysOnMarket: integer('days_on_market'),

  // Property attributes
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  carSpaces: integer('car_spaces'),
  landArea: real('land_area'),             // sqm
  floorArea: real('floor_area'),           // sqm

  // Media
  imageUrl: text('image_url'),

  // Source tracking
  sourceUrl: text('source_url'),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => [
  index('sales_agent_id_idx').on(table.agentId),
  index('sales_agency_id_idx').on(table.agencyId),
  index('sales_suburb_idx').on(table.suburb),
  index('sales_sale_date_idx').on(table.saleDate),
  index('sales_agent_date_idx').on(table.agentId, table.saleDate),
  index('sales_property_type_idx').on(table.propertyType),
]);
```

### Raw SQL

```sql
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,

  property_address TEXT NOT NULL,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  property_type TEXT,

  sale_price REAL,
  listing_price REAL,

  sale_method TEXT,
  sale_date TEXT,
  days_on_market INTEGER,

  bedrooms INTEGER,
  bathrooms INTEGER,
  car_spaces INTEGER,
  land_area REAL,
  floor_area REAL,

  image_url TEXT,

  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX sales_agent_id_idx ON sales(agent_id);
CREATE INDEX sales_agency_id_idx ON sales(agency_id);
CREATE INDEX sales_suburb_idx ON sales(suburb);
CREATE INDEX sales_sale_date_idx ON sales(sale_date);
CREATE INDEX sales_agent_date_idx ON sales(agent_id, sale_date);
CREATE INDEX sales_property_type_idx ON sales(property_type);
```

---

## Schema: reviews

Agent reviews aggregated from multiple platforms.

### Drizzle Schema

```typescript
export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),

  // Reviewer
  reviewerName: text('reviewer_name'),
  reviewDate: text('review_date'),             // ISO date YYYY-MM-DD
  reviewerType: text('reviewer_type'),         // 'buyer' | 'seller' | 'landlord' | 'tenant'

  // Ratings
  overallRating: real('overall_rating').notNull(), // 1.0 - 5.0
  knowledgeRating: real('knowledge_rating'),        // 1.0 - 5.0
  communicationRating: real('communication_rating'),// 1.0 - 5.0
  negotiationRating: real('negotiation_rating'),    // 1.0 - 5.0

  // Content
  reviewText: text('review_text'),
  priceRange: text('price_range'),               // e.g. "$500k-$750k"

  // Source
  sourceUrl: text('source_url'),
  sourcePlatform: text('source_platform'),       // 'ratemyagent' | 'google' | 'agency_website' | 'other'

  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => [
  index('reviews_agent_id_idx').on(table.agentId),
  index('reviews_overall_rating_idx').on(table.overallRating),
  index('reviews_review_date_idx').on(table.reviewDate),
]);
```

### Raw SQL

```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  reviewer_name TEXT,
  review_date TEXT,
  reviewer_type TEXT,

  overall_rating REAL NOT NULL,
  knowledge_rating REAL,
  communication_rating REAL,
  negotiation_rating REAL,

  review_text TEXT,
  price_range TEXT,

  source_url TEXT,
  source_platform TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX reviews_agent_id_idx ON reviews(agent_id);
CREATE INDEX reviews_overall_rating_idx ON reviews(overall_rating);
CREATE INDEX reviews_review_date_idx ON reviews(review_date);
```

---

## Schema: pipeline_runs

Tracks each pipeline execution for auditing and debugging.

### Drizzle Schema

```typescript
export const pipelineRuns = sqliteTable('pipeline_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Timing
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),

  // Status
  status: text('status').notNull().default('pending'), // 'pending' | 'running' | 'completed' | 'failed'

  // Config
  agentModel: text('agent_model'),                      // e.g. 'claude-sonnet-4-20250514'
  targetLocation: text('target_location'),               // e.g. 'Bondi Beach, NSW'

  // Result counts
  agenciesFound: integer('agencies_found').default(0),
  agentsFound: integer('agents_found').default(0),
  salesFound: integer('sales_found').default(0),
  reviewsFound: integer('reviews_found').default(0),

  // Cost
  totalCostUsd: real('total_cost_usd'),

  // Errors
  errorLog: text('error_log'),                           // JSON string or plain text

  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => [
  index('pipeline_runs_status_idx').on(table.status),
  index('pipeline_runs_started_at_idx').on(table.startedAt),
]);
```

### Raw SQL

```sql
CREATE TABLE pipeline_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  started_at TEXT NOT NULL,
  completed_at TEXT,

  status TEXT NOT NULL DEFAULT 'pending',

  agent_model TEXT,
  target_location TEXT,

  agencies_found INTEGER DEFAULT 0,
  agents_found INTEGER DEFAULT 0,
  sales_found INTEGER DEFAULT 0,
  reviews_found INTEGER DEFAULT 0,

  total_cost_usd REAL,

  error_log TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX pipeline_runs_status_idx ON pipeline_runs(status);
CREATE INDEX pipeline_runs_started_at_idx ON pipeline_runs(started_at);
```

---

## FTS5 Virtual Tables

SQLite FTS5 provides full-text search. Each FTS table mirrors selected text columns from a base table and stays in sync via triggers.

### agents_fts

```sql
CREATE VIRTUAL TABLE agents_fts USING fts5(
  full_name,
  bio,
  suburbs_serviced,
  specializations,
  content='agents',
  content_rowid='id'
);

-- Sync triggers
CREATE TRIGGER agents_fts_insert AFTER INSERT ON agents BEGIN
  INSERT INTO agents_fts(rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES (NEW.id, NEW.full_name, NEW.bio, NEW.suburbs_serviced, NEW.specializations);
END;

CREATE TRIGGER agents_fts_update AFTER UPDATE ON agents BEGIN
  INSERT INTO agents_fts(agents_fts, rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES ('delete', OLD.id, OLD.full_name, OLD.bio, OLD.suburbs_serviced, OLD.specializations);
  INSERT INTO agents_fts(rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES (NEW.id, NEW.full_name, NEW.bio, NEW.suburbs_serviced, NEW.specializations);
END;

CREATE TRIGGER agents_fts_delete AFTER DELETE ON agents BEGIN
  INSERT INTO agents_fts(agents_fts, rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES ('delete', OLD.id, OLD.full_name, OLD.bio, OLD.suburbs_serviced, OLD.specializations);
END;
```

### agencies_fts

```sql
CREATE VIRTUAL TABLE agencies_fts USING fts5(
  name,
  brand_name,
  suburb,
  description,
  content='agencies',
  content_rowid='id'
);

CREATE TRIGGER agencies_fts_insert AFTER INSERT ON agencies BEGIN
  INSERT INTO agencies_fts(rowid, name, brand_name, suburb, description)
  VALUES (NEW.id, NEW.name, NEW.brand_name, NEW.suburb, NEW.description);
END;

CREATE TRIGGER agencies_fts_update AFTER UPDATE ON agencies BEGIN
  INSERT INTO agencies_fts(agencies_fts, rowid, name, brand_name, suburb, description)
  VALUES ('delete', OLD.id, OLD.name, OLD.brand_name, OLD.suburb, OLD.description);
  INSERT INTO agencies_fts(rowid, name, brand_name, suburb, description)
  VALUES (NEW.id, NEW.name, NEW.brand_name, NEW.suburb, NEW.description);
END;

CREATE TRIGGER agencies_fts_delete AFTER DELETE ON agencies BEGIN
  INSERT INTO agencies_fts(agencies_fts, rowid, name, brand_name, suburb, description)
  VALUES ('delete', OLD.id, OLD.name, OLD.brand_name, OLD.suburb, OLD.description);
END;
```

### suburbs_fts

```sql
CREATE VIRTUAL TABLE suburbs_fts USING fts5(
  name,
  postcode,
  local_government_area,
  content='suburbs',
  content_rowid='id'
);

CREATE TRIGGER suburbs_fts_insert AFTER INSERT ON suburbs BEGIN
  INSERT INTO suburbs_fts(rowid, name, postcode, local_government_area)
  VALUES (NEW.id, NEW.name, NEW.postcode, NEW.local_government_area);
END;

CREATE TRIGGER suburbs_fts_update AFTER UPDATE ON suburbs BEGIN
  INSERT INTO suburbs_fts(suburbs_fts, rowid, name, postcode, local_government_area)
  VALUES ('delete', OLD.id, OLD.name, OLD.postcode, OLD.local_government_area);
  INSERT INTO suburbs_fts(rowid, name, postcode, local_government_area)
  VALUES (NEW.id, NEW.name, NEW.postcode, NEW.local_government_area);
END;

CREATE TRIGGER suburbs_fts_delete AFTER DELETE ON suburbs BEGIN
  INSERT INTO suburbs_fts(suburbs_fts, rowid, name, postcode, local_government_area)
  VALUES ('delete', OLD.id, OLD.name, OLD.postcode, OLD.local_government_area);
END;
```

### FTS Query Examples

```typescript
// Search agents by name or bio content
const results = db.all(sql`
  SELECT a.*, rank
  FROM agents_fts
  JOIN agents a ON a.id = agents_fts.rowid
  WHERE agents_fts MATCH ${query}
  ORDER BY rank
  LIMIT ${limit}
`);

// Universal search across all entity types
const agents = db.all(sql`
  SELECT 'agent' as type, a.id, a.slug, a.full_name as label, rank
  FROM agents_fts JOIN agents a ON a.id = agents_fts.rowid
  WHERE agents_fts MATCH ${query}
  ORDER BY rank LIMIT ${limit}
`);

const agencies = db.all(sql`
  SELECT 'agency' as type, a.id, a.slug, a.name as label, rank
  FROM agencies_fts JOIN agencies a ON a.id = agencies_fts.rowid
  WHERE agencies_fts MATCH ${query}
  ORDER BY rank LIMIT ${limit}
`);

const suburbs = db.all(sql`
  SELECT 'suburb' as type, s.id, s.slug, s.name || ', ' || s.state as label, rank
  FROM suburbs_fts JOIN suburbs s ON s.id = suburbs_fts.rowid
  WHERE suburbs_fts MATCH ${query}
  ORDER BY rank LIMIT ${limit}
`);
```

**Note:** FTS5 virtual tables and triggers must be created via raw SQL migrations, not through Drizzle schema (Drizzle does not support FTS5 table definitions).

---

## Indexes

Summary of all indexes across all tables.

| Table | Index Name | Columns | Type |
|-------|-----------|---------|------|
| agents | `agents_slug_idx` | slug | UNIQUE |
| agents | `agents_agency_id_idx` | agency_id | INDEX |
| agents | `agents_license_number_idx` | license_number | INDEX |
| agents | `agents_license_state_idx` | license_state | INDEX |
| agents | `agents_ratings_average_idx` | ratings_average | INDEX |
| agents | `agents_total_sales_count_idx` | total_sales_count | INDEX |
| agents | `agents_data_quality_score_idx` | data_quality_score | INDEX |
| agencies | `agencies_slug_idx` | slug | UNIQUE |
| agencies | `agencies_state_idx` | state | INDEX |
| agencies | `agencies_postcode_idx` | postcode | INDEX |
| suburbs | `suburbs_slug_idx` | slug | UNIQUE |
| suburbs | `suburbs_state_idx` | state | INDEX |
| suburbs | `suburbs_postcode_idx` | postcode | INDEX |
| suburbs | `suburbs_name_state_idx` | name, state | COMPOSITE |
| agent_suburbs | `agent_suburbs_unique_idx` | agent_id, suburb_id | UNIQUE |
| agent_suburbs | `agent_suburbs_agent_id_idx` | agent_id | INDEX |
| agent_suburbs | `agent_suburbs_suburb_id_idx` | suburb_id | INDEX |
| sales | `sales_agent_id_idx` | agent_id | INDEX |
| sales | `sales_agency_id_idx` | agency_id | INDEX |
| sales | `sales_suburb_idx` | suburb | INDEX |
| sales | `sales_sale_date_idx` | sale_date | INDEX |
| sales | `sales_agent_date_idx` | agent_id, sale_date | COMPOSITE |
| sales | `sales_property_type_idx` | property_type | INDEX |
| reviews | `reviews_agent_id_idx` | agent_id | INDEX |
| reviews | `reviews_overall_rating_idx` | overall_rating | INDEX |
| reviews | `reviews_review_date_idx` | review_date | INDEX |
| pipeline_runs | `pipeline_runs_status_idx` | status | INDEX |
| pipeline_runs | `pipeline_runs_started_at_idx` | started_at | INDEX |

---

## TypeScript Type Exports

Drizzle provides `InferSelectModel` and `InferInsertModel` for type-safe queries.

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  agents,
  agencies,
  suburbs,
  agentSuburbs,
  sales,
  reviews,
  pipelineRuns,
} from './schema';

// Select types (reading from DB)
export type Agent = InferSelectModel<typeof agents>;
export type Agency = InferSelectModel<typeof agencies>;
export type Suburb = InferSelectModel<typeof suburbs>;
export type AgentSuburb = InferSelectModel<typeof agentSuburbs>;
export type Sale = InferSelectModel<typeof sales>;
export type Review = InferSelectModel<typeof reviews>;
export type PipelineRun = InferSelectModel<typeof pipelineRuns>;

// Insert types (writing to DB)
export type NewAgent = InferInsertModel<typeof agents>;
export type NewAgency = InferInsertModel<typeof agencies>;
export type NewSuburb = InferInsertModel<typeof suburbs>;
export type NewAgentSuburb = InferInsertModel<typeof agentSuburbs>;
export type NewSale = InferInsertModel<typeof sales>;
export type NewReview = InferInsertModel<typeof reviews>;
export type NewPipelineRun = InferInsertModel<typeof pipelineRuns>;

// Convenience: Agent with parsed JSON fields
export type AgentWithParsedFields = Omit<Agent, 'languagesSpoken' | 'specializations' | 'suburbsServiced'> & {
  languagesSpoken: string[];
  specializations: string[];
  suburbsServiced: string[];
};

// Agent with relations (for API responses)
export type AgentWithRelations = Agent & {
  agency: Agency | null;
  suburbs: (AgentSuburb & { suburb: Suburb })[];
  recentSales: Sale[];
  reviews: Review[];
};

// Agency with agents list
export type AgencyWithAgents = Agency & {
  agents: Agent[];
};
```

---

## Data Quality Score

Computed per-agent by the pipeline after data collection. Stored as `dataQualityScore` (0.0 - 1.0) on the agents table.

### Formula

```typescript
function computeDataQualityScore(agent: Agent): number {
  const profileCompleteness = computeProfileCompleteness(agent);
  const hasSalesData = (agent.totalSalesCount ?? 0) > 0;
  const hasReviews = (agent.ratingsCount ?? 0) > 0;
  const hasPhoto = !!agent.photoUrl;
  const hasLicense = !!agent.licenseNumber;

  const score =
    profileCompleteness * 0.3 +
    (hasSalesData ? 0.3 : 0) +
    (hasReviews ? 0.2 : 0) +
    (hasPhoto ? 0.1 : 0) +
    (hasLicense ? 0.1 : 0);

  return Math.round(score * 100) / 100; // 2 decimal places
}
```

### Profile Completeness

`profileCompleteness` is a 0.0 - 1.0 score based on how many fields are filled.

```typescript
function computeProfileCompleteness(agent: Agent): number {
  const fields = [
    { key: 'firstName', weight: 1 },
    { key: 'lastName', weight: 1 },
    { key: 'email', weight: 1 },
    { key: 'phone', weight: 1 },
    { key: 'photoUrl', weight: 1 },
    { key: 'bio', weight: 1 },
    { key: 'licenseNumber', weight: 1 },
    { key: 'yearsActive', weight: 1 },
    { key: 'languagesSpoken', weight: 1 },     // non-empty JSON array
    { key: 'specializations', weight: 1 },       // non-empty JSON array
    { key: 'suburbsServiced', weight: 1 },       // non-empty JSON array
    { key: 'agencyId', weight: 1 },
  ];

  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
  let filledWeight = 0;

  for (const field of fields) {
    const value = (agent as any)[field.key];
    if (value !== null && value !== undefined && value !== '' && value !== '[]') {
      filledWeight += field.weight;
    }
  }

  return filledWeight / totalWeight;
}
```

### Weight Breakdown

| Component | Weight | Condition |
|-----------|--------|-----------|
| Profile completeness | 0.3 | Proportional to filled fields |
| Sales data | 0.3 | `totalSalesCount > 0` |
| Reviews | 0.2 | `ratingsCount > 0` |
| Photo | 0.1 | `photoUrl` is non-null |
| License | 0.1 | `licenseNumber` is non-null |

An agent with all data present scores 1.0. An agent with only a name and agency scores ~0.05.

---

## Slug Generation

URL-safe slugs for all entities. Generated by the pipeline during data insertion.

### Utility Function

```typescript
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')           // Remove apostrophes
    .replace(/&/g, 'and')           // Replace ampersands
    .replace(/[^a-z0-9]+/g, '-')   // Non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '')        // Trim leading/trailing hyphens
    .replace(/-{2,}/g, '-');        // Collapse multiple hyphens
}
```

### Rules by Entity

**Agent slug:** `slugify(fullName)`
- Base: `"john-smith"`
- If duplicate exists: append primary suburb -> `"john-smith-bondi"`
- If still duplicate: append incrementing number -> `"john-smith-bondi-2"`

```typescript
async function generateAgentSlug(
  fullName: string,
  primarySuburb: string | null,
  db: Database
): Promise<string> {
  const base = slugify(fullName);

  // Try base slug
  const existing = await db.select().from(agents).where(eq(agents.slug, base));
  if (existing.length === 0) return base;

  // Try with suburb
  if (primarySuburb) {
    const withSuburb = `${base}-${slugify(primarySuburb)}`;
    const existing2 = await db.select().from(agents).where(eq(agents.slug, withSuburb));
    if (existing2.length === 0) return withSuburb;
  }

  // Append incrementing number
  let counter = 2;
  const prefix = primarySuburb ? `${base}-${slugify(primarySuburb)}` : base;
  while (true) {
    const candidate = `${prefix}-${counter}`;
    const existing3 = await db.select().from(agents).where(eq(agents.slug, candidate));
    if (existing3.length === 0) return candidate;
    counter++;
  }
}
```

**Agency slug:** `slugify(name)`
- Base: `"ray-white"` from "Ray White"
- With suburb disambiguation: `"ray-white-bondi-beach"`

**Suburb slug:** `slugify(name + '-' + state)`
- Always includes state to prevent collisions (e.g. Richmond VIC vs Richmond NSW)
- Example: `"bondi-nsw"`, `"richmond-vic"`, `"surry-hills-nsw"`

---

## JSON Field Schemas

Three columns on the agents table store JSON arrays as TEXT. These are serialized/deserialized at the application layer.

### languagesSpoken

```typescript
// Stored as: '["English","Mandarin","Arabic"]'
// TypeScript type:
type LanguagesSpoken = string[];

// Common values:
const KNOWN_LANGUAGES = [
  'English', 'Mandarin', 'Cantonese', 'Arabic', 'Hindi',
  'Italian', 'Greek', 'Vietnamese', 'Korean', 'Japanese',
  'Spanish', 'French', 'Portuguese', 'Thai', 'Indonesian',
  'Tagalog', 'Persian', 'Turkish', 'German', 'Russian',
] as const;
```

### specializations

```typescript
// Stored as: '["residential","commercial","auctions","property_management"]'
// TypeScript type:
type Specializations = string[];

// Known values:
const KNOWN_SPECIALIZATIONS = [
  'residential',
  'commercial',
  'industrial',
  'rural',
  'auctions',
  'property_management',
  'prestige',
  'off_the_plan',
  'first_home_buyers',
  'investment',
  'downsizers',
  'development_sites',
] as const;
```

### suburbsServiced

```typescript
// Stored as: '["Bondi Beach","North Bondi","Bondi Junction"]'
// TypeScript type:
type SuburbsServiced = string[];

// Display-friendly suburb names. Source of truth for
// which suburbs appear on the agent profile page.
// The agent_suburbs junction table is the relational
// source of truth; this field is denormalized for
// display and FTS indexing.
```

### Parsing Helpers

```typescript
function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeJsonArray(arr: string[]): string {
  return JSON.stringify(arr);
}
```

---

## Seed Data: Suburbs

Suburbs table seeded from [Matthew Proctor's Australian Postcodes](https://www.matthewproctor.com/australian_postcodes) CSV dataset (~16,000 rows).

### CSV Fields Used

| CSV Column | Maps To | Notes |
|-----------|---------|-------|
| `locality` | `name` | Suburb name |
| `state` | `state` | State abbreviation |
| `postcode` | `postcode` | 4-digit postcode |
| `lat` | `latitude` | Decimal latitude |
| `long` | `longitude` | Decimal longitude |
| `Local Government Area` | `localGovernmentArea` | Council name |
| `State Electorate` | `stateElectorate` | State electorate name |

### Seed Script

```typescript
// scripts/seed-suburbs.ts
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { db } from '../src/lib/db';
import { suburbs } from '../src/lib/db/schema';

async function seedSuburbs() {
  const csv = fs.readFileSync('data/australian_postcodes.csv', 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  const values = records.map((row: any) => ({
    slug: slugify(`${row.locality}-${row.state}`),
    name: row.locality,
    state: row.state,
    postcode: row.postcode,
    latitude: parseFloat(row.lat) || null,
    longitude: parseFloat(row.long) || null,
    localGovernmentArea: row['Local Government Area'] || null,
    stateElectorate: row['State Electorate'] || null,
  }));

  // Insert in batches of 500 (SQLite variable limit)
  const BATCH_SIZE = 500;
  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);
    await db.insert(suburbs)
      .values(batch)
      .onConflictDoNothing(); // Skip duplicates by slug
  }

  console.log(`Seeded ${values.length} suburbs`);
}

seedSuburbs();
```

### Running the Seed

```bash
pnpm seed:suburbs
# Reads data/australian_postcodes.csv
# Inserts ~16,000 rows into suburbs table
# Idempotent: skips existing slugs on re-run
```

---

## Migrations

Managed by [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview).

### Drizzle Config

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/agentindex.db',
  },
} satisfies Config;
```

### Commands

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply pending migrations
pnpm drizzle-kit migrate

# Push schema directly (dev only, no migration file)
pnpm drizzle-kit push

# Open Drizzle Studio (GUI)
pnpm drizzle-kit studio
```

### FTS5 Custom Migration

FTS5 virtual tables and triggers are not supported by Drizzle schema definitions. Create a custom migration file:

```
drizzle/
  0000_initial_schema.sql       # Generated by drizzle-kit
  0001_fts5_virtual_tables.sql  # Hand-written
```

```sql
-- drizzle/0001_fts5_virtual_tables.sql

-- Agents FTS
CREATE VIRTUAL TABLE IF NOT EXISTS agents_fts USING fts5(
  full_name, bio, suburbs_serviced, specializations,
  content='agents', content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS agents_fts_insert AFTER INSERT ON agents BEGIN
  INSERT INTO agents_fts(rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES (NEW.id, NEW.full_name, NEW.bio, NEW.suburbs_serviced, NEW.specializations);
END;

CREATE TRIGGER IF NOT EXISTS agents_fts_update AFTER UPDATE ON agents BEGIN
  INSERT INTO agents_fts(agents_fts, rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES ('delete', OLD.id, OLD.full_name, OLD.bio, OLD.suburbs_serviced, OLD.specializations);
  INSERT INTO agents_fts(rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES (NEW.id, NEW.full_name, NEW.bio, NEW.suburbs_serviced, NEW.specializations);
END;

CREATE TRIGGER IF NOT EXISTS agents_fts_delete AFTER DELETE ON agents BEGIN
  INSERT INTO agents_fts(agents_fts, rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES ('delete', OLD.id, OLD.full_name, OLD.bio, OLD.suburbs_serviced, OLD.specializations);
END;

-- Agencies FTS
CREATE VIRTUAL TABLE IF NOT EXISTS agencies_fts USING fts5(
  name, brand_name, suburb, description,
  content='agencies', content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS agencies_fts_insert AFTER INSERT ON agencies BEGIN
  INSERT INTO agencies_fts(rowid, name, brand_name, suburb, description)
  VALUES (NEW.id, NEW.name, NEW.brand_name, NEW.suburb, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS agencies_fts_update AFTER UPDATE ON agencies BEGIN
  INSERT INTO agencies_fts(agencies_fts, rowid, name, brand_name, suburb, description)
  VALUES ('delete', OLD.id, OLD.name, OLD.brand_name, OLD.suburb, OLD.description);
  INSERT INTO agencies_fts(rowid, name, brand_name, suburb, description)
  VALUES (NEW.id, NEW.name, NEW.brand_name, NEW.suburb, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS agencies_fts_delete AFTER DELETE ON agencies BEGIN
  INSERT INTO agencies_fts(agencies_fts, rowid, name, brand_name, suburb, description)
  VALUES ('delete', OLD.id, OLD.name, OLD.brand_name, OLD.suburb, OLD.description);
END;

-- Suburbs FTS
CREATE VIRTUAL TABLE IF NOT EXISTS suburbs_fts USING fts5(
  name, postcode, local_government_area,
  content='suburbs', content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS suburbs_fts_insert AFTER INSERT ON suburbs BEGIN
  INSERT INTO suburbs_fts(rowid, name, postcode, local_government_area)
  VALUES (NEW.id, NEW.name, NEW.postcode, NEW.local_government_area);
END;

CREATE TRIGGER IF NOT EXISTS suburbs_fts_update AFTER UPDATE ON suburbs BEGIN
  INSERT INTO suburbs_fts(suburbs_fts, rowid, name, postcode, local_government_area)
  VALUES ('delete', OLD.id, OLD.name, OLD.postcode, OLD.local_government_area);
  INSERT INTO suburbs_fts(rowid, name, postcode, local_government_area)
  VALUES (NEW.id, NEW.name, NEW.postcode, NEW.local_government_area);
END;

CREATE TRIGGER IF NOT EXISTS suburbs_fts_delete AFTER DELETE ON suburbs BEGIN
  INSERT INTO suburbs_fts(suburbs_fts, rowid, name, postcode, local_government_area)
  VALUES ('delete', OLD.id, OLD.name, OLD.postcode, OLD.local_government_area);
END;
```

### Migration Workflow

1. Edit `src/lib/db/schema.ts`
2. Run `pnpm drizzle-kit generate` to produce SQL migration
3. If FTS changes needed, hand-edit the custom migration file
4. Run `pnpm drizzle-kit migrate` to apply
5. Run `pnpm seed:suburbs` if fresh database
6. Commit migration files to git

### Database File Location

- **Development:** `data/agentindex.db` (gitignored)
- **CI/Build:** Generated fresh from migrations + seed
- **Production:** Committed to repo or synced via Vercel Blob storage

---

*Version 1.0 | Last Updated: 2026-01-28*

import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations, type InferSelectModel, type InferInsertModel } from "drizzle-orm";

// ---------------------------------------------------------------------------
// 1. agencies
// ---------------------------------------------------------------------------
export const agencies = sqliteTable(
  "agencies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").unique().notNull(),
    name: text("name").notNull(),
    brandName: text("brand_name"),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    phone: text("phone"),
    email: text("email"),
    streetAddress: text("street_address"),
    suburb: text("suburb"),
    state: text("state"),
    postcode: text("postcode"),
    lat: real("lat"),
    lng: real("lng"),
    description: text("description"),
    totalAgents: integer("total_agents").default(0),
    totalSalesCount: integer("total_sales_count").default(0),
    totalSalesVolume: real("total_sales_volume").default(0),
    sourceUrl: text("source_url"),
    lastScrapedAt: integer("last_scraped_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("agencies_slug_idx").on(table.slug),
    index("agencies_state_idx").on(table.state),
    index("agencies_postcode_idx").on(table.postcode),
  ]
);

// ---------------------------------------------------------------------------
// 2. agents
// ---------------------------------------------------------------------------
export const agents = sqliteTable(
  "agents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").unique().notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fullName: text("full_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    mobilePhone: text("mobile_phone"),
    photoUrl: text("photo_url"),
    licenseNumber: text("license_number"),
    licenseStatus: text("license_status"),
    licenseState: text("license_state"),
    agencyId: integer("agency_id").references(() => agencies.id, {
      onDelete: "set null",
    }),
    bio: text("bio"),
    yearsActive: integer("years_active"),
    languagesSpoken: text("languages_spoken"), // JSON array as text
    specializations: text("specializations"), // JSON array as text
    suburbsServiced: text("suburbs_serviced"), // JSON array as text
    totalSalesCount: integer("total_sales_count").default(0),
    totalSalesVolume: real("total_sales_volume").default(0),
    medianSalePrice: real("median_sale_price"),
    averageDaysOnMarket: real("average_days_on_market"),
    listingAccuracy: real("listing_accuracy"),
    ratingsAverage: real("ratings_average"),
    ratingsCount: integer("ratings_count").default(0),
    profileCompleteness: real("profile_completeness").default(0),
    dataQualityScore: real("data_quality_score").default(0),
    sourceUrl: text("source_url"),
    lastScrapedAt: integer("last_scraped_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("agents_slug_idx").on(table.slug),
    index("agents_agency_id_idx").on(table.agencyId),
    index("agents_license_number_idx").on(table.licenseNumber),
    index("agents_license_state_idx").on(table.licenseState),
    index("agents_ratings_average_idx").on(table.ratingsAverage),
    index("agents_total_sales_count_idx").on(table.totalSalesCount),
    index("agents_data_quality_score_idx").on(table.dataQualityScore),
  ]
);

// ---------------------------------------------------------------------------
// 3. suburbs
// ---------------------------------------------------------------------------
export const suburbs = sqliteTable(
  "suburbs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").unique().notNull(),
    name: text("name").notNull(),
    state: text("state").notNull(),
    postcode: text("postcode").notNull(),
    lat: real("lat"),
    lng: real("lng"),
    localGovernmentArea: text("local_government_area"),
    stateElectorate: text("state_electorate"),
    totalAgents: integer("total_agents").default(0),
    medianHousePrice: real("median_house_price"),
    medianUnitPrice: real("median_unit_price"),
    // Market stats (populated by pipeline)
    medianPrice: real("median_price"),
    priceChangeYoy: real("price_change_yoy"),
    salesVolume12m: integer("sales_volume_12m"),
    avgDaysOnMarket: real("avg_days_on_market"),
    clearanceRate: real("clearance_rate"),
    rentalYield: real("rental_yield"),
    // Demographics (populated by pipeline)
    population: integer("population"),
    medianAge: integer("median_age"),
    medianHouseholdIncome: integer("median_household_income"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("suburbs_slug_idx").on(table.slug),
    index("suburbs_state_idx").on(table.state),
    index("suburbs_postcode_idx").on(table.postcode),
    index("suburbs_name_state_idx").on(table.name, table.state),
  ]
);

// ---------------------------------------------------------------------------
// 4. agentSuburbs (junction)
// ---------------------------------------------------------------------------
export const agentSuburbs = sqliteTable(
  "agent_suburbs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    suburbId: integer("suburb_id")
      .notNull()
      .references(() => suburbs.id, { onDelete: "cascade" }),
    isPrimary: integer("is_primary").default(0),
    salesCount: integer("sales_count").default(0),
  },
  (table) => [
    uniqueIndex("agent_suburbs_agent_suburb_idx").on(
      table.agentId,
      table.suburbId
    ),
    index("agent_suburbs_suburb_id_idx").on(table.suburbId),
  ]
);

// ---------------------------------------------------------------------------
// 5. sales
// ---------------------------------------------------------------------------
export const sales = sqliteTable(
  "sales",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    agencyId: integer("agency_id").references(() => agencies.id, {
      onDelete: "set null",
    }),
    propertyAddress: text("property_address").notNull(),
    suburb: text("suburb"),
    state: text("state"),
    postcode: text("postcode"),
    propertyType: text("property_type"),
    salePrice: real("sale_price"),
    listingPrice: real("listing_price"),
    saleMethod: text("sale_method"),
    saleDate: text("sale_date"),
    daysOnMarket: integer("days_on_market"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    carSpaces: integer("car_spaces"),
    landArea: real("land_area"),
    floorArea: real("floor_area"),
    imageUrl: text("image_url"),
    sourceUrl: text("source_url"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("sales_agent_id_idx").on(table.agentId),
    index("sales_agency_id_idx").on(table.agencyId),
    index("sales_suburb_idx").on(table.suburb),
    index("sales_sale_date_idx").on(table.saleDate),
    index("sales_property_type_idx").on(table.propertyType),
    index("sales_agent_sale_date_idx").on(table.agentId, table.saleDate),
  ]
);

// ---------------------------------------------------------------------------
// 6. reviews
// ---------------------------------------------------------------------------
export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    reviewerName: text("reviewer_name"),
    reviewDate: text("review_date"),
    reviewerType: text("reviewer_type"),
    overallRating: real("overall_rating").notNull(),
    knowledgeRating: real("knowledge_rating"),
    communicationRating: real("communication_rating"),
    negotiationRating: real("negotiation_rating"),
    reviewText: text("review_text"),
    priceRange: text("price_range"),
    sourceUrl: text("source_url"),
    sourcePlatform: text("source_platform"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("reviews_agent_id_idx").on(table.agentId),
    index("reviews_overall_rating_idx").on(table.overallRating),
    index("reviews_review_date_idx").on(table.reviewDate),
  ]
);

// ---------------------------------------------------------------------------
// 7. pipelineRuns
// ---------------------------------------------------------------------------
export const pipelineRuns = sqliteTable(
  "pipeline_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    startedAt: integer("started_at", { mode: "timestamp" }),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    status: text("status").notNull().default("pending"),
    agentModel: text("agent_model"),
    targetLocation: text("target_location"),
    agenciesFound: integer("agencies_found").default(0),
    agentsFound: integer("agents_found").default(0),
    salesFound: integer("sales_found").default(0),
    reviewsFound: integer("reviews_found").default(0),
    totalCostUsd: real("total_cost_usd").default(0),
    errorLog: text("error_log"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("pipeline_runs_status_idx").on(table.status),
    index("pipeline_runs_started_at_idx").on(table.startedAt),
  ]
);

// ===========================================================================
// Relations
// ===========================================================================

export const agenciesRelations = relations(agencies, ({ many }) => ({
  agents: many(agents),
  sales: many(sales),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [agents.agencyId],
    references: [agencies.id],
  }),
  agentSuburbs: many(agentSuburbs),
  sales: many(sales),
  reviews: many(reviews),
}));

export const suburbsRelations = relations(suburbs, ({ many }) => ({
  agentSuburbs: many(agentSuburbs),
}));

export const agentSuburbsRelations = relations(agentSuburbs, ({ one }) => ({
  agent: one(agents, {
    fields: [agentSuburbs.agentId],
    references: [agents.id],
  }),
  suburb: one(suburbs, {
    fields: [agentSuburbs.suburbId],
    references: [suburbs.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  agent: one(agents, {
    fields: [sales.agentId],
    references: [agents.id],
  }),
  agency: one(agencies, {
    fields: [sales.agencyId],
    references: [agencies.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  agent: one(agents, {
    fields: [reviews.agentId],
    references: [agents.id],
  }),
}));

// ===========================================================================
// Inferred types
// ===========================================================================

// --- Agency ---
export type Agency = InferSelectModel<typeof agencies>;
export type NewAgency = InferInsertModel<typeof agencies>;

// --- Agent ---
export type Agent = InferSelectModel<typeof agents>;
export type NewAgent = InferInsertModel<typeof agents>;

// --- Suburb ---
export type Suburb = InferSelectModel<typeof suburbs>;
export type NewSuburb = InferInsertModel<typeof suburbs>;

// --- AgentSuburb ---
export type AgentSuburb = InferSelectModel<typeof agentSuburbs>;
export type NewAgentSuburb = InferInsertModel<typeof agentSuburbs>;

// --- Sale ---
export type Sale = InferSelectModel<typeof sales>;
export type NewSale = InferInsertModel<typeof sales>;

// --- Review ---
export type Review = InferSelectModel<typeof reviews>;
export type NewReview = InferInsertModel<typeof reviews>;

// --- PipelineRun ---
export type PipelineRun = InferSelectModel<typeof pipelineRuns>;
export type NewPipelineRun = InferInsertModel<typeof pipelineRuns>;

// ===========================================================================
// Convenience composite types
// ===========================================================================

export type AgentWithRelations = Agent & {
  agency: Agency | null;
  suburbs: (AgentSuburb & { suburb: Suburb })[];
  sales: Sale[];
  reviews: Review[];
};

export type AgencyWithAgents = Agency & {
  agents: Agent[];
};

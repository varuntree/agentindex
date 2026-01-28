/**
 * Pipeline Zod schemas for structured output validation
 * Aligned with src/lib/db/schema.ts
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sale output schema
// ---------------------------------------------------------------------------
export const SaleOutputSchema = z.object({
  propertyAddress: z.string().describe('Full property address'),
  suburb: z.string().optional().describe('Suburb name'),
  state: z.string().optional().describe('State code (NSW, VIC, etc)'),
  postcode: z.string().optional().describe('4-digit postcode'),
  propertyType: z
    .enum(['house', 'apartment', 'unit', 'townhouse', 'land', 'other'])
    .optional()
    .describe('Type of property'),
  salePrice: z.number().optional().describe('Sale price in AUD'),
  listingPrice: z.number().optional().describe('Original listing price'),
  saleMethod: z
    .enum(['auction', 'private_treaty', 'tender', 'eoi', 'other'])
    .optional()
    .describe('How the property was sold'),
  saleDate: z.string().optional().describe('Date of sale YYYY-MM-DD'),
  daysOnMarket: z.number().int().optional().describe('Days listed before sale'),
  bedrooms: z.number().int().optional().describe('Number of bedrooms'),
  bathrooms: z.number().int().optional().describe('Number of bathrooms'),
  carSpaces: z.number().int().optional().describe('Parking spaces'),
  landArea: z.number().optional().describe('Land area sqm'),
  floorArea: z.number().optional().describe('Floor area sqm'),
  imageUrl: z.string().url().optional().describe('Property image URL'),
  sourceUrl: z.string().url().optional().describe('Source listing URL'),
});

export type SaleOutput = z.infer<typeof SaleOutputSchema>;

// ---------------------------------------------------------------------------
// Review output schema
// ---------------------------------------------------------------------------
export const ReviewOutputSchema = z.object({
  reviewerName: z.string().optional().describe('Name of reviewer'),
  reviewDate: z.string().optional().describe('Date of review YYYY-MM-DD'),
  reviewerType: z
    .enum(['buyer', 'seller', 'landlord', 'tenant', 'other'])
    .optional()
    .describe('Type of transaction'),
  overallRating: z.number().min(1).max(5).describe('Overall rating 1-5'),
  knowledgeRating: z.number().min(1).max(5).optional().describe('Local knowledge rating'),
  communicationRating: z.number().min(1).max(5).optional().describe('Communication rating'),
  negotiationRating: z.number().min(1).max(5).optional().describe('Negotiation skill rating'),
  reviewText: z.string().optional().describe('Full review text'),
  priceRange: z.string().optional().describe('Property price range'),
  sourceUrl: z.string().url().optional().describe('Source review URL'),
  sourcePlatform: z
    .enum(['ratemyagent', 'google', 'agency_website', 'domain', 'other'])
    .optional()
    .describe('Review platform'),
});

export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

// ---------------------------------------------------------------------------
// Agent output schema
// ---------------------------------------------------------------------------
export const AgentOutputSchema = z.object({
  firstName: z.string().describe('Agent first name'),
  lastName: z.string().describe('Agent last name'),
  email: z.string().email().optional().nullable().describe('Email address'),
  phone: z.string().optional().nullable().describe('Office phone'),
  mobilePhone: z.string().optional().nullable().describe('Mobile phone'),
  photoUrl: z.string().url().optional().nullable().describe('Profile photo URL'),
  licenseNumber: z.string().optional().nullable().describe('License number'),
  licenseStatus: z
    .enum(['active', 'suspended', 'cancelled', 'unknown'])
    .optional()
    .nullable()
    .describe('License status'),
  licenseState: z.string().optional().nullable().describe('Licensing state'),
  bio: z.string().optional().nullable().describe('Agent biography'),
  yearsActive: z.number().int().optional().nullable().describe('Years in industry'),
  languagesSpoken: z.array(z.string()).optional().nullable().describe('Languages spoken'),
  specializations: z.array(z.string()).optional().nullable().describe('Property specializations'),
  suburbsServiced: z.array(z.string()).default([]).describe('Suburbs agent works in'),
  sourceUrl: z.string().url().optional().nullable().describe('Agent profile URL'),
  sales: z.array(SaleOutputSchema).optional().nullable().describe('Recent sales'),
  reviews: z.array(ReviewOutputSchema).optional().nullable().describe('Agent reviews'),
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;

// ---------------------------------------------------------------------------
// Agency output schema
// ---------------------------------------------------------------------------
export const AgencyOutputSchema = z.object({
  name: z.string().describe('Agency name'),
  brandName: z.string().optional().nullable().describe('Brand/franchise name'),
  logoUrl: z.string().url().optional().nullable().describe('Agency logo URL'),
  websiteUrl: z.string().url().optional().nullable().describe('Agency website'),
  phone: z.string().optional().nullable().describe('Office phone'),
  email: z.string().email().optional().nullable().describe('Contact email'),
  streetAddress: z.string().optional().nullable().describe('Street address'),
  suburb: z.string().describe('Suburb location'),
  state: z.string().describe('State (NSW, VIC, etc)'),
  postcode: z.string().describe('4-digit postcode'),
  lat: z.number().optional().nullable().describe('Latitude'),
  lng: z.number().optional().nullable().describe('Longitude'),
  description: z.string().optional().nullable().describe('Agency description'),
  sourceUrl: z.string().url().optional().nullable().describe('Source URL'),
  agents: z.array(AgentOutputSchema).default([]).describe('List of agents'),
});

export type AgencyOutput = z.infer<typeof AgencyOutputSchema>;

// ---------------------------------------------------------------------------
// Pipeline config schema
// ---------------------------------------------------------------------------
export const PipelineConfigSchema = z.object({
  location: z.string().describe('Target location e.g. "Bondi Beach, NSW"'),
  agencies: z.array(z.string()).optional().describe('Specific agencies to research'),
  discoverAgencies: z.boolean().default(false).describe('Auto-discover agencies'),
  limit: z.number().int().default(10).describe('Max agencies to process'),
  enrichSales: z.boolean().default(true).describe('Fetch sales history'),
  enrichReviews: z.boolean().default(true).describe('Fetch reviews'),
  enrichLicenses: z.boolean().default(true).describe('Verify licenses'),
});

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Generate a URL-safe slug from name and location
 */
export function generateSlug(...parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Calculate data quality score for an agent
 */
export function calculateAgentQualityScore(agent: AgentOutput): number {
  let score = 0;
  const weights = {
    photo: 10,
    bio: 15,
    contact: 15,
    license: 20,
    experience: 10,
    specializations: 10,
    sales: 10,
    reviews: 10,
  };

  if (agent.photoUrl) score += weights.photo;
  if (agent.bio && agent.bio.length > 100) score += weights.bio;
  if (agent.phone || agent.email) score += weights.contact;
  if (agent.licenseNumber && agent.licenseStatus === 'active') score += weights.license;
  if (agent.yearsActive) score += weights.experience;
  if (agent.specializations && agent.specializations.length > 0) score += weights.specializations;
  if (agent.sales && agent.sales.length > 0) score += weights.sales;
  if (agent.reviews && agent.reviews.length > 0) score += weights.reviews;

  return Math.round(score);
}

/**
 * Calculate average rating from reviews
 */
export function calculateAverageRating(reviews: ReviewOutput[]): number | null {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.overallRating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

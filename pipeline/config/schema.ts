/**
 * Pipeline configuration schema and loader
 */

import { z } from 'zod';
import { readFileSync } from 'fs';

// ---------------------------------------------------------------------------
// Schema Definitions
// ---------------------------------------------------------------------------

const LocationSchema = z.object({
  suburb: z.string(),
  state: z.string(),
});

const AgenciesConfigSchema = z.object({
  mode: z.enum(['discover', 'specified']),
  list: z.array(z.string()).default([]),
  limit: z.number().int().positive().default(20),
});

const EnrichmentConfigSchema = z.object({
  licenses: z.boolean().default(true),
  sales: z.boolean().default(true),
  reviews: z.boolean().default(true),
  images: z.boolean().default(true),
});

const RateLimitsConfigSchema = z.object({
  max_concurrent_agents: z.number().int().positive().default(10),
  requests_per_domain_per_minute: z.number().int().positive().default(30),
});

const QualityConfigSchema = z.object({
  min_agent_quality_score: z.number().int().min(0).max(100).default(30),
  require_license_verification: z.boolean().default(false),
});

const StorageConfigSchema = z.object({
  download_images: z.boolean().default(true),
  image_max_size_mb: z.number().positive().default(5),
});

export const PipelineConfigSchema = z.object({
  locations: z.array(LocationSchema).default([]),
  agencies: AgenciesConfigSchema.default({
    mode: 'discover',
    list: [],
    limit: 20,
  }),
  enrichment: EnrichmentConfigSchema.default({
    licenses: true,
    sales: true,
    reviews: true,
    images: true,
  }),
  rate_limits: RateLimitsConfigSchema.default({
    max_concurrent_agents: 10,
    requests_per_domain_per_minute: 30,
  }),
  quality: QualityConfigSchema.default({
    min_agent_quality_score: 30,
    require_license_verification: false,
  }),
  storage: StorageConfigSchema.default({
    download_images: true,
    image_max_size_mb: 5,
  }),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
export type LocationConfig = z.infer<typeof LocationSchema>;
export type AgenciesConfig = z.infer<typeof AgenciesConfigSchema>;
export type EnrichmentConfig = z.infer<typeof EnrichmentConfigSchema>;
export type RateLimitsConfig = z.infer<typeof RateLimitsConfigSchema>;
export type QualityConfig = z.infer<typeof QualityConfigSchema>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;

// ---------------------------------------------------------------------------
// Default Configuration
// ---------------------------------------------------------------------------

export const defaultPipelineConfig: PipelineConfig = {
  locations: [],
  agencies: {
    mode: 'discover',
    list: [],
    limit: 20,
  },
  enrichment: {
    licenses: true,
    sales: true,
    reviews: true,
    images: true,
  },
  rate_limits: {
    max_concurrent_agents: 10,
    requests_per_domain_per_minute: 30,
  },
  quality: {
    min_agent_quality_score: 30,
    require_license_verification: false,
  },
  storage: {
    download_images: true,
    image_max_size_mb: 5,
  },
};

// ---------------------------------------------------------------------------
// Config Loader
// ---------------------------------------------------------------------------

/**
 * Load and validate a pipeline config file
 * @param path - Path to JSON config file
 * @returns Validated PipelineConfig
 * @throws Error if file not found or validation fails
 */
export function loadPipelineConfig(path: string): PipelineConfig {
  const fileContent = readFileSync(path, 'utf-8');
  const jsonData = JSON.parse(fileContent);
  return PipelineConfigSchema.parse(jsonData);
}

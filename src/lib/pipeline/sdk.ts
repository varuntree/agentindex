/**
 * Claude Agent SDK Integration
 *
 * Implements query() calls for each pipeline phase:
 * 1. Agency Discovery
 * 2. Team Discovery
 * 3. Agent Enrichment (parallel sub-agents)
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { AgencyBasic, AgentStub, EnrichedAgent } from './types';
import {
  buildAgencyDiscoveryPrompt,
  buildTeamDiscoveryPrompt,
  buildAgentEnrichmentPrompt,
} from '../../../pipeline/agents/skills';
import type { PipelineEvent } from './types';

// ---------------------------------------------------------------------------
// JSON Schema Definitions (for SDK outputFormat)
// These are plain JSON Schemas, not Zod schemas, for SDK compatibility
// ---------------------------------------------------------------------------

const AGENCY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    brandName: { type: ['string', 'null'] },
    websiteUrl: { type: ['string', 'null'] },
    phone: { type: ['string', 'null'] },
    email: { type: ['string', 'null'] },
    streetAddress: { type: ['string', 'null'] },
    suburb: { type: 'string' },
    state: { type: 'string' },
    postcode: { type: 'string' },
    logoUrl: { type: ['string', 'null'] },
  },
  required: ['name', 'suburb', 'state', 'postcode'],
} as const;

const TEAM_JSON_SCHEMA = {
  type: 'object',
  properties: {
    team: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          photoUrl: { type: ['string', 'null'] },
          phone: { type: ['string', 'null'] },
          email: { type: ['string', 'null'] },
          profileUrl: { type: ['string', 'null'] },
        },
        required: ['firstName', 'lastName'],
      },
    },
  },
  required: ['team'],
} as const;

const ENRICHMENT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    agents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          photoUrl: { type: ['string', 'null'] },
          bio: { type: ['string', 'null'] },
          yearsActive: { type: ['number', 'null'] },
          languagesSpoken: { type: 'array', items: { type: 'string' } },
          specializations: { type: 'array', items: { type: 'string' } },
          suburbsServiced: { type: 'array', items: { type: 'string' } },
          phone: { type: ['string', 'null'] },
          email: { type: ['string', 'null'] },
          sales: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                propertyAddress: { type: 'string' },
                suburb: { type: ['string', 'null'] },
                state: { type: ['string', 'null'] },
                postcode: { type: ['string', 'null'] },
                propertyType: { type: ['string', 'null'] },
                salePrice: { type: ['number', 'null'] },
                saleDate: { type: ['string', 'null'] },
                bedrooms: { type: ['number', 'null'] },
                bathrooms: { type: ['number', 'null'] },
                carSpaces: { type: ['number', 'null'] },
              },
              required: ['propertyAddress'],
            },
          },
          reviews: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                overallRating: { type: 'number' },
                reviewText: { type: ['string', 'null'] },
                reviewerName: { type: ['string', 'null'] },
                reviewDate: { type: ['string', 'null'] },
                sourcePlatform: { type: ['string', 'null'] },
              },
              required: ['overallRating'],
            },
          },
        },
        required: ['firstName', 'lastName', 'suburbsServiced'],
      },
    },
  },
  required: ['agents'],
} as const;

// ---------------------------------------------------------------------------
// Zod Schemas for Structured Output
// ---------------------------------------------------------------------------

export const AgencyOutputSchema = z.object({
  name: z.string(),
  brandName: z.string().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  streetAddress: z.string().nullable().optional(),
  suburb: z.string(),
  state: z.string(),
  postcode: z.string(),
  logoUrl: z.string().nullable().optional(),
});

export type AgencyOutput = z.infer<typeof AgencyOutputSchema>;

export const AgentStubSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  photoUrl: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  profileUrl: z.string().nullable().optional(),
});

export const TeamOutputSchema = z.object({
  team: z.array(AgentStubSchema),
});

export type TeamOutput = z.infer<typeof TeamOutputSchema>;

export const SaleSchema = z.object({
  propertyAddress: z.string(),
  suburb: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  propertyType: z.enum(['house', 'apartment', 'unit', 'townhouse', 'land']).nullable().optional(),
  salePrice: z.number().nullable().optional(),
  saleDate: z.string().nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  carSpaces: z.number().nullable().optional(),
});

export const ReviewSchema = z.object({
  overallRating: z.number().min(1).max(5),
  reviewText: z.string().nullable().optional(),
  reviewerName: z.string().nullable().optional(),
  reviewDate: z.string().nullable().optional(),
  sourcePlatform: z.enum(['ratemyagent', 'google', 'agency_website']).nullable().optional(),
});

export const EnrichedAgentSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  photoUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  yearsActive: z.number().nullable().optional(),
  languagesSpoken: z.array(z.string()).optional().default([]),
  specializations: z.array(z.string()).optional().default([]),
  suburbsServiced: z.array(z.string()),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  sales: z.array(SaleSchema).optional().default([]),
  reviews: z.array(ReviewSchema).optional().default([]),
});

export const EnrichmentOutputSchema = z.object({
  agents: z.array(EnrichedAgentSchema),
});

export type EnrichmentOutput = z.infer<typeof EnrichmentOutputSchema>;

// ---------------------------------------------------------------------------
// SDK Options
// ---------------------------------------------------------------------------

const SDK_OPTIONS = {
  allowedTools: ['WebSearch', 'WebFetch'] as string[],
  maxTurns: 15,
  maxBudgetUsd: 1.0,
  permissionMode: 'bypassPermissions' as const,
  allowDangerouslySkipPermissions: true,
  includePartialMessages: true,
};

function truncateForLog(value: unknown, maxChars = 4000): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return value.length > maxChars ? `${value.slice(0, maxChars)}…` : value;
  try {
    const json = JSON.stringify(value);
    if (json.length <= maxChars) return value;
    return `${json.slice(0, maxChars)}…`;
  } catch {
    return '[Unserializable tool output]';
  }
}

function createTimeoutAbortController(
  parent: AbortController | undefined,
  timeoutMs: number
): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();

  const onAbort = () => {
    try {
      controller.abort(parent?.signal.reason);
    } catch {
      controller.abort();
    }
  };

  if (parent) {
    if (parent.signal.aborted) onAbort();
    parent.signal.addEventListener('abort', onAbort);
  }

  const timer = setTimeout(() => {
    try {
      controller.abort(`Timeout after ${timeoutMs}ms`);
    } catch {
      controller.abort();
    }
  }, timeoutMs);

  return {
    controller,
    cleanup: () => {
      clearTimeout(timer);
      if (parent) parent.signal.removeEventListener('abort', onAbort);
    },
  };
}

// ---------------------------------------------------------------------------
// Agency Discovery
// ---------------------------------------------------------------------------

export async function runAgencyDiscovery(input: {
  emit: (event: Omit<PipelineEvent, 'id' | 'timestamp' | 'runId'>) => void;
  abortController?: AbortController;
  agencyName: string;
  suburb: string;
  state: string;
}): Promise<AgencyBasic | null> {
  const { emit, abortController, ...task } = input;
  const prompt = buildAgencyDiscoveryPrompt(task);
  emit({
    type: 'info',
    message: `Searching for ${task.agencyName} official website...`,
  });

  try {
    let result: AgencyOutput | null = null;

    const { controller, cleanup } = createTimeoutAbortController(abortController, 120_000);
    try {
      for await (const message of query({
        prompt,
        options: {
          ...SDK_OPTIONS,
          abortController: controller,
          outputFormat: {
            type: 'json_schema',
            schema: AGENCY_JSON_SCHEMA,
          },
        },
      })) {
        // Broadcast SDK messages for transparency
        broadcastSdkMessage(emit, message);

        // Handle result
        if (message.type === 'result') {
          if (message.subtype === 'success' && message.structured_output) {
            const parsed = AgencyOutputSchema.safeParse(message.structured_output);
            if (parsed.success) {
              result = parsed.data;
              emit({
                type: 'validation',
                validation: {
                  scope: 'agency',
                  ok: true,
                  summary: `Agency output validated (${result.name})`,
                },
              });
              emit({
                type: 'info',
                message: `Found agency: ${result.name}${result.websiteUrl ? ` at ${result.websiteUrl}` : ''}`,
              });
            } else {
              emit({
                type: 'validation',
                validation: {
                  scope: 'agency',
                  ok: false,
                  summary: 'Agency output failed validation',
                  details: parsed.error.flatten(),
                },
              });
            }
          } else if (message.subtype !== 'success') {
            emit({
              type: 'error',
              error: `Agency discovery failed: ${message.subtype}`,
            });
          }
        }
      }
    } finally {
      cleanup();
    }

    if (!result) return null;

    return {
      name: result.name,
      brandName: result.brandName ?? undefined,
      websiteUrl: result.websiteUrl ?? undefined,
      phone: result.phone ?? undefined,
      email: result.email ?? undefined,
      streetAddress: result.streetAddress ?? undefined,
      suburb: result.suburb,
      state: result.state,
      postcode: result.postcode,
      logoUrl: result.logoUrl ?? undefined,
    };
  } catch (error) {
    if (abortController?.signal.aborted) {
      emit({ type: 'info', message: 'Agency discovery stopped' });
      return null;
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    emit({ type: 'error', error: `Agency discovery error: ${msg}` });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Team Discovery
// ---------------------------------------------------------------------------

export async function runTeamDiscovery(input: {
  emit: (event: Omit<PipelineEvent, 'id' | 'timestamp' | 'runId'>) => void;
  abortController?: AbortController;
  websiteUrl: string;
}): Promise<AgentStub[]> {
  const { emit, websiteUrl, abortController } = input;
  const prompt = buildTeamDiscoveryPrompt({ websiteUrl });

  emit({
    type: 'info',
    message: `Discovering team members at ${websiteUrl}...`,
  });

  try {
    let result: TeamOutput = { team: [] };

    const { controller, cleanup } = createTimeoutAbortController(abortController, 120_000);
    try {
      for await (const message of query({
        prompt,
        options: {
          ...SDK_OPTIONS,
          abortController: controller,
          outputFormat: {
            type: 'json_schema',
            schema: TEAM_JSON_SCHEMA,
          },
        },
      })) {
        broadcastSdkMessage(emit, message);

        if (message.type === 'result') {
          if (message.subtype === 'success' && message.structured_output) {
            const parsed = TeamOutputSchema.safeParse(message.structured_output);
            if (parsed.success) {
              result = parsed.data;
              emit({
                type: 'validation',
                validation: {
                  scope: 'team',
                  ok: true,
                  summary: `Team output validated (${result.team.length} members)`,
                },
              });
              emit({
                type: 'info',
                message: `Found ${result.team.length} team members`,
              });
            } else {
              emit({
                type: 'validation',
                validation: {
                  scope: 'team',
                  ok: false,
                  summary: 'Team output failed validation',
                  details: parsed.error.flatten(),
                },
              });
            }
          } else if (message.subtype !== 'success') {
            emit({
              type: 'error',
              error: `Team discovery failed: ${message.subtype}`,
            });
          }
        }
      }
    } finally {
      cleanup();
    }

    return result.team.map((a) => ({
      firstName: a.firstName,
      lastName: a.lastName,
      photoUrl: a.photoUrl ?? undefined,
      phone: a.phone ?? undefined,
      email: a.email ?? undefined,
      profileUrl: a.profileUrl ?? undefined,
    }));
  } catch (error) {
    if (abortController?.signal.aborted) {
      emit({ type: 'info', message: 'Team discovery stopped' });
      return [];
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    emit({ type: 'error', error: `Team discovery error: ${msg}` });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Agent Enrichment (Sub-Agent)
// ---------------------------------------------------------------------------

export async function runAgentEnrichment(
  emit: (event: Omit<PipelineEvent, 'id' | 'timestamp' | 'runId'>) => void,
  abortController: AbortController | undefined,
  agents: AgentStub[],
  agency: AgencyBasic,
  suburb: string,
  state: string,
  subAgentId: number
): Promise<EnrichedAgent[]> {
  const agent1 = agents[0];
  const agent2 = agents[1] ?? agents[0]; // Handle odd count

  const agentNames = agents.map((a) => `${a.firstName} ${a.lastName}`);

  emit({ type: 'sub_agent_start', subAgentId, agentNames });

  const prompt = buildAgentEnrichmentPrompt({
    agent1FirstName: agent1.firstName,
    agent1LastName: agent1.lastName,
    agent2FirstName: agent2.firstName,
    agent2LastName: agent2.lastName,
    agencyName: agency.name,
    agencyWebsite: agency.websiteUrl ?? '',
    suburb,
    state,
  });

  try {
    let result: EnrichmentOutput = { agents: [] };

    const { controller, cleanup } = createTimeoutAbortController(abortController, 180_000);
    try {
      for await (const message of query({
        prompt,
        options: {
          ...SDK_OPTIONS,
          abortController: controller,
          outputFormat: {
            type: 'json_schema',
            schema: ENRICHMENT_JSON_SCHEMA,
          },
        },
      })) {
        broadcastSdkMessage(emit, message, subAgentId);

        if (message.type === 'result') {
          if (message.subtype === 'success' && message.structured_output) {
            const parsed = EnrichmentOutputSchema.safeParse(message.structured_output);
            if (parsed.success) {
              result = parsed.data;
              emit({
                type: 'validation',
                subAgentId,
                validation: {
                  scope: 'enrichment',
                  ok: true,
                  summary: `Enrichment output validated (${result.agents.length} agents)`,
                },
              });
            } else {
              emit({
                type: 'validation',
                subAgentId,
                validation: {
                  scope: 'enrichment',
                  ok: false,
                  summary: 'Enrichment output failed validation',
                  details: parsed.error.flatten(),
                },
              });
            }
          } else if (message.subtype !== 'success') {
            emit({
              type: 'sub_agent_error',
              subAgentId,
              error: `Enrichment failed: ${message.subtype}`,
            });
          }
        }
      }
    } finally {
      cleanup();
    }

    // Convert to EnrichedAgent format
    return result.agents.map((a) => ({
      firstName: a.firstName,
      lastName: a.lastName,
      photoUrl: a.photoUrl ?? undefined,
      bio: a.bio ?? undefined,
      yearsActive: a.yearsActive ?? undefined,
      languagesSpoken: a.languagesSpoken ?? [],
      specializations: a.specializations ?? [],
      suburbsServiced: a.suburbsServiced,
      phone: a.phone ?? undefined,
      email: a.email ?? undefined,
      sales: a.sales?.map((s) => ({
        propertyAddress: s.propertyAddress,
        suburb: s.suburb ?? undefined,
        state: s.state ?? undefined,
        postcode: s.postcode ?? undefined,
        propertyType: s.propertyType ?? undefined,
        salePrice: s.salePrice ?? undefined,
        saleDate: s.saleDate ?? undefined,
        bedrooms: s.bedrooms ?? undefined,
        bathrooms: s.bathrooms ?? undefined,
        carSpaces: s.carSpaces ?? undefined,
      })) ?? [],
      reviews: a.reviews?.map((r) => ({
        overallRating: r.overallRating,
        reviewText: r.reviewText ?? undefined,
        reviewerName: r.reviewerName ?? undefined,
        reviewDate: r.reviewDate ?? undefined,
        sourcePlatform: r.sourcePlatform ?? undefined,
      })) ?? [],
    }));
  } catch (error) {
    if (abortController?.signal.aborted) {
      emit({ type: 'sub_agent', subAgentId, message: 'Enrichment stopped' });
      return [];
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    emit({
      type: 'sub_agent_error',
      subAgentId,
      error: msg,
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// SDK Message Broadcasting
// ---------------------------------------------------------------------------

function broadcastSdkMessage(
  emit: (event: Omit<PipelineEvent, 'id' | 'timestamp' | 'runId'>) => void,
  message: unknown,
  subAgentId?: number
) {
  const msg = message as Record<string, unknown>;
  const msgType = msg.type as string | undefined;

  if (msgType === 'tool_result' && 'content' in msg) {
    emit({
      type: 'tool_result',
      subAgentId,
      toolOutput: truncateForLog(msg.content),
    });
    return;
  }

  const messageObj = msg.message as Record<string, unknown> | undefined;
  const content = (messageObj?.content ?? []) as Array<{
    type: string;
    text?: string;
    name?: string;
    input?: unknown;
    content?: unknown;
  }>;

  for (const block of content ?? []) {
    if (block.type === 'text' && block.text) {
      emit({
        type: 'reasoning',
        subAgentId,
        reasoning: block.text,
      });
    } else if (block.type === 'tool_use') {
      emit({
        type: 'tool_call',
        subAgentId,
        toolName: block.name,
        toolInput: truncateForLog(block.input),
      });
    } else if (block.type === 'tool_result') {
      emit({
        type: 'tool_result',
        subAgentId,
        toolOutput: truncateForLog(block.content),
      });
    }
  }
}

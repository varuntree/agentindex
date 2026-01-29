/**
 * Pipeline Orchestrator
 *
 * Coordinates the data pipeline:
 * 1. Check existing agents in DB
 * 2. Agency discovery (if new)
 * 3. Team discovery
 * 4. Parallel agent enrichment (2 agents per sub-agent)
 */

import { createEmitter } from './broadcast';
import type {
  PipelineRequest,
  AgentStub,
  AgencyBasic,
  EnrichedAgent,
  PipelineRunStats,
  PipelineRunStatus,
  SubAgentStatus,
} from './types';
import { getAgentsByAgencyName, getAgencyByName, resolveSuburbFromLocation } from '@/lib/db/queries';
import {
  runAgencyDiscovery,
  runTeamDiscovery,
  runAgentEnrichment,
} from './sdk';
import { storeAgency, storeAgent } from './storage';
import { completePipelineRun, upsertSubAgent } from './run-store';
import { getAbortController } from './registry';

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

const MAX_CONCURRENT_SUB_AGENTS = 6;

export async function runPipeline(input: {
  runId: number;
  request: PipelineRequest;
}): Promise<void> {
  const { runId, request } = input;
  const emit = createEmitter(runId);
  const { location } = request;
  const abortController = getAbortController(runId) ?? undefined;
  const isStopped = () => Boolean(abortController?.signal.aborted);

  const errors: string[] = [];
  const stats: PipelineRunStats = {
    agenciesFound: 0,
    agentsFound: 0,
    salesFound: 0,
    reviewsFound: 0,
  };

  try {
    const matchedSuburb = resolveSuburbFromLocation(location);
    const suburbName = matchedSuburb?.name ?? location.split(',')[0]?.trim() ?? location.trim();
    const state = matchedSuburb?.state ?? (location.toUpperCase().match(/\b(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\b/)?.[1] ?? 'NSW');

    emit({
      type: 'info',
      message: `Starting pipeline in ${matchedSuburb ? `${matchedSuburb.name}, ${matchedSuburb.state}` : location}`,
    });

    if (isStopped()) return;

    // Process each requested agency sequentially (sub-agents run in parallel per agency)
    for (let agencyIndex = 0; agencyIndex < request.agencies.length; agencyIndex++) {
      if (isStopped()) return;
      const { agencyName, limit } = request.agencies[agencyIndex];

      emit({
        type: 'phase',
        phase: 1,
        message: `Agency ${agencyIndex + 1}/${request.agencies.length}: ${agencyName}`,
      });

      // Step 1: Check existing agents
      emit({ type: 'info', message: `Checking existing agents for "${agencyName}"...` });
      const existing = getAgentsByAgencyName(agencyName);
      emit({ type: 'info', message: `Found ${existing.length} existing agents` });

      if (isStopped()) return;

      if (existing.length >= limit) {
        emit({
          type: 'info',
          message: `Skipping "${agencyName}" (limit ${limit} already reached)`,
        });
        continue;
      }

      const neededAgents = limit - existing.length;
      stats.agenciesFound++;
      stats.agentsNeeded = (stats.agentsNeeded ?? 0) + neededAgents;

      // Step 2: Agency Discovery (if new)
      let agency: AgencyBasic | null = null;
      const existingAgency = getAgencyByName(agencyName);

      if (!existingAgency) {
        if (isStopped()) return;
        emit({ type: 'phase', phase: 1, message: `Discovering agency website for "${agencyName}"...` });

        agency = await runAgencyDiscovery({
          emit,
          abortController,
          agencyName,
          suburb: suburbName,
          state,
        });

        if (!agency) {
          if (isStopped()) return;
          const err = `"${agencyName}": agency discovery failed`;
          errors.push(err);
          emit({ type: 'error', error: err });
          continue;
        }

        if (!agency.websiteUrl) {
          if (isStopped()) return;
          const err = `"${agencyName}": agency discovery returned no websiteUrl`;
          errors.push(err);
          emit({ type: 'error', error: err });
          continue;
        }

        // Store agency in database
        const storedAgency = await storeAgency(agency);
        agency.id = storedAgency.id;
        emit({ type: 'info', message: `Agency stored: ${agency.name}` });
      } else {
        agency = {
          id: existingAgency.id,
          name: existingAgency.name,
          brandName: existingAgency.brandName ?? undefined,
          websiteUrl: existingAgency.websiteUrl ?? undefined,
          logoUrl: existingAgency.logoUrl ?? undefined,
          phone: existingAgency.phone ?? undefined,
          email: existingAgency.email ?? undefined,
          streetAddress: existingAgency.streetAddress ?? undefined,
          suburb: existingAgency.suburb ?? suburbName,
          state: existingAgency.state ?? state,
          postcode: existingAgency.postcode ?? matchedSuburb?.postcode ?? '',
        };
        emit({ type: 'info', message: `Agency found: ${agency.name}` });
      }

      if (isStopped()) return;

      // Step 3: Team Discovery
      emit({ type: 'phase', phase: 2, message: `Discovering team for "${agency.name}"...` });

      if (!agency.websiteUrl) {
        const err = `"${agencyName}": cannot discover team without websiteUrl`;
        errors.push(err);
        emit({ type: 'error', error: err });
        continue;
      }

      const team = await runTeamDiscovery({ emit, abortController, websiteUrl: agency.websiteUrl });
      if (isStopped()) return;

      if (team.length === 0) {
        const err = `"${agencyName}": no team members found`;
        errors.push(err);
        emit({ type: 'error', error: err });
        continue;
      }

      // Filter out existing agents
      const existingNames = new Set(
        existing.map((a) => `${a.firstName} ${a.lastName}`.toLowerCase())
      );

      const newAgents = team.filter(
        (t) => !existingNames.has(`${t.firstName} ${t.lastName}`.toLowerCase())
      );

      const agentsToEnrich = newAgents.slice(0, neededAgents);
      emit({
        type: 'info',
        message: `${agentsToEnrich.length} new agents to enrich (${team.length} total found, ${existing.length} existing)`,
        stats: { ...stats },
      });

      if (agentsToEnrich.length === 0) {
        emit({
          type: 'info',
          message: `No new agents to process for "${agencyName}"`,
        });
        continue;
      }

      if (isStopped()) return;

      // Step 4: Parallel Enrichment (2 agents per sub-agent)
      emit({ type: 'phase', phase: 3, message: `Enriching agents for "${agency.name}"...` });

      const pairs = chunkArray(agentsToEnrich, 2);
      emit({
        type: 'info',
        message: `Spawning ${pairs.length} sub-agents (2 agents each)`,
      });

      // Concurrency-limited execution
      const results: EnrichedAgent[][] = [];
      for (let i = 0; i < pairs.length; i += MAX_CONCURRENT_SUB_AGENTS) {
        if (isStopped()) return;
        const batch = pairs.slice(i, i + MAX_CONCURRENT_SUB_AGENTS);
        const batchResults = await Promise.all(
          batch.map((pair, batchIdx) =>
            runSubAgent({
              emit,
              runId,
              agents: pair,
              agency: agency!,
              suburbName,
              state,
              subAgentId: i + batchIdx,
              primarySuburb: matchedSuburb ?? null,
              stats,
              errors,
              abortController,
            })
          )
        );
        results.push(...batchResults);
      }

      const stored = results.reduce((sum, r) => sum + r.length, 0);
      emit({
        type: 'info',
        message: `Finished "${agencyName}": stored ${stored} agents`,
        stats: { ...stats },
      });
    }

    if (isStopped()) return;

    const runStatus: PipelineRunStatus =
      errors.length === 0 ? 'success' : stats.agentsFound > 0 ? 'partial_success' : 'error';

    emit({
      type: 'complete',
      message: `Pipeline finished. Stored ${stats.agentsFound} agents across ${stats.agenciesFound} agencies.`,
      stats: { ...stats },
      runStatus: { status: runStatus, stats: { ...stats } },
    });

    completePipelineRun(runId, runStatus, {
      agenciesFound: stats.agenciesFound,
      agentsFound: stats.agentsFound,
      salesFound: stats.salesFound,
      reviewsFound: stats.reviewsFound,
      errorLog: errors.length > 0 ? JSON.stringify(errors) : null,
    });
  } catch (error) {
    if (abortController?.signal.aborted) return;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(msg);
    emit({ type: 'error', error: msg });
    completePipelineRun(runId, 'error', { errorLog: JSON.stringify(errors) });
  }
}

// ---------------------------------------------------------------------------
// Sub-Agent Execution
// ---------------------------------------------------------------------------

async function runSubAgent(
  input: {
    emit: ReturnType<typeof createEmitter>;
    runId: number;
    agents: AgentStub[];
    agency: AgencyBasic;
    suburbName: string;
    state: string;
    subAgentId: number;
    primarySuburb: { id: number; name: string; state: string; postcode: string } | null;
    stats: PipelineRunStats;
    errors: string[];
    abortController?: AbortController;
  }
): Promise<EnrichedAgent[]> {
  const { emit, runId, agents, agency, suburbName, state, subAgentId, primarySuburb, stats, errors, abortController } = input;
  const agentNames = agents.map((a) => `${a.firstName} ${a.lastName}`);
  const goals = ['Enrich agent profiles', 'Collect sales and reviews'];

  if (abortController?.signal.aborted) {
    upsertSubAgent(runId, subAgentId, {
      status: 'error',
      agentNames,
      goals,
      error: 'Stopped',
      completedAt: Date.now(),
    });
    emit({
      type: 'status',
      subAgentId,
      subAgentStatus: { status: 'error', goals, agentNames, message: 'Stopped' },
    });
    return [];
  }

  try {
    upsertSubAgent(runId, subAgentId, { status: 'running', agentNames, goals });
    emit({
      type: 'status',
      subAgentId,
      subAgentStatus: { status: 'running', agentNames, goals, message: 'Running' },
    });

    const enrichedAgents = await runAgentEnrichment(
      emit,
      abortController,
      agents,
      agency,
      suburbName,
      state,
      subAgentId
    );

    const agentsToStore: EnrichedAgent[] =
      enrichedAgents.length > 0
        ? enrichedAgents
        : agents.map((a) => ({
            firstName: a.firstName,
            lastName: a.lastName,
            photoUrl: a.photoUrl,
            phone: a.phone,
            email: a.email,
            suburbsServiced: [suburbName],
            sales: [],
            reviews: [],
          }));

    // Store enriched agents in database
    let storedCount = 0;
    for (const enriched of agentsToStore) {
      if (abortController?.signal.aborted) break;
      try {
        await storeAgent(enriched, agency.id!, primarySuburb ? { id: primarySuburb.id, name: primarySuburb.name, state: primarySuburb.state } : null);
        storedCount++;
        stats.agentsFound += 1;
        stats.salesFound += enriched.sales?.length ?? 0;
        stats.reviewsFound += enriched.reviews?.length ?? 0;
        emit({
          type: 'agent_stored',
          subAgentId,
          agentName: `${enriched.firstName} ${enriched.lastName}`,
        });
      } catch (storeError) {
        const msg = storeError instanceof Error ? storeError.message : 'Unknown error';
        errors.push(`Store failed for ${enriched.firstName} ${enriched.lastName}: ${msg}`);
        emit({
          type: 'sub_agent',
          subAgentId,
          message: `Failed to store agent ${enriched.firstName} ${enriched.lastName}: ${msg}`,
        });
      }
    }

    if (abortController?.signal.aborted) {
      upsertSubAgent(runId, subAgentId, {
        status: 'error',
        agentNames,
        goals,
        error: 'Stopped',
        completedAt: Date.now(),
      });
      emit({
        type: 'status',
        subAgentId,
        subAgentStatus: { status: 'error', goals, agentNames, message: 'Stopped' },
      });
      return enrichedAgents;
    }

    const status: SubAgentStatus = storedCount > 0 ? 'success' : 'error';
    upsertSubAgent(runId, subAgentId, {
      status,
      agentNames,
      goals,
      error: storedCount > 0 ? null : 'No agents stored',
      completedAt: Date.now(),
    });
    emit({
      type: 'status',
      subAgentId,
      subAgentStatus: {
        status,
        goals,
        agentNames,
        message: status === 'success' ? 'Completed successfully' : 'Completed with errors',
      },
    });

    return enrichedAgents;
  } catch (error) {
    // Mark failed, NO retry
    const msg = error instanceof Error ? error.message : 'Unknown error';
    upsertSubAgent(runId, subAgentId, {
      status: 'error',
      agentNames,
      goals,
      error: msg,
      completedAt: Date.now(),
    });
    emit({
      type: 'sub_agent_error',
      subAgentId,
      error: msg,
    });
    emit({
      type: 'status',
      subAgentId,
      subAgentStatus: { status: 'error', goals, agentNames, message: 'Failed' },
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Extract agent data from Claude SDK structured output
export function extractAgentData(message: unknown): { agents: EnrichedAgent[] } {
  const msg = message as { structured_output?: { agents?: EnrichedAgent[] } };
  return { agents: msg.structured_output?.agents ?? [] };
}

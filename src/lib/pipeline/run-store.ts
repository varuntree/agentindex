/**
 * Pipeline run persistence helpers.
 */

import { sqliteDb } from '@/lib/db';
import type { PipelineRequest, PipelineRunStatus, SubAgentStatus } from './types';

export function createPipelineRun(targetLocation: string, request: PipelineRequest): number {
  const result = sqliteDb
    .prepare(
      `INSERT INTO pipeline_runs (
        started_at, status, agent_model, target_location, request_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(Date.now(), 'running', 'claude-sonnet', targetLocation, JSON.stringify(request), Date.now());

  return Number(result.lastInsertRowid);
}

export function completePipelineRun(
  runId: number,
  status: PipelineRunStatus,
  stats: {
    agenciesFound?: number;
    agentsFound?: number;
    salesFound?: number;
    reviewsFound?: number;
    totalCostUsd?: number;
    errorLog?: string | null;
  }
): void {
  sqliteDb
    .prepare(
      `UPDATE pipeline_runs SET
        completed_at = ?,
        status = ?,
        agencies_found = ?,
        agents_found = ?,
        sales_found = ?,
        reviews_found = ?,
        total_cost_usd = ?,
        error_log = ?
      WHERE id = ?`
    )
    .run(
      Date.now(),
      status,
      stats.agenciesFound ?? 0,
      stats.agentsFound ?? 0,
      stats.salesFound ?? 0,
      stats.reviewsFound ?? 0,
      stats.totalCostUsd ?? 0,
      stats.errorLog ?? null,
      runId
    );
}

export function upsertSubAgent(
  runId: number,
  subAgentId: number,
  values: {
    status?: SubAgentStatus;
    agentNames?: string[];
    goals?: string[];
    error?: string | null;
    completedAt?: number | null;
  }
): void {
  const existing = sqliteDb
    .prepare(`SELECT id FROM pipeline_sub_agents WHERE run_id = ? AND sub_agent_id = ? LIMIT 1`)
    .get(runId, subAgentId) as { id: number } | undefined;

  if (existing) {
    sqliteDb
      .prepare(
        `UPDATE pipeline_sub_agents SET
          status = COALESCE(?, status),
          agent_names_json = COALESCE(?, agent_names_json),
          goals_json = COALESCE(?, goals_json),
          error = COALESCE(?, error),
          completed_at = COALESCE(?, completed_at)
        WHERE id = ?`
      )
      .run(
        values.status ?? null,
        values.agentNames ? JSON.stringify(values.agentNames) : null,
        values.goals ? JSON.stringify(values.goals) : null,
        values.error ?? null,
        values.completedAt ?? null,
        existing.id
      );
    return;
  }

  sqliteDb
    .prepare(
      `INSERT INTO pipeline_sub_agents (
        run_id, sub_agent_id, status, agent_names_json, goals_json, error, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      runId,
      subAgentId,
      values.status ?? 'running',
      values.agentNames ? JSON.stringify(values.agentNames) : null,
      values.goals ? JSON.stringify(values.goals) : null,
      values.error ?? null,
      Date.now(),
      values.completedAt ?? null
    );
}


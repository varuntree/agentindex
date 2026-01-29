/**
 * Pipeline event bus + persistence.
 *
 * - Events are scoped by `runId`
 * - Events are persisted to SQLite (`pipeline_events`)
 * - Live subscribers are in-memory (for dev/local)
 */

import { sqliteDb } from '@/lib/db';
import type { PipelineEvent, PipelineEventType } from './types';

type Listener = (event: PipelineEvent) => void;

const listenersByRun = new Map<number, Set<Listener>>();

function getRunListeners(runId: number): Set<Listener> {
  const existing = listenersByRun.get(runId);
  if (existing) return existing;
  const set = new Set<Listener>();
  listenersByRun.set(runId, set);
  return set;
}

export function subscribe(runId: number, listener: Listener): () => void {
  const set = getRunListeners(runId);
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) listenersByRun.delete(runId);
  };
}

export function getListenerCount(runId: number): number {
  return listenersByRun.get(runId)?.size ?? 0;
}

export function listEvents(runId: number, afterId: number, limit = 500): PipelineEvent[] {
  const rows = sqliteDb
    .prepare(
      `SELECT id, created_at, type, phase, sub_agent_id, message, payload_json
       FROM pipeline_events
       WHERE run_id = ? AND id > ?
       ORDER BY id ASC
       LIMIT ?`
    )
    .all(runId, afterId, limit) as {
    id: number;
    created_at: number | string;
    type: PipelineEventType;
    phase: number | null;
    sub_agent_id: number | null;
    message: string | null;
    payload_json: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    runId,
    timestamp: typeof r.created_at === 'number' ? r.created_at : new Date(r.created_at).getTime(),
    type: r.type,
    phase: r.phase ?? undefined,
    subAgentId: r.sub_agent_id ?? undefined,
    message: r.message ?? undefined,
    ...(r.payload_json ? safeParsePayload(r.payload_json) : null),
  }));
}

function safeParsePayload(payloadJson: string): Partial<PipelineEvent> | null {
  try {
    const parsed = JSON.parse(payloadJson) as Partial<PipelineEvent>;
    return parsed;
  } catch {
    return { payloadJson };
  }
}

export function emitEvent(
  runId: number,
  eventData: Omit<PipelineEvent, 'id' | 'timestamp' | 'runId'>
): PipelineEvent {
  const now = Date.now();
  const payloadJson = buildPayloadJson(eventData);

  const result = sqliteDb
    .prepare(
      `INSERT INTO pipeline_events (run_id, type, phase, sub_agent_id, message, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      runId,
      eventData.type,
      eventData.phase ?? null,
      eventData.subAgentId ?? null,
      eventData.message ?? null,
      payloadJson,
      now
    );

  const event: PipelineEvent = {
    ...eventData,
    id: Number(result.lastInsertRowid),
    runId,
    timestamp: now,
  };

  const listeners = listenersByRun.get(runId);
  if (listeners) {
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Pipeline listener error:', e);
      }
    }
  }

  return event;
}

function buildPayloadJson(eventData: Omit<PipelineEvent, 'id' | 'timestamp' | 'runId'>): string | null {
  const payload: Record<string, unknown> = {};
  const passthroughKeys: (keyof PipelineEvent)[] = [
    'agentNames',
    'toolName',
    'toolInput',
    'toolOutput',
    'reasoning',
    'error',
    'agentName',
    'sdkMessage',
    'stats',
    'validation',
    'subAgentStatus',
    'runStatus',
  ];

  for (const key of passthroughKeys) {
    const value = (eventData as unknown as Record<string, unknown>)[key as string];
    if (value !== undefined) payload[key as string] = value;
  }

  if (Object.keys(payload).length === 0) return null;
  return JSON.stringify(payload);
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export function createEmitter(runId: number) {
  return (event: Omit<PipelineEvent, 'id' | 'timestamp' | 'runId'>) => emitEvent(runId, event);
}

export const events = {
  info: (emit: ReturnType<typeof createEmitter>, message: string) => emit({ type: 'info', message }),
  phase: (emit: ReturnType<typeof createEmitter>, phase: number, message: string) =>
    emit({ type: 'phase', phase, message }),
  error: (emit: ReturnType<typeof createEmitter>, error: string) => emit({ type: 'error', error }),
  complete: (emit: ReturnType<typeof createEmitter>, message: string, stats?: PipelineEvent['stats']) =>
    emit({ type: 'complete', message, stats }),
};

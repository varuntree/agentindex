'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PipelineForm } from '@/components/admin/PipelineForm';
import { AgentStream } from '@/components/admin/AgentStream';
import { SubAgentPanel } from '@/components/admin/SubAgentPanel';
import type { PipelineEvent } from '@/lib/pipeline/types';

type PipelineStatus = 'idle' | 'running' | 'complete' | 'error' | 'stopped';

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = String(item[key]);
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

export default function AdminPage() {
  const [runId, setRunId] = useState<number | null>(null);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [requestedAgents, setRequestedAgents] = useState<number>(0);

  // Resume last run on reload
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('pipeline:lastRunId');
      const parsed = stored ? Number(stored) : NaN;
      if (stored && Number.isFinite(parsed) && parsed > 0) {
        setRunId(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Connect to SSE stream for a specific runId
  useEffect(() => {
    if (!runId) return;

    try {
      window.localStorage.setItem('pipeline:lastRunId', String(runId));
    } catch {
      // ignore
    }

    const eventSource = new EventSource(`/api/pipeline/stream?runId=${runId}`);

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as PipelineEvent;
        setEvents((prev) => [...prev, event]);

        if (event.type === 'phase' && event.phase !== undefined) {
          setCurrentPhase(event.phase);
        }
        if (event.type === 'status' && event.runStatus) {
          if (typeof event.runStatus.phase === 'number') setCurrentPhase(event.runStatus.phase);
          switch (event.runStatus.status) {
            case 'running':
              setStatus('running');
              break;
            case 'stopped':
              setStatus('stopped');
              break;
            case 'success':
            case 'partial_success':
              setStatus('complete');
              break;
            case 'error':
              setStatus('error');
              break;
          }
        }
        if (event.type === 'complete') {
          setStatus('complete');
        } else if (event.type === 'error' && !event.subAgentId) {
          setStatus('error');
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // Browser will retry automatically.
    };

    return () => eventSource.close();
  }, [runId]);

  const handleStart = useCallback(
    async (data: { location: string; agencies: { agencyName: string; limit: number }[] }) => {
      setEvents([]);
      setStatus('running');
      setCurrentPhase(0);
      setRunId(null);
      setRequestedAgents(data.agencies.reduce((sum, a) => sum + a.limit, 0));

      try {
        const res = await fetch('/api/pipeline/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const payload = (await res.json().catch(() => null)) as { runId?: number; error?: string } | null;

        if (!res.ok) {
          setStatus('error');
          setEvents((prev) => [
            ...prev,
            {
              id: Date.now(),
              timestamp: Date.now(),
              runId: -1,
              type: 'error',
              error: payload?.error || 'Failed to start pipeline',
            },
          ]);
          return;
        }

        if (typeof payload?.runId !== 'number') {
          setStatus('error');
          setEvents((prev) => [
            ...prev,
            {
              id: Date.now(),
              timestamp: Date.now(),
              runId: -1,
              type: 'error',
              error: 'Missing runId from server',
            },
          ]);
          return;
        }

        setRunId(payload.runId);
      } catch (e) {
        setStatus('error');
        setEvents((prev) => [
          ...prev,
          {
            id: Date.now(),
            timestamp: Date.now(),
            runId: -1,
            type: 'error',
            error: e instanceof Error ? e.message : 'Network error',
          },
        ]);
      }
    },
    []
  );

  const handleStop = useCallback(async () => {
    if (!runId) return;
    try {
      await fetch('/api/pipeline/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });
    } catch {
      // ignore
    }
  }, [runId]);

  const storedAgents = useMemo(() => {
    return events
      .filter((e) => e.type === 'agent_stored' && e.agentName)
      .map((e) => e.agentName as string);
  }, [events]);

  const mainEvents = useMemo(() => events.filter((e) => e.subAgentId === undefined), [events]);
  const subAgentEvents = useMemo(() => events.filter((e) => e.subAgentId !== undefined), [events]);
  const subAgentGroups = useMemo(() => groupBy(subAgentEvents, 'subAgentId'), [subAgentEvents]);

  const subAgentStats = useMemo(() => {
    const groups = Object.keys(subAgentGroups);
    const completed = groups.filter((id) =>
      subAgentGroups[id].some((e) => e.type === 'status' && e.subAgentStatus?.status === 'success')
    ).length;
    const failed = groups.filter((id) =>
      subAgentGroups[id].some((e) => e.type === 'status' && e.subAgentStatus?.status === 'error')
    ).length;
    return { total: groups.length, completed, failed };
  }, [subAgentGroups]);

  const errors = useMemo(() => {
    return events
      .filter((e) => e.type === 'error' || e.type === 'sub_agent_error')
      .map((e) => e.error as string)
      .filter(Boolean);
  }, [events]);

  const toolCounts = useMemo(() => {
    const toolCalls = events.filter((e) => e.type === 'tool_call').length;
    const toolResults = events.filter((e) => e.type === 'tool_result').length;
    return { toolCalls, toolResults };
  }, [events]);

  const validationCounts = useMemo(() => {
    const validations = events.filter((e) => e.type === 'validation' && e.validation);
    const ok = validations.filter((e) => e.validation?.ok).length;
    const fail = validations.filter((e) => e.validation && !e.validation.ok).length;
    return { ok, fail };
  }, [events]);

  const latestStats = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      if (ev.stats) return ev.stats;
      if (ev.runStatus?.stats) return ev.runStatus.stats;
    }
    return null;
  }, [events]);

  const agentTarget = latestStats?.agentsNeeded ?? requestedAgents;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pipeline Workspace</h1>

          <div className="flex items-center gap-3">
            {runId ? (
              <span className="text-sm text-gray-600">
                Run <span className="font-mono">#{runId}</span>
              </span>
            ) : (
              <span className="text-sm text-gray-500">No run</span>
            )}
            {status === 'running' && (
              <button
                type="button"
                onClick={handleStop}
                className="px-3 py-1 rounded-lg text-sm font-medium border-2 border-black bg-red-600 text-white hover:bg-red-700"
              >
                Stop
              </button>
            )}
            <StatusBadge status={status} />
            {currentPhase > 0 && status === 'running' && (
              <span className="text-sm text-gray-500">Phase {currentPhase}/3</span>
            )}
            <span className="text-sm text-gray-500">{events.length} events</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7 space-y-4">
            <AgentStream title="Main Agent (reasoning + tools + progress)" events={mainEvents} />

            <div className="bg-white p-4 rounded-lg border-2 border-black">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Run Status</h3>
                <div className="text-xs text-gray-500">
                  Tools: {toolCounts.toolCalls}/{toolCounts.toolResults} • Validation: {validationCounts.ok}✓/{validationCounts.fail}✗
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Agents stored</span>
                  <span className="font-medium">{storedAgents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{latestStats?.agentsNeeded ? 'Agents needed' : 'Agents requested'}</span>
                  <span className="font-medium">{agentTarget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agencies processed</span>
                  <span className="font-medium">{latestStats?.agenciesFound ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Errors</span>
                  <span className={`font-medium ${errors.length > 0 ? 'text-red-600' : ''}`}>{errors.length}</span>
                </div>
              </div>

              {status === 'running' && agentTarget > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {storedAgents.length}/{agentTarget}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (storedAgents.length / agentTarget) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <PipelineForm onStart={handleStart} disabled={status === 'running'} />
          </div>

          <div className="col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-black">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Sub-Agents</h3>
                <span className="text-xs text-gray-500">
                  {subAgentStats.completed}/{subAgentStats.total} complete
                  {subAgentStats.failed > 0 ? ` • ${subAgentStats.failed} failed` : ''}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Each sub-agent handles up to 2 agents. Goals: enrich profile + collect sales/reviews.
              </div>
            </div>

            {Object.keys(subAgentGroups).length === 0 ? (
              <div className="bg-white p-6 rounded-lg border-2 border-black text-sm text-gray-500">
                No sub-agents yet.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(subAgentGroups).map(([id, evts]) => (
                  <SubAgentPanel
                    key={id}
                    id={Number(id)}
                    events={evts}
                    agentNames={evts.find((e) => e.type === 'sub_agent_start')?.agentNames ?? []}
                  />
                ))}
              </div>
            )}

            {errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                <h3 className="font-medium text-red-700 mb-2">Errors ({errors.length})</h3>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PipelineStatus }) {
  const colors: Record<PipelineStatus, string> = {
    idle: 'bg-gray-200 text-gray-700',
    running: 'bg-blue-100 text-blue-700',
    complete: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    stopped: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
      {status === 'running' && (
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

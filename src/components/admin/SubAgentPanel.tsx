'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { PipelineEvent } from '@/lib/pipeline/types';

interface SubAgentPanelProps {
  id: number;
  agentNames: string[];
  events: PipelineEvent[];
}

export function SubAgentPanel({ id, agentNames, events }: SubAgentPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const latestStatus = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.type === 'status' && e.subAgentStatus) return e.subAgentStatus;
    }
    return null;
  }, [events]);

  const derivedAgentNames = latestStatus?.agentNames?.length
    ? latestStatus.agentNames
    : agentNames;

  const goals = latestStatus?.goals?.length
    ? latestStatus.goals
    : ['Enrich agent profiles', 'Collect sales and reviews'];

  const status =
    latestStatus?.status ??
    (events.some((e) => e.type === 'sub_agent_error') ? 'error' : events.some((e) => e.type === 'agent_stored') ? 'success' : 'running');

  const hasError = status === 'error';
  const isComplete = status === 'success';

  const statusColor = hasError
    ? 'bg-red-100 border-red-400'
    : isComplete
      ? 'bg-green-100 border-green-400'
      : 'bg-blue-50 border-blue-300';

  const headerColor = hasError
    ? 'bg-red-200'
    : isComplete
      ? 'bg-green-200'
      : 'bg-blue-100';

  return (
    <div className={`rounded-lg border-2 ${statusColor} overflow-hidden`}>
      <div className={`${headerColor} px-3 py-2 border-b-2 border-inherit`}>
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Sub-Agent #{id + 1}</h4>
          <span className="text-xs">
            {hasError ? 'Failed' : isComplete ? 'Completed Successfully' : 'Running…'}
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {derivedAgentNames.length > 0 ? derivedAgentNames.join(', ') : '—'}
        </div>
        <div className="mt-2 space-y-1">
          {goals.slice(0, 2).map((g, idx) => (
            <div key={idx} className="text-xs flex items-center gap-2">
              <span className="font-mono">{isComplete ? '✓' : hasError ? '✗' : '•'}</span>
              <span>{g}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-48 overflow-y-auto p-2 font-mono text-xs space-y-0.5 bg-white"
      >
        {events.length === 0 ? (
          <div className="text-gray-400 text-center py-4">Starting...</div>
        ) : (
          events.map((event, idx) => (
            <div key={`${event.id}-${event.timestamp}-${idx}`} className="text-gray-600">
              <span className="text-gray-400">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>{' '}
              {event.message ||
                event.error ||
                event.agentName ||
                event.validation?.summary ||
                event.toolName ||
                event.type}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

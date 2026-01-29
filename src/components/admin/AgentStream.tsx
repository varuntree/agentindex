'use client';

import { useEffect, useRef } from 'react';
import type { PipelineEvent } from '@/lib/pipeline/types';

interface AgentStreamProps {
  title: string;
  events: PipelineEvent[];
}

export function AgentStream({ title, events }: AgentStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b-2 border-black flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">{events.length} events</span>
      </div>

      <div
        ref={containerRef}
        className="h-96 overflow-y-auto p-4 font-mono text-sm space-y-1"
      >
        {events.length === 0 ? (
          <div className="text-gray-400 text-center py-8">Waiting for events...</div>
        ) : (
          events.map((event, idx) => <EventLine key={`${event.id}-${event.timestamp}-${idx}`} event={event} />)
        )}
      </div>
    </div>
  );
}

function EventLine({ event }: { event: PipelineEvent }) {
  const colors: Record<string, string> = {
    init: 'text-gray-400',
    info: 'text-gray-700',
    phase: 'text-orange-600 font-bold',
    main_agent: 'text-blue-600',
    sub_agent_start: 'text-purple-600',
    sub_agent: 'text-purple-500',
    sub_agent_error: 'text-red-500',
    tool_call: 'text-indigo-600',
    tool_result: 'text-green-600',
    reasoning: 'text-blue-500',
    validation: 'text-amber-700',
    status: 'text-gray-700',
    agent_stored: 'text-green-700 font-medium',
    error: 'text-red-600 font-bold',
    complete: 'text-green-700 font-bold',
  };

  const time = new Date(event.timestamp).toLocaleTimeString();
  const colorClass = colors[event.type] || 'text-gray-700';

  let content = '';
  if (event.message) {
    content = event.message;
  } else if (event.error) {
    content = `Error: ${event.error}`;
  } else if (event.agentName) {
    content = `Stored: ${event.agentName}`;
  } else if (event.validation) {
    content = `${event.validation.ok ? 'OK' : 'FAIL'}: ${event.validation.summary}`;
  } else if (event.reasoning) {
    content = event.reasoning;
  } else if (event.toolName) {
    content = `Tool: ${event.toolName}`;
  } else if (event.runStatus?.message) {
    content = event.runStatus.message;
  }

  return (
    <div className={`${colorClass}`}>
      <span className="text-gray-400 text-xs mr-2">{time}</span>
      <span className="uppercase text-xs mr-2">[{event.type}]</span>
      {event.phase !== undefined && (
        <span className="mr-2">Phase {event.phase}:</span>
      )}
      {content}
    </div>
  );
}

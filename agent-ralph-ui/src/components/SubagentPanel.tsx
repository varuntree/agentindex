import { useRalphStore } from "../store/ralphStore";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageBlock } from "./MessageBlock";
import { X, Bot, Clock, MessageSquare } from "lucide-react";
import { formatDuration } from "../lib/format";

export function SubagentPanel() {
  const { subagents, activeSubagentId, selectSubagent } = useRalphStore();
  const scrollRef = useAutoScroll([activeSubagentId]);

  if (!activeSubagentId) return null;

  const sa = subagents.get(activeSubagentId);
  if (!sa) return null;

  const elapsed =
    sa.status === "done" && sa.completedAt
      ? sa.completedAt - sa.startedAt
      : null;

  return (
    <div className="fixed top-0 right-0 bottom-0 z-40 flex w-[420px] flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <Bot size={14} className="text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-200">{sa.type}</p>
          {sa.description && (
            <p className="truncate text-[11px] text-zinc-500">
              {sa.description}
            </p>
          )}
        </div>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            sa.status === "running"
              ? "bg-amber-900/50 text-amber-400"
              : "bg-emerald-900/50 text-emerald-400"
          }`}
        >
          {sa.status}
        </span>
        <button
          onClick={() => selectSubagent(null)}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        >
          <X size={14} />
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <MessageSquare size={11} />
          <span>{sa.messages.length} messages</span>
        </div>
        {sa.startedAt && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Clock size={11} />
            <span>
              {new Date(sa.startedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
        {elapsed !== null && (
          <div className="text-[11px] text-zinc-500">
            {formatDuration(elapsed)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {sa.messages.length === 0 && !sa.partialText ? (
          <p className="text-center text-xs text-zinc-700">
            Waiting for output...
          </p>
        ) : (
          <>
            {sa.messages.map((msg, i) => (
              <MessageBlock key={i} message={msg} />
            ))}
            {sa.partialText && (
              <div className="whitespace-pre-wrap text-xs text-zinc-400">
                {sa.partialText}
                <span className="animate-pulse text-emerald-400">|</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useRalphStore } from "../store/ralphStore";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageBlock } from "./MessageBlock";
import { X, Bot } from "lucide-react";

export function SubagentPanel() {
  const { subagents, activeSubagentId, selectSubagent } = useRalphStore();

  if (!activeSubagentId) return null;

  const sa = subagents.get(activeSubagentId);
  if (!sa) return null;

  const scrollRef = useAutoScroll([sa.messages.length]);

  return (
    <div className="flex w-[600px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <Bot size={14} className="text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-200">{sa.type}</p>
          {sa.description && (
            <p className="truncate text-[11px] text-zinc-500">{sa.description}</p>
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {sa.messages.length === 0 ? (
          <p className="text-center text-xs text-zinc-700">Waiting for output...</p>
        ) : (
          sa.messages.map((msg, i) => <MessageBlock key={i} message={msg} />)
        )}
      </div>
    </div>
  );
}

import { useRalphStore } from "../store/ralphStore";
import { Bot, CheckCircle2, Loader2 } from "lucide-react";
import { truncate } from "../lib/format";

export function SubagentSidebar() {
  const { subagents, activeSubagentId, selectSubagent } = useRalphStore();

  const entries = Array.from(subagents.values());

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-[11px] text-zinc-700">No subagents yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {entries.map((sa) => (
        <button
          key={sa.id}
          onClick={() =>
            selectSubagent(activeSubagentId === sa.id ? null : sa.id)
          }
          className={`flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs transition ${
            activeSubagentId === sa.id
              ? "bg-zinc-700/50 ring-1 ring-emerald-500/50"
              : "hover:bg-zinc-800/50"
          }`}
        >
          <div className="mt-0.5">
            {sa.status === "running" ? (
              <Loader2 size={12} className="animate-spin text-amber-400" />
            ) : (
              <CheckCircle2 size={12} className="text-emerald-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Bot size={10} className="text-zinc-500" />
              <span className="font-mono text-[10px] text-zinc-400">{sa.type}</span>
            </div>
            {sa.description && (
              <p className="mt-0.5 text-[11px] text-zinc-500 truncate">
                {truncate(sa.description, 50)}
              </p>
            )}
            <p className="mt-0.5 text-[10px] text-zinc-600">
              {sa.messages.length} messages
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

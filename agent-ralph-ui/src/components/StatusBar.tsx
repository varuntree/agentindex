import { useRalphStore } from "../store/ralphStore";
import { formatCost, formatDuration } from "../lib/format";

export function StatusBar() {
  const { mode, iteration, maxIterations, running, costUsd, durationMs, lastError } =
    useRalphStore();

  return (
    <div className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs">
      <span
        className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
          running
            ? "bg-emerald-900/50 text-emerald-400"
            : "bg-zinc-800 text-zinc-500"
        }`}
      >
        {running ? `${mode}ing` : "idle"}
      </span>

      <div className="flex items-center gap-1 text-zinc-500">
        <span>Iteration</span>
        <span className="font-mono text-zinc-300">
          {iteration}
          {maxIterations > 0 && `/${maxIterations}`}
        </span>
      </div>

      <div className="flex items-center gap-1 text-zinc-500">
        <span>Cost</span>
        <span className="font-mono text-zinc-300">{formatCost(costUsd)}</span>
      </div>

      <div className="flex items-center gap-1 text-zinc-500">
        <span>Duration</span>
        <span className="font-mono text-zinc-300">{formatDuration(durationMs)}</span>
      </div>

      {lastError && (
        <span className="ml-auto text-red-400 truncate max-w-md">{lastError}</span>
      )}
    </div>
  );
}

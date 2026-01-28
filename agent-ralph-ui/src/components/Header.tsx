import { useState } from "react";
import { Play, Square, RotateCcw } from "lucide-react";
import { useRalphStore } from "../store/ralphStore";

export function Header() {
  const { running, mode: currentMode } = useRalphStore();
  const [mode, setMode] = useState<"plan" | "build">("build");
  const [maxIterations, setMaxIterations] = useState(0);

  async function handleStart() {
    await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, maxIterations }),
    });
  }

  async function handleStop() {
    await fetch("/api/stop", { method: "POST" });
  }

  return (
    <header className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-emerald-400">R</span>
        <span className="text-sm font-semibold text-zinc-300">Ralph Dashboard</span>
      </div>

      <div className="ml-6 flex items-center gap-1 rounded-lg bg-zinc-800 p-0.5">
        <button
          onClick={() => setMode("plan")}
          disabled={running}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            mode === "plan"
              ? "bg-emerald-600 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          } disabled:opacity-50`}
        >
          Plan
        </button>
        <button
          onClick={() => setMode("build")}
          disabled={running}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            mode === "build"
              ? "bg-emerald-600 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          } disabled:opacity-50`}
        >
          Build
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500">Max iterations</label>
        <input
          type="number"
          min={0}
          value={maxIterations}
          onChange={(e) => setMaxIterations(parseInt(e.target.value) || 0)}
          disabled={running}
          className="w-16 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          placeholder="0"
        />
        <span className="text-[10px] text-zinc-600">0 = unlimited</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {!running ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
          >
            <Play size={12} />
            Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
          >
            <Square size={12} />
            Stop
          </button>
        )}
      </div>
    </header>
  );
}

import { useRalphSocket } from "./hooks/useRalphSocket";
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { MainPanel } from "./components/MainPanel";
import { SubagentSidebar } from "./components/SubagentSidebar";
import { SubagentPanel } from "./components/SubagentPanel";

export default function App() {
  useRalphSocket();

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <StatusBar />
      <div className="flex min-h-0 flex-1">
        {/* Main agent output */}
        <MainPanel />

        {/* Subagent detail panel (inline) */}
        <SubagentPanel />

        {/* Subagent sidebar */}
        <div className="w-64 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900/30">
          <div className="border-b border-zinc-800 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Subagents
            </span>
          </div>
          <SubagentSidebar />
        </div>
      </div>
    </div>
  );
}

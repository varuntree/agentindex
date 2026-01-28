import { create } from "zustand";
import type { SdkMessagePayload, WsEvent } from "../lib/types";

export interface SubagentState {
  id: string;
  type: string;
  description: string;
  status: "running" | "done";
  messages: SdkMessagePayload[];
  startedAt: number;
  completedAt?: number;
}

interface RalphState {
  // Loop status
  mode: "plan" | "build";
  iteration: number;
  maxIterations: number;
  running: boolean;
  costUsd: number;
  durationMs: number;

  // Main agent messages (current iteration)
  messages: SdkMessagePayload[];
  partialText: string;

  // Subagents (current iteration)
  subagents: Map<string, SubagentState>;
  activeSubagentId: string | null;

  // Log of all iterations
  iterationLog: Array<{ iteration: number; cost: number; duration: number }>;

  // Error
  lastError: string | null;

  // Actions
  handleEvent: (event: WsEvent) => void;
  selectSubagent: (id: string | null) => void;
  reset: () => void;
}

export const useRalphStore = create<RalphState>((set, get) => ({
  mode: "build",
  iteration: 0,
  maxIterations: 0,
  running: false,
  costUsd: 0,
  durationMs: 0,
  messages: [],
  partialText: "",
  subagents: new Map(),
  activeSubagentId: null,
  iterationLog: [],
  lastError: null,

  handleEvent: (event: WsEvent) => {
    switch (event.type) {
      case "loop:start":
        set({
          mode: event.mode,
          maxIterations: event.maxIterations,
          running: true,
          iteration: 0,
          costUsd: 0,
          durationMs: 0,
          messages: [],
          partialText: "",
          subagents: new Map(),
          activeSubagentId: null,
          iterationLog: [],
          lastError: null,
        });
        break;

      case "loop:complete":
        set({ running: false });
        break;

      case "iteration:start":
        // Clear messages for fresh iteration
        set({
          iteration: event.iteration,
          messages: [],
          partialText: "",
          subagents: new Map(),
          activeSubagentId: null,
        });
        break;

      case "iteration:complete":
        set((s) => ({
          costUsd: event.totalCost,
          durationMs: event.totalDuration,
          iterationLog: [
            ...s.iterationLog,
            { iteration: event.iteration, cost: event.cost, duration: event.duration },
          ],
        }));
        break;

      case "sdk:message": {
        const msg = event.message;

        // Partial text streaming
        if (msg.partialText !== undefined) {
          if (msg.parentToolUseId) {
            // Subagent partial
            set((s) => {
              const subagents = new Map(s.subagents);
              const sa = subagents.get(msg.parentToolUseId!);
              if (sa) {
                // Append partial text to last message or create placeholder
                subagents.set(msg.parentToolUseId!, { ...sa });
              }
              return { subagents };
            });
          } else {
            set((s) => ({ partialText: s.partialText + msg.partialText }));
          }
          break;
        }

        // Full message
        if (msg.parentToolUseId) {
          // Subagent message
          set((s) => {
            const subagents = new Map(s.subagents);
            const sa = subagents.get(msg.parentToolUseId!);
            if (sa) {
              subagents.set(msg.parentToolUseId!, {
                ...sa,
                messages: [...sa.messages, msg],
              });
            } else {
              // Unknown subagent — register it
              subagents.set(msg.parentToolUseId!, {
                id: msg.parentToolUseId!,
                type: "unknown",
                description: "",
                status: "running",
                messages: [msg],
                startedAt: Date.now(),
              });
            }
            return { subagents };
          });
        } else {
          // Main agent message
          set((s) => ({
            messages: [...s.messages, msg],
            partialText: "", // Reset partial on full message
          }));
        }
        break;
      }

      case "subagent:start":
        set((s) => {
          const subagents = new Map(s.subagents);
          subagents.set(event.agentId, {
            id: event.agentId,
            type: event.agentType,
            description: event.description,
            status: "running",
            messages: [],
            startedAt: Date.now(),
          });
          return { subagents };
        });
        break;

      case "subagent:stop":
        set((s) => {
          const subagents = new Map(s.subagents);
          const sa = subagents.get(event.agentId);
          if (sa) {
            subagents.set(event.agentId, {
              ...sa,
              status: "done",
              completedAt: Date.now(),
            });
          }
          return { subagents };
        });
        break;

      case "error":
        set({ lastError: event.message });
        break;

      case "status":
        set({
          mode: event.state.mode,
          iteration: event.state.iteration,
          maxIterations: event.state.maxIterations,
          running: event.state.running,
          costUsd: event.state.totalCostUsd,
          durationMs: event.state.totalDurationMs,
        });
        break;
    }
  },

  selectSubagent: (id) => set({ activeSubagentId: id }),

  reset: () =>
    set({
      mode: "build",
      iteration: 0,
      maxIterations: 0,
      running: false,
      costUsd: 0,
      durationMs: 0,
      messages: [],
      partialText: "",
      subagents: new Map(),
      activeSubagentId: null,
      iterationLog: [],
      lastError: null,
    }),
}));

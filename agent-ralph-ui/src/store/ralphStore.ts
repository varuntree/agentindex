import { create } from "zustand";
import type { SdkMessagePayload, WsEvent } from "../lib/types";

export interface SubagentState {
  id: string;
  type: string;
  description: string;
  status: "running" | "done";
  messages: SdkMessagePayload[];
  partialText: string;
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

  // Connection
  connected: boolean;

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
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useRalphStore = create<RalphState>((set) => ({
  mode: "build",
  iteration: 0,
  maxIterations: 0,
  running: false,
  costUsd: 0,
  durationMs: 0,
  connected: false,
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
            set((s) => {
              const subagents = new Map(s.subagents);
              const sa = subagents.get(msg.parentToolUseId!);
              if (sa) {
                subagents.set(msg.parentToolUseId!, {
                  ...sa,
                  partialText: sa.partialText + msg.partialText,
                });
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
          set((s) => {
            const subagents = new Map(s.subagents);
            const sa = subagents.get(msg.parentToolUseId!);
            if (sa) {
              // Client-side fallback: mark done on result message
              const isDone = msg.messageType === "result";
              subagents.set(msg.parentToolUseId!, {
                ...sa,
                messages: [...sa.messages, msg],
                partialText: "",
                ...(isDone && sa.status === "running"
                  ? { status: "done" as const, completedAt: Date.now() }
                  : {}),
              });
            } else {
              // Message arrived before subagent:start — create placeholder
              const isDone = msg.messageType === "result";
              subagents.set(msg.parentToolUseId!, {
                id: msg.parentToolUseId!,
                type: "unknown",
                description: "",
                status: isDone ? "done" : "running",
                messages: [msg],
                partialText: "",
                startedAt: Date.now(),
                ...(isDone ? { completedAt: Date.now() } : {}),
              });
            }
            return { subagents };
          });
        } else {
          set((s) => ({
            messages: [...s.messages, msg],
            partialText: "",
          }));
        }
        break;
      }

      case "subagent:start":
        set((s) => {
          const subagents = new Map(s.subagents);
          const existing = subagents.get(event.agentId);
          if (existing) {
            // Merge metadata into existing placeholder (keep messages)
            subagents.set(event.agentId, {
              ...existing,
              type: event.agentType,
              description: event.description,
            });
          } else {
            subagents.set(event.agentId, {
              id: event.agentId,
              type: event.agentType,
              description: event.description,
              status: "running",
              messages: [],
              partialText: "",
              startedAt: Date.now(),
            });
          }
          return { subagents };
        });
        break;

      case "subagent:stop":
        set((s) => {
          const subagents = new Map(s.subagents);
          const sa = subagents.get(event.agentId);
          if (sa && sa.status !== "done") {
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
  setConnected: (connected) => set({ connected }),

  reset: () =>
    set({
      mode: "build",
      iteration: 0,
      maxIterations: 0,
      running: false,
      costUsd: 0,
      durationMs: 0,
      connected: false,
      messages: [],
      partialText: "",
      subagents: new Map(),
      activeSubagentId: null,
      iterationLog: [],
      lastError: null,
    }),
}));

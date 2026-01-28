export interface LoopState {
  mode: "plan" | "build";
  iteration: number;
  maxIterations: number;
  running: boolean;
  totalCostUsd: number;
  totalDurationMs: number;
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

export interface SdkMessagePayload {
  messageType: string;
  parentToolUseId: string | null;
  sessionId?: string;
  content?: ContentBlock[];
  result?: string;
  costUsd?: number;
  durationMs?: number;
  numTurns?: number;
  subtype?: string;
  partialText?: string;
}

export type WsEvent =
  | { type: "loop:start"; mode: "plan" | "build"; maxIterations: number }
  | { type: "loop:complete"; reason: string }
  | { type: "iteration:start"; iteration: number }
  | {
      type: "iteration:complete";
      iteration: number;
      cost: number;
      duration: number;
      totalCost: number;
      totalDuration: number;
    }
  | { type: "sdk:message"; message: SdkMessagePayload }
  | { type: "subagent:start"; agentId: string; agentType: string; description: string }
  | { type: "subagent:stop"; agentId: string }
  | { type: "git:push:start" }
  | { type: "git:push:complete"; success: boolean; error?: string }
  | { type: "status"; state: LoopState }
  | { type: "error"; message: string };

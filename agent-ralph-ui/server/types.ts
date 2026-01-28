export interface LoopState {
  mode: "plan" | "build";
  iteration: number;
  maxIterations: number;
  running: boolean;
  totalCostUsd: number;
  totalDurationMs: number;
}

export type WsEvent =
  | { type: "loop:start"; mode: "plan" | "build"; maxIterations: number }
  | { type: "loop:complete"; reason: "max_iterations" | "stopped" | "error" | "done" }
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
  // Raw partial event for token streaming
  partialText?: string;
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

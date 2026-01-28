import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import { broadcast } from "./ws.js";
import type { LoopState, WsEvent, SdkMessagePayload, ContentBlock } from "./types.js";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_DIR = resolve(__dirname, "../../agent-ralph");
const PROJECT_ROOT = resolve(__dirname, "../..");

let state: LoopState = {
  mode: "build",
  iteration: 0,
  maxIterations: 0,
  running: false,
  totalCostUsd: 0,
  totalDurationMs: 0,
};

let abortController: AbortController | null = null;

// Event buffer for replay on reconnect
let eventHistory: WsEvent[] = [];

function emit(event: WsEvent) {
  eventHistory.push(event);
  broadcast(event);
}

export function getEventHistory(): WsEvent[] {
  return eventHistory;
}

export function getState(): LoopState {
  return { ...state };
}

export function stopLoop() {
  state.running = false;
  abortController?.abort();
  emit({ type: "loop:complete", reason: "stopped" });
}

function parseContentBlocks(content: unknown[]): ContentBlock[] {
  if (!Array.isArray(content)) return [];
  return content.map((raw: unknown) => {
    const block = raw as Record<string, unknown>;
    return {
      type: block.type as ContentBlock["type"],
      text: block.text as string | undefined,
      id: block.id as string | undefined,
      name: block.name as string | undefined,
      input: block.input as Record<string, unknown> | undefined,
    };
  });
}

function toMessagePayload(msg: Record<string, unknown>): SdkMessagePayload {
  const msgType = msg.type as string;
  const parentToolUseId = (msg.parent_tool_use_id as string) ?? null;
  const sessionId = msg.session_id as string | undefined;

  const payload: SdkMessagePayload = {
    messageType: msgType,
    parentToolUseId,
    sessionId,
  };

  if (msgType === "assistant") {
    const message = msg.message as Record<string, unknown> | undefined;
    if (message?.content) {
      payload.content = parseContentBlocks(message.content as unknown[]);
    }
  }

  if (msgType === "result") {
    payload.result = msg.result as string | undefined;
    payload.costUsd = msg.total_cost_usd as number | undefined;
    payload.durationMs = msg.duration_ms as number | undefined;
    payload.numTurns = msg.num_turns as number | undefined;
    payload.subtype = msg.subtype as string | undefined;
  }

  // Partial message — extract streaming text
  if (msgType === "partial") {
    const event = msg.event as Record<string, unknown> | undefined;
    const delta = event?.delta as Record<string, unknown> | undefined;
    if (delta?.type === "text_delta") {
      payload.partialText = delta.text as string;
    }
  }

  return payload;
}

async function gitPush() {
  emit({ type: "git:push:start" });
  try {
    const { stdout } = await execAsync("git push origin $(git branch --show-current)", {
      cwd: PROJECT_ROOT,
    });
    console.log("[git] push:", stdout.trim());
    emit({ type: "git:push:complete", success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[git] push failed:", message);
    // Try creating remote branch
    try {
      await execAsync("git push -u origin $(git branch --show-current)", {
        cwd: PROJECT_ROOT,
      });
      emit({ type: "git:push:complete", success: true });
    } catch {
      emit({ type: "git:push:complete", success: false, error: message });
    }
  }
}

export async function startLoop(mode: "plan" | "build", maxIterations: number) {
  if (state.running) {
    emit({ type: "error", message: "Loop already running" });
    return;
  }

  const promptFile = mode === "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";
  let promptContent: string;
  try {
    promptContent = readFileSync(resolve(PROMPT_DIR, promptFile), "utf-8");
  } catch (err) {
    emit({
      type: "error",
      message: `Failed to read ${promptFile}: ${err instanceof Error ? err.message : err}`,
    });
    return;
  }

  state = {
    mode,
    maxIterations,
    iteration: 0,
    running: true,
    totalCostUsd: 0,
    totalDurationMs: 0,
  };
  abortController = new AbortController();
  eventHistory = [];

  emit({ type: "loop:start", mode, maxIterations });
  console.log(`[ralph] starting ${mode} mode, max iterations: ${maxIterations || "unlimited"}`);

  try {
    // Dynamic import — SDK may not be installed yet
    const { query } = await import("@anthropic-ai/claude-agent-sdk");

    while (state.running) {
      if (maxIterations > 0 && state.iteration >= maxIterations) {
        emit({ type: "loop:complete", reason: "max_iterations" });
        break;
      }

      state.iteration++;
      emit({ type: "iteration:start", iteration: state.iteration });
      console.log(`[ralph] iteration ${state.iteration}`);

      const q = query({
        prompt: promptContent,
        options: {
          model: "claude-opus-4-5-20251101",
          cwd: PROJECT_ROOT,
          permissionMode: "bypassPermissions",
          includePartialMessages: true,
          abortController,
        },
      });

      for await (const message of q) {
        const msg = message as Record<string, unknown>;
        const payload = toMessagePayload(msg);

        // Detect subagent spawns from Task tool_use blocks
        if (payload.messageType === "assistant" && !payload.parentToolUseId && payload.content) {
          for (const block of payload.content) {
            if (block.type === "tool_use" && block.name === "Task" && block.id) {
              const input = block.input || {};
              emit({
                type: "subagent:start",
                agentId: block.id,
                agentType: (input.subagent_type as string) || "unknown",
                description: (input.description as string) || "",
              });
            }
          }
        }

        emit({ type: "sdk:message", message: payload });

        // Detect subagent completion — result with parentToolUseId
        if (payload.messageType === "result" && payload.parentToolUseId) {
          emit({ type: "subagent:stop", agentId: payload.parentToolUseId });
        }

        // Iteration complete (top-level result, no parent)
        if (payload.messageType === "result" && !payload.parentToolUseId) {
          const cost = payload.costUsd || 0;
          const duration = payload.durationMs || 0;
          state.totalCostUsd += cost;
          state.totalDurationMs += duration;
          emit({
            type: "iteration:complete",
            iteration: state.iteration,
            cost,
            duration,
            totalCost: state.totalCostUsd,
            totalDuration: state.totalDurationMs,
          });
        }
      }

      // Git push after iteration
      if (state.running) {
        await gitPush();
      }
    }
  } catch (err) {
    if (abortController?.signal.aborted) {
      console.log("[ralph] aborted");
      emit({ type: "loop:complete", reason: "stopped" });
    } else {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[ralph] error:", message);
      emit({ type: "error", message });
      emit({ type: "loop:complete", reason: "error" });
    }
  } finally {
    state.running = false;
    abortController = null;
  }
}

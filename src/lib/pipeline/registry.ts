/**
 * In-memory registry for active pipeline runs (dev/local).
 *
 * Used for cooperative cancellation via AbortController.
 * Note: In production/serverless, this is best-effort only (per-instance).
 */

const globalForPipeline = globalThis as unknown as {
  pipelineAbortControllers?: Map<number, AbortController>;
};

const controllers =
  globalForPipeline.pipelineAbortControllers ?? new Map<number, AbortController>();

if (!globalForPipeline.pipelineAbortControllers) {
  globalForPipeline.pipelineAbortControllers = controllers;
}

export function registerAbortController(runId: number, controller: AbortController): void {
  controllers.set(runId, controller);
}

export function getAbortController(runId: number): AbortController | null {
  return controllers.get(runId) ?? null;
}

export function stopAbortController(runId: number, reason?: string): boolean {
  const controller = controllers.get(runId);
  if (!controller) return false;
  try {
    controller.abort(reason);
  } catch {
    // ignore
  }
  controllers.delete(runId);
  return true;
}


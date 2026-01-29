import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runPipeline } from '@/lib/pipeline/orchestrator';
import { createPipelineRun } from '@/lib/pipeline/run-store';
import { createEmitter, emitEvent } from '@/lib/pipeline/broadcast';
import { registerAbortController } from '@/lib/pipeline/registry';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const StartSchema = z.object({
  location: z.string().min(2),
  agencies: z
    .array(
      z.object({
        agencyName: z.string().min(1),
        limit: z.number().min(1).max(200).default(50),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, agencies } = StartSchema.parse(body);

    const requestPayload = { location, agencies };
    const targetLocation = location;
    const runId = createPipelineRun(targetLocation, requestPayload);
    const emit = createEmitter(runId);
    registerAbortController(runId, new AbortController());

    emitEvent(runId, {
      type: 'status',
      runStatus: {
        status: 'running',
        message: 'Pipeline started',
        phase: 0,
      },
      stats: {
        agenciesFound: 0,
        agentsFound: 0,
        salesFound: 0,
        reviewsFound: 0,
      },
    });

    // Start pipeline in background (don't block response)
    runPipeline({ runId, request: requestPayload }).catch((error) => {
      emit({
        type: 'error',
        error: error instanceof Error ? error.message : 'Pipeline failed',
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Pipeline started',
      runId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

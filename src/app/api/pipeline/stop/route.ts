import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stopAbortController } from '@/lib/pipeline/registry';
import { createEmitter } from '@/lib/pipeline/broadcast';
import { completePipelineRun } from '@/lib/pipeline/run-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const StopSchema = z.object({
  runId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId } = StopSchema.parse(body);

    const emit = createEmitter(runId);
    stopAbortController(runId, 'Stopped by user');

    emit({
      type: 'status',
      runStatus: { status: 'stopped', message: 'Stopped by user' },
    });

    completePipelineRun(runId, 'stopped', { errorLog: JSON.stringify(['Stopped by user']) });

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}


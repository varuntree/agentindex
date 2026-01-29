import { db } from '@/lib/db';
import { voiceSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function logVoiceSessionStart(params: {
  sessionId: string;
  pageType: string;
  voiceMode: string;
  entitySlug?: string;
}) {
  await db.insert(voiceSessions).values({
    sessionId: params.sessionId,
    pageType: params.pageType,
    voiceMode: params.voiceMode,
    entitySlug: params.entitySlug ?? null,
    status: 'started',
    startedAt: Date.now(),
  });
}

export async function logVoiceSessionEnd(params: {
  sessionId: string;
  status: 'completed' | 'error' | 'timeout';
  durationMs: number;
  errorMessage?: string;
}) {
  await db
    .update(voiceSessions)
    .set({
      status: params.status,
      durationMs: params.durationMs,
      endedAt: Date.now(),
      errorMessage: params.errorMessage ?? null,
    })
    .where(eq(voiceSessions.sessionId, params.sessionId));
}

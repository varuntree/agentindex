import { NextRequest, NextResponse } from 'next/server';

import { logVoiceSessionStart, logVoiceSessionEnd } from '@/lib/voice/tracking';

type TrackStartBody = {
  event: 'start';
  sessionId: string;
  pageType: string;
  voiceMode: string;
  entitySlug?: string;
};

type TrackEndBody = {
  event: 'end';
  sessionId: string;
  status: 'completed' | 'error' | 'timeout';
  durationMs: number;
  errorMessage?: string;
};

type TrackBody = TrackStartBody | TrackEndBody;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as TrackBody | null;

    if (!body || !body.event || !body.sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.event === 'start') {
      if (!body.pageType || !body.voiceMode) {
        return NextResponse.json(
          { success: false, error: 'Missing pageType or voiceMode' },
          { status: 400 }
        );
      }

      await logVoiceSessionStart({
        sessionId: body.sessionId,
        pageType: body.pageType,
        voiceMode: body.voiceMode,
        entitySlug: body.entitySlug,
      });

      return NextResponse.json({ success: true });
    }

    if (body.event === 'end') {
      const validStatuses = ['completed', 'error', 'timeout'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }

      if (typeof body.durationMs !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing durationMs' },
          { status: 400 }
        );
      }

      await logVoiceSessionEnd({
        sessionId: body.sessionId,
        status: body.status,
        durationMs: body.durationMs,
        errorMessage: body.errorMessage,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid event type' },
      { status: 400 }
    );
  } catch (e) {
    console.error('Voice track error:', e);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

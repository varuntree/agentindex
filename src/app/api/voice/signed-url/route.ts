import { NextRequest, NextResponse } from 'next/server';
import { serverError } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    // Validate body shape
    const body = await request.json().catch(() => null);
    if (!body || !body.pageType) {
      return NextResponse.json(
        { success: false, error: { message: 'pageType is required', code: 'BAD_REQUEST' } },
        { status: 400 }
      );
    }

    const validPageTypes = ['home', 'agent', 'agency', 'suburb'];
    if (!validPageTypes.includes(body.pageType)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid pageType', code: 'BAD_REQUEST' } },
        { status: 400 }
      );
    }

    const validModes = ['navigator', 'assistant'];
    if (body.voiceMode && !validModes.includes(body.voiceMode)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid voiceMode', code: 'BAD_REQUEST' } },
        { status: 400 }
      );
    }

    // Placeholder until ElevenLabs is configured
    return NextResponse.json(
      { signedUrl: null, error: 'Voice not configured' },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (e) {
    console.error('Voice signed-url error:', e);
    return serverError();
  }
}

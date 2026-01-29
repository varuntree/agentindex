import { NextRequest } from 'next/server';
import { listEvents } from '@/lib/pipeline/broadcast';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const runIdParam = searchParams.get('runId');
  const runId = runIdParam ? Number(runIdParam) : NaN;

  if (!runIdParam || Number.isNaN(runId)) {
    return new Response('Missing runId', { status: 400 });
  }

  const lastEventIdHeader = request.headers.get('last-event-id');
  const afterId = lastEventIdHeader ? Number(lastEventIdHeader) : 0;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event (not persisted)
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ id: 0, type: 'init', runId, timestamp: Date.now() })}\n\n`
        )
      );

      let lastSentId = Number.isFinite(afterId) ? afterId : 0;

      // Replay existing events (best effort)
      try {
        const existing = listEvents(runId, lastSentId, 500);
        for (const ev of existing) {
          lastSentId = Math.max(lastSentId, ev.id);
          controller.enqueue(encoder.encode(`id: ${ev.id}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
        }
      } catch {
        // ignore
      }

      // Keepalive ping (helps some proxies)
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:\n\n`));
        } catch {
          // ignore
        }
      }, 15000);

      // Poll DB for new events (works across processes/instances)
      const poll = setInterval(() => {
        try {
          const newer = listEvents(runId, lastSentId, 200);
          for (const ev of newer) {
            lastSentId = Math.max(lastSentId, ev.id);
            controller.enqueue(encoder.encode(`id: ${ev.id}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
          }
        } catch {
          // ignore
        }
      }, 500);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(ping);
        clearInterval(poll);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

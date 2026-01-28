import { NextRequest } from 'next/server';
import { getAgentBySlug, getAgentComputedStats } from '@/lib/db/queries';
import { success, notFound, serverError } from '@/lib/api/response';
import { cacheHeaders, CACHE_PROFILE } from '@/lib/api/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const agent = await getAgentBySlug(slug);
    if (!agent) {
      return notFound('Agent not found');
    }

    // Compute stats from sales data
    const stats = await getAgentComputedStats(agent.id);

    const response = success({ ...agent, stats });
    const headers = cacheHeaders(CACHE_PROFILE);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (e) {
    console.error('Agent profile error:', e);
    return serverError();
  }
}

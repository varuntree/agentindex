import { NextRequest } from 'next/server';
import { getSuburbBySlug, getSuburbMarketStats } from '@/lib/db/queries';
import { success, notFound, serverError } from '@/lib/api/response';
import { cacheHeaders, CACHE_PROFILE } from '@/lib/api/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const suburb = await getSuburbBySlug(slug);
    if (!suburb) {
      return notFound('Suburb not found');
    }

    const marketStats = await getSuburbMarketStats(slug);

    const response = success({ ...suburb, marketStats });
    const headers = cacheHeaders(CACHE_PROFILE);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (e) {
    console.error('Suburb profile error:', e);
    return serverError();
  }
}

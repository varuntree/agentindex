import { NextRequest, NextResponse } from 'next/server';
import { searchFTS } from '@/lib/db/queries';
import { success, badRequest, serverError } from '@/lib/api/response';
import { cacheHeaders, CACHE_SEARCH } from '@/lib/api/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get('q');

    if (!q) {
      return badRequest('Query parameter "q" is required');
    }

    const type = searchParams.get('type') as 'all' | 'agent' | 'agency' | 'suburb' | null;
    const limitParam = parseInt(searchParams.get('limit') ?? '5', 10);
    const limit = Math.max(1, Math.min(limitParam, 20));

    const ftsType = type && type !== 'all' ? type : undefined;
    const results = await searchFTS(q, ftsType, limit);

    const grouped = {
      agents: results.filter((r) => r.type === 'agent'),
      agencies: results.filter((r) => r.type === 'agency'),
      suburbs: results.filter((r) => r.type === 'suburb'),
    };

    const response = success(grouped);
    const headers = cacheHeaders(CACHE_SEARCH);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (e) {
    console.error('Search error:', e);
    return serverError();
  }
}

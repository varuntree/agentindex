import { NextRequest } from 'next/server';
import { autocompleteFTS } from '@/lib/db/queries';
import { success, badRequest, serverError } from '@/lib/api/response';
import { cacheHeaders, CACHE_SEARCH } from '@/lib/api/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return badRequest('Query parameter "q" must be at least 2 characters');
    }

    const limitParam = parseInt(searchParams.get('limit') ?? '8', 10);
    const limit = Math.max(1, Math.min(limitParam, 20));

    const results = await autocompleteFTS(q, limit);

    const response = success(results);
    const headers = cacheHeaders(CACHE_SEARCH);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (e) {
    console.error('Autocomplete error:', e);
    return serverError();
  }
}

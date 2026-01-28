import { NextRequest } from 'next/server';
import { getAgentsList } from '@/lib/db/queries';
import { success, serverError } from '@/lib/api/response';
import { cacheHeaders, CACHE_LIST } from '@/lib/api/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const suburb = searchParams.get('suburb') ?? undefined;
    const agency = searchParams.get('agency') ?? undefined;
    const state = searchParams.get('state') ?? undefined;
    const propertyType = searchParams.get('property_type') ?? undefined;
    const sort = (searchParams.get('sort') ?? undefined) as
      | 'rating'
      | 'sales'
      | 'name'
      | 'quality'
      | undefined;

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);
    const limit = Math.max(1, Math.min(limitParam, 50));

    const { agents, total } = await getAgentsList({
      suburb,
      agency,
      state,
      propertyType,
      sort,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    const response = success({ agents, total, page, limit, totalPages });
    const headers = cacheHeaders(CACHE_LIST);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (e) {
    console.error('Agents list error:', e);
    return serverError();
  }
}

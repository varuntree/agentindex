import { NextRequest } from 'next/server';
import { getAgentsList, getSuburbBySlug } from '@/lib/db/queries';
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
      | 'sales_count'
      | 'avg_price'
      | 'name'
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

    const pages = Math.ceil(total / limit);

    // Include suburb context when filtering by suburb
    let suburbContext = undefined;
    if (suburb) {
      const suburbData = await getSuburbBySlug(suburb);
      if (suburbData) {
        suburbContext = {
          name: suburbData.name,
          state: suburbData.state,
          postcode: suburbData.postcode,
          median_price: suburbData.medianPrice ?? suburbData.medianHousePrice,
          price_change_yoy: suburbData.priceChangeYoy,
          sales_volume_12m: suburbData.salesVolume12m,
        };
      }
    }

    const response = success({ agents, total, page, pages, suburb: suburbContext });
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

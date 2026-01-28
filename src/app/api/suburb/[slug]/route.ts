import { NextRequest } from 'next/server';
import { getSuburbBySlug, getSuburbMarketStats, getAgentsBySuburb } from '@/lib/db/queries';
import { success, notFound, serverError } from '@/lib/api/response';
import { cacheHeaders, CACHE_PROFILE } from '@/lib/api/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Parse pagination/sort params
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const sortParam = searchParams.get('sort') ?? 'sales_count';
    const sort = ['sales_count', 'avg_price', 'name', 'rating'].includes(sortParam)
      ? (sortParam as 'sales_count' | 'avg_price' | 'name' | 'rating')
      : 'sales_count';

    const suburb = await getSuburbBySlug(slug);
    if (!suburb) {
      return notFound('Suburb not found');
    }

    const { marketStats, demographics, totalAgents } = await getSuburbMarketStats(slug);
    const { agents, total } = await getAgentsBySuburb({ suburbSlug: slug, sort, page, limit });

    const totalPages = Math.ceil(total / limit);

    // Build spec-compliant response
    const responseData = {
      id: suburb.id,
      slug: suburb.slug,
      name: suburb.name,
      state: suburb.state,
      postcode: suburb.postcode,
      lat: suburb.lat,
      lng: suburb.lng,
      market_stats: {
        median_price: marketStats.medianPrice,
        median_price_house: marketStats.medianPriceHouse,
        median_price_apartment: marketStats.medianPriceApartment,
        price_change_yoy: marketStats.priceChangeYoy,
        sales_volume_12m: marketStats.salesVolume12m,
        avg_days_on_market: marketStats.avgDaysOnMarket,
        clearance_rate: marketStats.clearanceRate,
        rental_yield: marketStats.rentalYield,
      },
      demographics: {
        population: demographics.population,
        median_age: demographics.medianAge,
        median_household_income: demographics.medianHouseholdIncome,
      },
      agents: agents.map((a) => ({
        id: a.id,
        slug: a.slug,
        full_name: a.fullName,
        photo_url: a.photoUrl,
        agency_name: a.agencyName,
        agency_logo_url: a.agencyLogoUrl,
        sales_count_suburb: a.salesCountSuburb,
        avg_sale_price_suburb: a.avgSalePriceSuburb,
        total_sales_count: a.totalSalesCount,
        avg_rating: a.avgRating,
      })),
      total_agents: totalAgents > 0 ? totalAgents : total,
      page,
      pages: totalPages,
    };

    const response = success(responseData);
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

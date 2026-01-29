import { NextRequest } from 'next/server';
import { getAgencyBySlug, getAgencyEnrichment } from '@/lib/db/queries';
import { success, notFound, serverError } from '@/lib/api/response';
import { cacheHeaders, CACHE_PROFILE } from '@/lib/api/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const agency = await getAgencyBySlug(slug);
    if (!agency) {
      return notFound('Agency not found');
    }

    // Get enrichment data (avgSalePrice, topSuburbs)
    const enrichment = await getAgencyEnrichment(agency.id);

    const response = success({
      ...agency,
      avgSalePrice: enrichment.avgSalePrice,
      topSuburbs: enrichment.topSuburbs,
    });
    const headers = cacheHeaders(CACHE_PROFILE);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (e) {
    console.error('Agency profile error:', e);
    return serverError();
  }
}

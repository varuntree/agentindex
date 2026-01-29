import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchSuburbs } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  q: z.string().default(''),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { q } = QuerySchema.parse({ q: url.searchParams.get('q') ?? '' });
    const results = searchSuburbs(q, 10);
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('Error searching suburbs:', e);
    return NextResponse.json({ results: [] }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}


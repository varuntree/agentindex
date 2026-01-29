import { NextResponse } from 'next/server';
import { getSuburbsDropdown } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const suburbs = getSuburbsDropdown();
    return NextResponse.json({ suburbs });
  } catch (e) {
    console.error('Error fetching suburbs:', e);
    return NextResponse.json(
      { error: 'Failed to fetch suburbs' },
      { status: 500 }
    );
  }
}

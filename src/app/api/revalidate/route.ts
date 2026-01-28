import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { serverError } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.REVALIDATION_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.paths) || body.paths.length === 0) {
      return NextResponse.json(
        { error: { message: 'paths array is required', code: 'BAD_REQUEST' } },
        { status: 400 }
      );
    }

    const revalidated: string[] = [];
    for (const path of body.paths) {
      if (typeof path === 'string' && path.startsWith('/')) {
        revalidatePath(path);
        revalidated.push(path);
      }
    }

    return NextResponse.json(
      { revalidated },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error('Revalidation error:', e);
    return serverError();
  }
}

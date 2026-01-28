import { NextResponse } from 'next/server';

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, code: string, status = 400) {
  return NextResponse.json({ success: false, error: { message, code } }, { status });
}

export function notFound(message = 'Not found') {
  return error(message, 'NOT_FOUND', 404);
}

export function badRequest(message = 'Bad request') {
  return error(message, 'BAD_REQUEST', 400);
}

export function serverError(message = 'Internal server error') {
  return error(message, 'INTERNAL_ERROR', 500);
}

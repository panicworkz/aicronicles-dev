import { NextResponse } from 'next/server';

export function handleApiError(error: unknown, context: string): NextResponse {
  const errorId = `err_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  
  // Log full error details securely on the server
  console.error(`[API_ERROR][${errorId}][${context}]:`, error);

  // Return a safe, sanitized error response to the client
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request.',
      errorId,
    },
    { status: 500 }
  );
}

export function apiUnauthorized(message = 'Authentication required.'): NextResponse {
  return NextResponse.json({ error: 'Unauthorized', message }, { status: 401 });
}

export function apiForbidden(message = 'Permission denied.'): NextResponse {
  return NextResponse.json({ error: 'Forbidden', message }, { status: 403 });
}

export function apiBadRequest(message = 'Invalid request parameters.'): NextResponse {
  return NextResponse.json({ error: 'Bad Request', message }, { status: 400 });
}

export function apiNotFound(message = 'Resource not found.'): NextResponse {
  return NextResponse.json({ error: 'Not Found', message }, { status: 404 });
}

export function apiTooManyRequests(message = 'Too many requests. Please try again later.', resetInMs?: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message,
      ...(resetInMs ? { retryAfterSeconds: Math.ceil(resetInMs / 1000) } : {}),
    },
    {
      status: 429,
      headers: resetInMs ? { 'Retry-After': String(Math.ceil(resetInMs / 1000)) } : {},
    }
  );
}

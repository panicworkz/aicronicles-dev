import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'panic_session';

// Public API endpoints that do not require authentication
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/llm',
  '/api/rates',
  '/api/coupons/validate',
];

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const jwtSecretEnv = process.env.JWT_SECRET;

  // 1. Handle /api routes
  if (path.startsWith('/api')) {
    if (isPublicApiPath(path)) {
      return NextResponse.next();
    }

    if (!jwtSecretEnv) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Server authentication key unconfigured.' },
        { status: 401 }
      );
    }

    const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required.' },
        { status: 401 }
      );
    }

    try {
      const secretKey = new TextEncoder().encode(jwtSecretEnv);
      await jwtVerify(token, secretKey);
      return NextResponse.next();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }
  }

  // 2. Handle /panic dashboard routes
  if (path.startsWith('/panic')) {
    if (path === '/panic/login') {
      if (jwtSecretEnv) {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (token) {
          try {
            const secretKey = new TextEncoder().encode(jwtSecretEnv);
            await jwtVerify(token, secretKey);
            return NextResponse.redirect(new URL('/panic', request.url));
          } catch {}
        }
      }
      return NextResponse.next();
    }

    // Protected /panic pages
    if (!jwtSecretEnv) {
      return NextResponse.redirect(new URL('/panic/login', request.url));
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/panic/login', request.url));
    }

    try {
      const secretKey = new TextEncoder().encode(jwtSecretEnv);
      await jwtVerify(token, secretKey);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/panic/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/panic/:path*', '/api/:path*'],
};

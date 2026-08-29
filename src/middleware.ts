import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'panic_cms_super_secret_jwt_key_2026');
const COOKIE_NAME = 'panic_session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /panic routes (except /panic/login)
  if (path.startsWith('/panic') && path !== '/panic/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/panic/login', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/panic/login', request.url));
    }
  }

  // If already logged in, redirect /panic/login to /panic
  if (path === '/panic/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/panic', request.url));
      } catch {}
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/panic/:path*'],
};

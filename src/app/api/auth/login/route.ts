import { NextResponse, type NextRequest } from 'next/server';
import { verifyUserCredentials, createSession } from '@/lib/auth';
import { checkRateLimit, recordAttempt, resetRateLimit } from '@/lib/rate-limiter';
import { handleApiError, apiTooManyRequests } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfIp = req.headers.get('cf-connecting-ip');
    const clientIp = cfIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1');

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const rateLimitKey = `login:${clientIp}:${cleanEmail}`;
    const ipRateLimitKey = `login:ip:${clientIp}`;

    // Check rate limits: 5 attempts per 10 minutes per account/ip, 20 attempts per IP
    const accountCheck = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);
    const ipCheck = checkRateLimit(ipRateLimitKey, 20, 10 * 60 * 1000);

    if (!accountCheck.success) {
      return apiTooManyRequests(
        'Too many failed login attempts for this account. Please wait before trying again.',
        accountCheck.resetInMs
      );
    }

    if (!ipCheck.success) {
      return apiTooManyRequests(
        'Too many login requests from your network. Please try again later.',
        ipCheck.resetInMs
      );
    }

    const user = await verifyUserCredentials(cleanEmail, password);
    if (!user) {
      recordAttempt(rateLimitKey);
      recordAttempt(ipRateLimitKey);

      // Artificial delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 400));

      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Successful login: clear rate limit tracker for this user/ip
    resetRateLimit(rateLimitKey);

    await createSession(user.id, user.email);

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/auth/login');
  }
}

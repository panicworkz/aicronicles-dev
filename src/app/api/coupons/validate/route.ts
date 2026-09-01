import { NextResponse, type NextRequest } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { checkRateLimit, recordAttempt } from '@/lib/rate-limiter';
import { handleApiError, apiTooManyRequests, apiBadRequest, apiNotFound } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const clientIp = cfIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1');

    // Rate limit: 20 coupon validations per minute per IP
    const rateLimitKey = `coupon_validate:${clientIp}`;
    const check = checkRateLimit(rateLimitKey, 20, 60 * 1000);
    if (!check.success) {
      return apiTooManyRequests('Too many coupon validation attempts. Please slow down.', check.resetInMs);
    }
    recordAttempt(rateLimitKey);

    const body = await request.json().catch(() => ({}));
    const { code, cartTotal = 0 } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Please enter a coupon code' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const coupon = await db.query.coupons.findFirst({
      where: eq(schema.coupons.code, cleanCode),
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid or unknown promo code' }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, error: 'This coupon code is no longer active' }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' }, { status: 400 });
    }

    if (coupon.usageLimit && (coupon.timesUsed || 0) >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Coupon usage limit has been reached' }, { status: 400 });
    }

    const minAmount = parseFloat(String(coupon.minOrderAmount || '0'));
    const parsedTotal = parseFloat(String(cartTotal || '0'));
    if (parsedTotal < minAmount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of $${minAmount.toFixed(2)} required for this coupon`,
      }, { status: 400 });
    }

    const discountVal = parseFloat(String(coupon.value || '0'));
    let discountAmount = 0;

    if (coupon.type === 'percentage') {
      discountAmount = (parsedTotal * discountVal) / 100;
    } else {
      discountAmount = discountVal;
    }

    if (discountAmount > parsedTotal) discountAmount = parsedTotal;
    const finalTotal = Math.max(0, parsedTotal - discountAmount);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: discountVal,
      },
      discountAmount,
      finalTotal,
      message: coupon.type === 'percentage' ? `${discountVal}% discount applied!` : `$${discountVal.toFixed(2)} discount applied!`,
    });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/coupons/validate');
  }
}

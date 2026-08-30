import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { code, cartTotal = 0 } = await request.json();

    if (!code) {
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
    if (cartTotal < minAmount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of $${minAmount.toFixed(2)} required for this coupon`,
      }, { status: 400 });
    }

    const discountVal = parseFloat(String(coupon.value || '0'));
    let discountAmount = 0;

    if (coupon.type === 'percentage') {
      discountAmount = (cartTotal * discountVal) / 100;
    } else {
      discountAmount = discountVal;
    }

    if (discountAmount > cartTotal) discountAmount = cartTotal;
    const finalTotal = Math.max(0, cartTotal - discountAmount);

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
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}

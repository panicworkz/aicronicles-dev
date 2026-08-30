import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const couponList = await db.query.coupons.findMany({
      orderBy: [desc(schema.coupons.createdAt)],
    });
    return NextResponse.json({ success: true, coupons: couponList });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, discountType = 'percentage', value, minOrderAmount = 0, usageLimit, expiresAt } = body;

    if (!code || value === undefined) {
      return NextResponse.json({ error: 'Code and Value are required' }, { status: 400 });
    }

    const [newCoupon] = await db
      .insert(schema.coupons)
      .values({
        code: code.toUpperCase().trim(),
        discountType: String(discountType),
        value: String(value),
        minOrderAmount: String(minOrderAmount),
        usageLimit: usageLimit ? parseInt(String(usageLimit), 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      } as any)
      .returning();

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

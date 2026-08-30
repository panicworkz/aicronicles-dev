import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const couponList = await db.query.coupons.findMany({
      orderBy: [desc(schema.coupons.createdAt)],
    });

    let activeCount = 0;
    let totalUses = 0;
    let maxDiscount = 0;

    for (const c of couponList) {
      if (c.active) activeCount++;
      totalUses += c.timesUsed || 0;
      const v = parseFloat(String(c.value || '0'));
      if (v > maxDiscount) maxDiscount = v;
    }

    return NextResponse.json({
      success: true,
      coupons: couponList,
      stats: {
        totalCoupons: couponList.length,
        activeCount,
        totalUses,
        maxDiscount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, type = 'percentage', value, minOrderAmount = 0, usageLimit = null, active = true, expiresAt = null } = body;

    if (!code || value === undefined) {
      return NextResponse.json({ error: 'Code and discount value are required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const [newCoupon] = await db
      .insert(schema.coupons)
      .values({
        code: cleanCode,
        type,
        value: String(value),
        minOrderAmount: String(minOrderAmount || '0.00'),
        usageLimit: usageLimit ? parseInt(String(usageLimit), 10) : null,
        active: Boolean(active),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        timesUsed: 0,
      } as any)
      .returning();

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, active, usageLimit, minOrderAmount } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const [updated] = await db
      .update(schema.coupons)
      .set({
        active: active !== undefined ? active : undefined,
        usageLimit: usageLimit !== undefined ? usageLimit : undefined,
        minOrderAmount: minOrderAmount !== undefined ? String(minOrderAmount) : undefined,
      } as any)
      .where(eq(schema.coupons.id, parseInt(String(id), 10)))
      .returning();

    return NextResponse.json({ success: true, coupon: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    await db.delete(schema.coupons).where(eq(schema.coupons.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

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
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/coupons');
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const body = await request.json().catch(() => ({}));
    const { code, type = 'percentage', value, minOrderAmount = 0, usageLimit = null, active = true, expiresAt = null } = body;

    if (!code || value === undefined) {
      return apiBadRequest('Code and discount value are required');
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
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/coupons');
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const body = await request.json().catch(() => ({}));
    const { id, active, usageLimit, minOrderAmount } = body;

    if (!id) {
      return apiBadRequest('Coupon ID is required');
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
  } catch (err: unknown) {
    return handleApiError(err, 'PUT /api/coupons');
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiBadRequest('Coupon ID is required');
    }

    await db.delete(schema.coupons).where(eq(schema.coupons.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'DELETE /api/coupons');
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, like, or, eq, and } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const segment = searchParams.get('segment');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          like(schema.customers.name, `%${search}%`),
          like(schema.customers.email, `%${search}%`),
          like(schema.customers.phone, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const customerList = await db.query.customers.findMany({
      where: whereClause,
      orderBy: [desc(schema.customers.totalSpent)],
      limit,
    });

    // Compute segment labels & stats
    const enriched = customerList.map((c) => {
      const spent = parseFloat(String(c.totalSpent || '0'));
      const count = c.orderCount || 0;
      const aov = count > 0 ? spent / count : 0;

      let seg = 'First-Time';
      if (spent >= 300) seg = 'VIP Whale';
      else if (count > 1) seg = 'Repeat Buyer';

      return {
        ...c,
        totalSpentNum: spent,
        orderCountNum: count,
        aov,
        segment: seg,
      };
    });

    // Apply segment filter if provided
    const filtered = segment && segment !== 'all'
      ? enriched.filter((c) => {
          if (segment === 'vip') return c.segment === 'VIP Whale';
          if (segment === 'repeat') return c.segment === 'Repeat Buyer';
          if (segment === 'first_time') return c.segment === 'First-Time';
          return true;
        })
      : enriched;

    // Overall Aggregate Stats
    let totalSpentSum = 0;
    let repeatCount = 0;
    for (const c of customerList) {
      const sp = parseFloat(String(c.totalSpent || '0'));
      totalSpentSum += sp;
      if ((c.orderCount || 0) > 1) repeatCount++;
    }

    const totalCust = customerList.length;
    const avgLtv = totalCust > 0 ? totalSpentSum / totalCust : 0;
    const repeatRate = totalCust > 0 ? Math.round((repeatCount / totalCust) * 100) : 0;

    return NextResponse.json({
      success: true,
      customers: filtered,
      stats: {
        totalCustomers: totalCust,
        avgLtv,
        repeatRate,
        totalRevenue: totalSpentSum,
      },
    });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/customers');
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const body = await request.json().catch(() => ({}));
    const { email, name, phone, shippingAddressJson } = body;

    if (!email) {
      return apiBadRequest('Email is required');
    }

    const [newCust] = await db
      .insert(schema.customers)
      .values({
        email,
        name: name || 'Customer',
        phone: phone || null,
        shippingAddressJson: shippingAddressJson || {},
        totalSpent: '0.00',
        orderCount: 0,
      } as any)
      .returning();

    return NextResponse.json({ success: true, customer: newCust });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/customers');
  }
}

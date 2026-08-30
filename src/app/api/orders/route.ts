import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, like, or, eq, and, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const paymentStatus = searchParams.get('paymentStatus');
    const orderStatus = searchParams.get('orderStatus');
    const typeFilter = searchParams.get('productType');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          like(schema.orders.orderNumber, `%${search}%`),
          like(schema.orders.customerName, `%${search}%`),
          like(schema.orders.customerEmail, `%${search}%`)
        )
      );
    }

    if (paymentStatus && paymentStatus !== 'all') {
      conditions.push(eq(schema.orders.paymentStatus, paymentStatus));
    }

    if (orderStatus && orderStatus !== 'all') {
      conditions.push(eq(schema.orders.orderStatus, orderStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderList = await db.query.orders.findMany({
      where: whereClause,
      orderBy: [desc(schema.orders.createdAt)],
      limit,
    });

    // Fetch items for all orders to attach product type summary
    const orderIds = orderList.map((o) => o.id);
    let itemsMap: Record<number, any[]> = {};
    if (orderIds.length > 0) {
      const allItems = await db.query.orderItems.findMany({
        where: inArray(schema.orderItems.orderId, orderIds),
      });
      for (const it of allItems) {
        if (!itemsMap[it.orderId]) itemsMap[it.orderId] = [];
        itemsMap[it.orderId].push(it);
      }
    }

    const enrichedOrders = orderList.map((o) => {
      const items = itemsMap[o.id] || [];
      const types = Array.from(new Set(items.map((i) => i.productType || 'physical')));
      return {
        ...o,
        items,
        productTypes: types,
        primaryType: types[0] || 'physical',
      };
    });

    // Filter by type if requested
    const filteredOrders = typeFilter && typeFilter !== 'all'
      ? enrichedOrders.filter((o) => o.productTypes.includes(typeFilter))
      : enrichedOrders;

    // Calculate revenue stats
    const allOrders = await db.query.orders.findMany();
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingFulfillmentCount = 0;

    for (const o of allOrders) {
      if (o.paymentStatus === 'paid') {
        totalRevenue += parseFloat(String(o.total || '0'));
        paidCount++;
      }
      if (o.orderStatus === 'processing' || o.orderStatus === 'unfulfilled') {
        pendingFulfillmentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      orders: filteredOrders,
      stats: {
        totalRevenue,
        totalOrders: allOrders.length,
        paidCount,
        pendingFulfillmentCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerEmail,
      customerName,
      items = [],
      total,
      subtotal,
      currency = 'USD',
      paymentStatus = 'paid',
      orderStatus = 'processing',
      carrier,
      trackingNumber,
      shippingAddressJson,
      notes,
    } = body;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const [newOrder] = await db
      .insert(schema.orders)
      .values({
        orderNumber,
        customerId: customerId ? parseInt(String(customerId), 10) : null,
        customerEmail,
        customerName: customerName || 'Customer',
        total: String(total),
        subtotal: subtotal ? String(subtotal) : String(total),
        currency,
        paymentStatus,
        orderStatus,
        carrier,
        trackingNumber,
        shippingAddressJson,
        notes,
      } as any)
      .returning();

    for (const item of items) {
      await db.insert(schema.orderItems).values({
        orderId: newOrder.id,
        productId: item.productId || 1,
        variantId: item.variantId || null,
        title: item.title || item.productTitle || 'Product Item',
        productType: item.productType || 'physical',
        digitalAssetUrl: item.digitalAssetUrl || null,
        quantity: item.quantity || 1,
        unitPrice: String(item.unitPrice || item.price),
        totalPrice: String(item.totalPrice || (item.unitPrice || item.price) * (item.quantity || 1)),
      } as any);
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

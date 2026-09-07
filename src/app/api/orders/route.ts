import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, like, or, eq, and, inArray } from 'drizzle-orm';
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
    const paymentStatus = searchParams.get('paymentStatus');
    const orderStatus = searchParams.get('orderStatus');
    const typeFilter = searchParams.get('productType');
    /* Odeme YONTEMI suzgeci. Gunluk is "hangi havaleleri bekliyorum"
       oldugu icin durum degil yontem uzerinden de suzulebilmeli. */
    const paymentMethod = searchParams.get('paymentMethod');
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

    if (paymentMethod && paymentMethod !== 'all') {
      conditions.push(eq(schema.orders.paymentMethod, paymentMethod));
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
        itemCount: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        productTypes: types,
      };
    });

    // Filter by product type if requested
    const filteredOrders = typeFilter && typeFilter !== 'all'
      ? enrichedOrders.filter((o) => o.productTypes.includes(typeFilter))
      : enrichedOrders;

    // Calculate metrics
    let totalRev = 0;
    let pendingFulfillmentCount = 0;
    let paidCount = 0;
    /* Bekleyen havale: para HENUZ GELMEDI ve gelmesini biz
       bekliyoruz. Kapida odeme bunun disinda — orada parayi kurye
       aliyor, bizim yapacagimiz bir sey yok. */
    let awaitingTransferCount = 0;
    let awaitingTransferTotal = 0;

    for (const o of enrichedOrders) {
      if (o.paymentStatus === 'paid') {
        totalRev += parseFloat(String(o.total || '0'));
        paidCount++;
      }
      if (o.orderStatus === 'processing') {
        pendingFulfillmentCount++;
      }
      if (o.paymentStatus === 'pending' && o.paymentMethod === 'bank_transfer') {
        awaitingTransferCount++;
        awaitingTransferTotal += parseFloat(String(o.total || '0'));
      }
    }

    return NextResponse.json({
      success: true,
      orders: filteredOrders,
      /* Alan adlari EKRANIN OKUDUGU adlar. Once API pendingFulfillment
         ve digitalOrders gonderiyordu, ekran ise paidCount ve
         pendingFulfillmentCount okuyordu; iki kart bu yuzden hep bos
         cikiyordu. */
      stats: {
        totalOrders: enrichedOrders.length,
        totalRevenue: totalRev,
        paidCount,
        pendingFulfillmentCount,
        awaitingTransferCount,
        awaitingTransferTotal,
      },
    });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/orders');
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const body = await request.json().catch(() => ({}));
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

    if (!customerEmail || total === undefined) {
      return apiBadRequest('customerEmail and total are required.');
    }

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
        unitPrice: String(item.unitPrice || item.price || '0.00'),
        totalPrice: String(item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 1)),
      } as any);
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/orders');
  }
}

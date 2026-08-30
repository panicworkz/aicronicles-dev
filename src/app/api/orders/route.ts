import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orderList = await db.query.orders.findMany({
      orderBy: [desc(schema.orders.createdAt)],
      limit: 100,
    });
    return NextResponse.json({ success: true, orders: orderList });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      items = [],
      total,
      subtotal,
      discount = 0,
      currency = 'USD',
      shippingAddressJson,
      notes,
    } = body;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const [newOrder] = await db
      .insert(schema.orders)
      .values({
        orderNumber,
        customerEmail,
        customerName,
        total: String(total),
        subtotal: String(subtotal),
        discount: String(discount),
        currency,
        paymentStatus: 'pending',
        orderStatus: 'processing',
        shippingAddressJson,
        notes,
      } as any)
      .returning();

    for (const item of items) {
      await db.insert(schema.orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        variantId: item.variantId || null,
        title: item.title,
        quantity: item.quantity || 1,
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice || item.unitPrice * (item.quantity || 1)),
      } as any);
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const items = await db.query.orderItems.findMany({
      where: eq(schema.orderItems.orderId, orderId),
    });

    return NextResponse.json({ success: true, order, items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    const body = await request.json();

    const { paymentStatus, orderStatus, shippingAddressJson, notes } = body;

    const [updatedOrder] = await db
      .update(schema.orders)
      .set({
        paymentStatus: paymentStatus !== undefined ? paymentStatus : undefined,
        orderStatus: orderStatus !== undefined ? orderStatus : undefined,
        shippingAddressJson: shippingAddressJson !== undefined ? shippingAddressJson : undefined,
        notes: notes !== undefined ? notes : undefined,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.orders.id, orderId))
      .returning();

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
    await db.delete(schema.orders).where(eq(schema.orders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
    });

    if (!order) {
      return apiNotFound('Order not found');
    }

    const items = await db.query.orderItems.findMany({
      where: eq(schema.orderItems.orderId, orderId),
    });

    return NextResponse.json({ success: true, order, items });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/orders/[id]');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    const body = await request.json().catch(() => ({}));

    const { paymentStatus, orderStatus, carrier, trackingNumber, shippingAddressJson, notes } = body;

    const [updatedOrder] = await db
      .update(schema.orders)
      .set({
        paymentStatus: paymentStatus !== undefined ? paymentStatus : undefined,
        orderStatus: orderStatus !== undefined ? orderStatus : undefined,
        carrier: carrier !== undefined ? carrier : undefined,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        shippingAddressJson: shippingAddressJson !== undefined ? shippingAddressJson : undefined,
        notes: notes !== undefined ? notes : undefined,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.orders.id, orderId))
      .returning();

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: unknown) {
    return handleApiError(err, 'PUT /api/orders/[id]');
  }
}

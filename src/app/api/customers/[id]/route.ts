import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';
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
    const customerId = parseInt(id, 10);

    const customer = await db.query.customers.findFirst({
      where: eq(schema.customers.id, customerId),
    });

    if (!customer) {
      return apiNotFound('Customer not found');
    }

    // Find orders for this customer by email
    const customerOrders = await db.query.orders.findMany({
      where: eq(schema.orders.customerEmail, customer.email),
      orderBy: [desc(schema.orders.createdAt)],
    });

    return NextResponse.json({ success: true, customer, orders: customerOrders });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/customers/[id]');
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
    const customerId = parseInt(id, 10);
    const body = await request.json().catch(() => ({}));

    const { name, phone, shippingAddressJson } = body;

    const [updatedCust] = await db
      .update(schema.customers)
      .set({
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        shippingAddressJson: shippingAddressJson !== undefined ? shippingAddressJson : undefined,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.customers.id, customerId))
      .returning();

    return NextResponse.json({ success: true, customer: updatedCust });
  } catch (err: unknown) {
    return handleApiError(err, 'PUT /api/customers/[id]');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const customerId = parseInt(id, 10);

    await db.delete(schema.customers).where(eq(schema.customers.id, customerId));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'DELETE /api/customers/[id]');
  }
}

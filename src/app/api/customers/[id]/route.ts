import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id, 10);

    const customer = await db.query.customers.findFirst({
      where: eq(schema.customers.id, customerId),
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Find orders for this customer by email
    const customerOrders = await db.query.orders.findMany({
      where: eq(schema.orders.customerEmail, customer.email),
      orderBy: [desc(schema.orders.createdAt)],
    });

    return NextResponse.json({ success: true, customer, orders: customerOrders });
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
    const customerId = parseInt(id, 10);
    const body = await request.json();

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
    const customerId = parseInt(id, 10);

    await db.delete(schema.customers).where(eq(schema.customers.id, customerId));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const customerList = await db.query.customers.findMany({
      orderBy: [desc(schema.customers.createdAt)],
      limit: 100,
    });
    return NextResponse.json({ success: true, customers: customerList });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

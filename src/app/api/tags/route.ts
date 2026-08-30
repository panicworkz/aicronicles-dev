import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tagList = await db.query.tags.findMany({
      orderBy: [desc(schema.tags.createdAt)],
    });
    return NextResponse.json({ success: true, tags: tagList });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [newTag] = await db.insert(schema.tags).values({
      name: data.name,
      slug,
    }).returning();

    return NextResponse.json({ success: true, tag: newTag });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.delete(schema.tags).where(eq(schema.tags.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

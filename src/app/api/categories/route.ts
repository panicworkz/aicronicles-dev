import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categoriesList = await db.query.categories.findMany({
      orderBy: [desc(schema.categories.createdAt)],
    });

    const postsList = await db.query.posts.findMany();

    const result = categoriesList.map((cat) => {
      const count = postsList.filter((p) => (p as any).categoryId === cat.id).length;
      return {
        ...cat,
        postCount: count,
      };
    });

    return NextResponse.json({ success: true, categories: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [newCat] = await db.insert(schema.categories).values({
      name: data.name,
      slug,
      description: data.description || '',
    } as any).returning();

    return NextResponse.json({ success: true, category: newCat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    if (!data.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const [updated] = await db
      .update(schema.categories)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
      } as any)
      .where(eq(schema.categories.id, parseInt(String(data.id), 10)))
      .returning();

    return NextResponse.json({ success: true, category: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.delete(schema.categories).where(eq(schema.categories.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

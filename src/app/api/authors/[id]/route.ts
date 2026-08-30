import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authorId = parseInt(id, 10);
    const author = await db.query.authors.findFirst({
      where: eq(schema.authors.id, authorId),
    });

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, author });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authorId = parseInt(id, 10);
    const data = await req.json();

    const [updated] = await db
      .update(schema.authors)
      .set({
        name: data.name,
        slug: data.slug,
        role: data.role,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        socialLinks: data.socialLinks,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.authors.id, authorId))
      .returning();

    return NextResponse.json({ success: true, author: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authorId = parseInt(id, 10);

    await db.delete(schema.authors).where(eq(schema.authors.id, authorId));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

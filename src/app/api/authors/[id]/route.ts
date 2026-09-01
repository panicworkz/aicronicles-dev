import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const authorId = parseInt(id, 10);
    const author = await db.query.authors.findFirst({
      where: eq(schema.authors.id, authorId),
    });

    if (!author) {
      return apiNotFound('Author not found');
    }

    return NextResponse.json({ success: true, author });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/authors/[id]');
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const authorId = parseInt(id, 10);
    const data = await req.json().catch(() => ({}));

    const [updated] = await db
      .update(schema.authors)
      .set({
        name: data.name,
        slug: data.slug,
        role: data.role,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        socialLinks: data.socialLinks,
      } as any)
      .where(eq(schema.authors.id, authorId))
      .returning();

    return NextResponse.json({ success: true, author: updated });
  } catch (err: unknown) {
    return handleApiError(err, 'PUT /api/authors/[id]');
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const authorId = parseInt(id, 10);

    await db.delete(schema.authors).where(eq(schema.authors.id, authorId));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, 'DELETE /api/authors/[id]');
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const postId = parseInt(id, 10);

    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId),
    });

    if (!post) {
      return apiNotFound('Post not found');
    }

    return NextResponse.json({ post });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/posts/[id]');
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const postId = parseInt(id, 10);
    const data = await req.json().catch(() => ({}));

    const [updatedPost] = await db
      .update(schema.posts)
      .set({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        contentHtml: data.contentHtml,
        contentJson: data.contentJson,
        featuredImageUrl: data.featuredImageUrl,
        featuredImageId: data.featuredImageId,
        status: data.status,
        authorId: data.authorId ? parseInt(data.authorId, 10) : undefined,
        categoryId: data.categoryId !== undefined ? (data.categoryId ? parseInt(data.categoryId, 10) : null) : undefined,
        tagsJson: data.tagsJson,
        readingTime: data.readingTime,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : (data.status === 'published' ? new Date() : undefined),
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.posts.id, postId))
      .returning();

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/posts/[id]');
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const postId = parseInt(id, 10);

    await db.delete(schema.posts).where(eq(schema.posts.id, postId));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/posts/[id]');
  }
}

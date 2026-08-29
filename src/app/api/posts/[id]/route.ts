import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const postId = parseInt(id);
    const data = await req.json();

    const [updatedPost] = await db.update(schema.posts).set({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      contentHtml: data.contentHtml,
      contentJson: data.contentJson,
      featuredImageUrl: data.featuredImageUrl,
      featuredImageId: data.featuredImageId,
      status: data.status,
      authorId: data.authorId,
      tagsJson: data.tagsJson,
      readingTime: data.readingTime,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : (data.status === 'published' ? new Date() : undefined),
      updatedAt: new Date(),
    } as any).where(eq(schema.posts.id, postId)).returning();

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const postId = parseInt(id);

    await db.delete(schema.posts).where(eq(schema.posts.id, postId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    const revisions = await db.query.postRevisions.findMany({
      where: eq(schema.postRevisions.postId, postId),
      orderBy: [desc(schema.postRevisions.createdAt)],
      limit: 30,
    });

    return NextResponse.json({ success: true, revisions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    const { title, contentHtml, contentJson, excerpt, authorName = 'Editor' } = await request.json();

    const [newRevision] = await db
      .insert(schema.postRevisions)
      .values({
        postId,
        title,
        contentHtml,
        contentJson,
        excerpt,
        authorName,
      } as any)
      .returning();

    return NextResponse.json({ success: true, revision: newRevision });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

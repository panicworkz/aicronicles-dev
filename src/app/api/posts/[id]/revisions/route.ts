import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { handleApiError, apiUnauthorized, apiBadRequest } from '@/lib/api-response';

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
    const postId = parseInt(id, 10);

    const revisions = await db.query.postRevisions.findMany({
      where: eq(schema.postRevisions.postId, postId),
      orderBy: [desc(schema.postRevisions.createdAt)],
      limit: 30,
    });

    return NextResponse.json({ success: true, revisions });
  } catch (err: unknown) {
    return handleApiError(err, 'GET /api/posts/[id]/revisions');
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const postId = parseInt(id, 10);
    const body = await request.json().catch(() => ({}));
    const { title, contentHtml, contentJson, excerpt, authorName = 'Editor' } = body;

    if (!title) {
      return apiBadRequest('Title is required');
    }

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
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/posts/[id]/revisions');
  }
}

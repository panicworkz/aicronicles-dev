import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc, eq, ilike, or } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const MEDIA_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), 'public', 'media');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const condition = search
      ? or(
          ilike(schema.media.filename, `%${search}%`),
          ilike(schema.media.alt, `%${search}%`),
          ilike(schema.media.title, `%${search}%`)
        )
      : undefined;

    const mediaList = await db.query.media.findMany({
      where: condition,
      orderBy: [desc(schema.media.createdAt)],
      limit,
    });

    return NextResponse.json({ success: true, media: mediaList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const alt = (formData.get('alt') as string) || '';
    const title = (formData.get('title') as string) || '';
    const caption = (formData.get('caption') as string) || '';
    const aeoContext = (formData.get('aeoContext') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `${originalName}-${Date.now()}.webp`;
    const targetPath = path.join(MEDIA_DIR, filename);

    // Convert to high quality WebP using sharp
    const imageInfo = await sharp(buffer)
      .webp({ quality: 85 })
      .toFile(targetPath);

    const fileUrl = `/media/${filename}`;

    const [newMedia] = await db.insert(schema.media).values({
      filename,
      url: fileUrl,
      title: title || file.name,
      alt: alt || file.name,
      caption: caption || null,
      aeoContext: aeoContext || null,
      mimeType: 'image/webp',
      filesize: imageInfo.size,
      width: imageInfo.width,
      height: imageInfo.height,
    } as any).returning();

    return NextResponse.json({ success: true, media: newMedia });
  } catch (error: any) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, alt, caption, aeoContext } = body;

    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    const [updated] = await db
      .update(schema.media)
      .set({
        title: title !== undefined ? title : undefined,
        alt: alt !== undefined ? alt : undefined,
        caption: caption !== undefined ? caption : undefined,
        aeoContext: aeoContext !== undefined ? aeoContext : undefined,
      } as any)
      .where(eq(schema.media.id, parseInt(String(id), 10)))
      .returning();

    return NextResponse.json({ success: true, media: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    const mediaId = parseInt(id, 10);
    const item = await db.query.media.findFirst({
      where: eq(schema.media.id, mediaId),
    });

    if (item) {
      // Try to remove file from disk if exists
      try {
        const filePath = path.join(MEDIA_DIR, item.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Could not delete physical file:', err);
      }

      await db.delete(schema.media).where(eq(schema.media.id, mediaId));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

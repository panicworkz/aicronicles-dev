import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/db';
import { desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const MEDIA_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');

export async function GET() {
  try {
    const mediaList = await db.query.media.findMany({
      orderBy: [desc(schema.media.createdAt)],
      limit: 100,
    });
    return NextResponse.json({ media: mediaList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

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
      alt: file.name,
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

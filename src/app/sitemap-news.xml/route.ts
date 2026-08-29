import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, 'published'),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 50,
  });

  const baseUrl = 'https://fabelo.testworkz.com';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${posts.map((p) => `
  <url>
    <loc>${baseUrl}/${p.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Fabelo</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${(p.publishedAt || new Date()).toISOString()}</news:publication_date>
      <news:title><![CDATA[${p.title}]]></news:title>
    </news:news>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

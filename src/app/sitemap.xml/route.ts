import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { SITE } from '@/lib/seo';
import { FABELO_TAGS } from '@/lib/taxonomy';

export const dynamic = 'force-dynamic';

export async function GET() {
  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, 'published'),
    orderBy: [desc(schema.posts.publishedAt)],
  });

  /* Liste sayfalari da haritaya girer. Kategori, etiket ve yazar
     sayfalarina kanonik adres ve yapilandirilmis veri verildi ama
     harita yalnizca yazilari sayiyordu — yani arama motoruna varliklari
     hic bildirilmiyordu. */
  const [kategoriler, yazarlar] = await Promise.all([
    db.query.categories.findMany(),
    db.query.authors.findMany(),
  ]);

  const liste = (yol: string, oncelik: string) => `
  <url>
    <loc>${SITE}${yol}</loc>
    <changefreq>weekly</changefreq>
    <priority>${oncelik}</priority>
  </url>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${posts.map((p) => `
  <url>
    <loc>${SITE}/${p.slug}</loc>
    <lastmod>${(p.updatedAt || p.publishedAt || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${(kategoriler as any[]).map((c) => liste(`/category/${c.slug}`, '0.7')).join('')}
  ${FABELO_TAGS.map((t) => liste(`/tag/${t}`, '0.6')).join('')}
  ${(yazarlar as any[]).map((a) => liste(`/author/${a.slug}`, '0.5')).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq, and, gte } from 'drizzle-orm';
import { SITE } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * Google News haritasi.
 *
 * KURAL: yalnizca SON 48 SAATTE yayimlanan yazilar girer. Google'in
 * sartnamesi boyle; daha eskisini koymak haritayi gecersiz kilar.
 *
 * Onceden en yeni elli yazi listeleniyordu, tarihine bakilmadan. Olcunce
 * kirk yedi girdinin HICBIRI 48 saatlik pencereye girmiyordu (en yenisi
 * bes, en eskisi yuz kirk sekiz gunlukti). Yani Search Console'a
 * verildiginde hata uretecek bir dosyaydi.
 *
 * Pencerede yazi yoksa bos bir urlset donuyor — dogru davranis budur,
 * "haber yok" demek "harita bozuk" demekten iyidir.
 *
 * Bu haritanin bir ise yaramasi icin sitenin Google News Publisher
 * Center'da kayitli olmasi gerekir. Kayitli degilse Google onu zaten
 * okumaz; o yuzden robots.txt artik bunu duyurmuyor, yalnizca
 * sitemap.xml duyuruluyor.
 */
const PENCERE_SAAT = 48;

export async function GET() {
  const esik = new Date(Date.now() - PENCERE_SAAT * 60 * 60 * 1000);

  const posts = await db.query.posts.findMany({
    where: and(eq(schema.posts.status, 'published'), gte(schema.posts.publishedAt, esik)),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 1000,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${(posts as any[])
    .map(
      (p) => `
  <url>
    <loc>${SITE}/${p.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Fabelo</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.publishedAt).toISOString()}</news:publication_date>
      <news:title><![CDATA[${String(p.title).replace(/]]>/g, ']]]]><![CDATA[>')}]]></news:title>
    </news:news>
  </url>`
    )
    .join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Pencere iki saatte bir kayiyor; uzun onbellek eskimis liste verir.
      'Cache-Control': 'public, max-age=600',
    },
  });
}

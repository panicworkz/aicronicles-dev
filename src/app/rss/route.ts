import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { SITE, SITE_ADI, SITE_TANIMI } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * RSS beslemesi.
 *
 * Ghost /rss/ yayinliyordu; bu CMS'te hic yoktu, yani fabelo.io'ya
 * gecerken besleme okuyucularindaki herkes 404 gorecekti. Adres de o
 * yuzden /rss — /feed degil. Next sondaki bolu isaretini 308 ile
 * kendisi duzeltiyor, yani /rss/ de calisiyor.
 *
 * Bir uyari: Ghost'un item kimlikleri (guid) onun kendi nesne
 * kimlikleriydi ve bizde o kimlik yok. Burada guid olarak yazinin
 * adresi kullaniliyor, dolayisiyla mevcut aboneler yazilari bir kez
 * daha yeni gibi gorecek. Kacinilmaz: elimizde olmayan bir kimligi
 * uydurmak, farkli yazilarin ayni kimlige dusmesi riskini tasirdi.
 */

/** CDATA icine guvenli koyma — icerideki ]]> diziyi erken kapatir. */
function cdata(metin: string | null | undefined): string {
  return `<![CDATA[${String(metin ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/** Kok-goreli adresleri mutlaklastirir; okuyucu baska bir kokte calisiyor. */
function mutlakla(html: string): string {
  return html
    .replace(/(<(?:img|source)[^>]+src=")\/(?!\/)/gi, `$1${SITE}/`)
    .replace(/(<a[^>]+href=")\/(?!\/)/gi, `$1${SITE}/`);
}

export async function GET() {
  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, 'published'),
    orderBy: [desc(schema.posts.publishedAt), desc(schema.posts.createdAt)],
    limit: 50,
  });

  const authors = await db.query.authors.findMany();
  const yazarAdi = new Map((authors as any[]).map((a) => [a.id, a.name]));

  const items = (posts as any[])
    .map((p) => {
      const adres = `${SITE}/${p.slug}`;
      const tarih = (p.publishedAt || p.createdAt || new Date()) as Date;
      const etiketler: string[] = Array.isArray(p.tagsJson) ? p.tagsJson : [];
      const gorsel = p.featuredImageUrl
        ? p.featuredImageUrl.startsWith('http')
          ? p.featuredImageUrl
          : `${SITE}${p.featuredImageUrl}`
        : null;
      return `
    <item>
      <title>${cdata(p.title)}</title>
      <description>${cdata(p.excerpt || p.metaDescription || p.title)}</description>
      <link>${adres}</link>
      <guid isPermaLink="true">${adres}</guid>
      ${etiketler.map((t) => `<category>${cdata(t)}</category>`).join('')}
      <dc:creator>${cdata(yazarAdi.get(p.authorId) || SITE_ADI)}</dc:creator>
      <pubDate>${new Date(tarih).toUTCString()}</pubDate>
      ${gorsel ? `<media:content url="${gorsel}" medium="image"/>` : ''}
      <content:encoded>${cdata(mutlakla(p.contentHtml || ''))}</content:encoded>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${cdata(SITE_ADI)}</title>
    <description>${cdata(SITE_TANIMI)}</description>
    <link>${SITE}/</link>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/rss" rel="self" type="application/rss+xml"/>
    <ttl>60</ttl>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

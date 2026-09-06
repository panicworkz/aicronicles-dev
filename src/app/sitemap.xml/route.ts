import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { SITE } from '@/lib/seo';
import { FABELO_TAGS, tagLabel } from '@/lib/taxonomy';

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
  const [kategoriler, yazarlar, sayfalar] = await Promise.all([
    db.query.categories.findMany(),
    db.query.authors.findMany(),
    /* Sabit sayfalar — /about, /advertise, /sponsor ve digerleri.
       Ghost bunlari haritasinda sayiyordu; bizimki saymiyordu, yani
       fabelo.io'ya gecerken bes sayfanin kapsamini KAYBEDECEKTIK. */
    db.query.pages.findMany({ where: eq(schema.pages.status, 'published') }),
  ]);

  const zaman = (d: unknown) => (d instanceof Date ? d : d ? new Date(d as string) : null);

  /** Bir yazi dizisinin en son degisme ani. */
  function enSonDegisim(liste: any[]): Date | null {
    let en: Date | null = null;
    for (const p of liste) {
      const t = zaman(p.updatedAt) || zaman(p.publishedAt) || zaman(p.createdAt);
      if (t && (!en || t > en)) en = t;
    }
    return en;
  }

  /* Etiket eslesmesi TagPage ile ayni kurala uyuyor: yazilar etiketi
     ADIYLA sakliyor ("Personal Finance"), adres ise slug. Harita ile
     sayfa ayni yaziyi saymazsa lastmod yalan soyler. */
  const etiketliMi = (p: any, slug: string) => {
    const ham = JSON.stringify(p.tagsJson ?? '').toLowerCase();
    return ham.includes(tagLabel(slug).toLowerCase()) || ham.includes(slug.toLowerCase());
  };

  const kategoriIdSlug = new Map((kategoriler as any[]).map((c) => [c.id, c.slug]));

  /* lastmod, bir sayfanin gercekten degisip degismedigini soyluyor.
     Yoksa tarayici her ziyarette bastan indirmek zorunda; olan bir
     bilgiyi saklamak tarama butcesini bosa harciyor. Liste sayfalarinin
     tarihi, TASIDIKLARI yazilarin en yenisi — cunku sayfa da o zaman
     degisiyor. */
  const damga = (t: Date | null) => (t ? `\n    <lastmod>${t.toISOString()}</lastmod>` : '');

  const girdi = (yol: string, oncelik: string, sonDegisim: Date | null, siklik = 'weekly') => `
  <url>
    <loc>${SITE}${yol}</loc>${damga(sonDegisim)}
    <changefreq>${siklik}</changefreq>
    <priority>${oncelik}</priority>
  </url>`;

  const tumYazilarinSonu = enSonDegisim(posts as any[]);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${girdi('/', '1.0', tumYazilarinSonu, 'daily')}
  ${(posts as any[])
    .map((p) =>
      girdi(`/${p.slug}`, '0.8', zaman(p.updatedAt) || zaman(p.publishedAt) || new Date())
    )
    .join('')}
  ${(sayfalar as any[]).map((s) => girdi(`/${s.slug}`, '0.7', zaman(s.updatedAt), 'monthly')).join('')}
  ${/* /contact CMS'te degil, kodda bir rota — o yuzden elle. Sitedeki
       butun iletisim oradan gectigi icin haritada olmali. */ ''}
  ${girdi('/contact', '0.6', null, 'yearly')}
  ${(kategoriler as any[])
    .map((c) =>
      girdi(
        `/category/${c.slug}`,
        '0.7',
        enSonDegisim((posts as any[]).filter((p) => p.categoryId === c.id))
      )
    )
    .join('')}
  ${FABELO_TAGS.map((t) =>
    girdi(
      `/tag/${t}`,
      '0.6',
      enSonDegisim(
        (posts as any[]).filter((p) => etiketliMi(p, t) || kategoriIdSlug.get(p.categoryId) === t)
      )
    )
  ).join('')}
  ${(yazarlar as any[])
    .map((a) =>
      girdi(
        `/author/${a.slug}`,
        '0.5',
        enSonDegisim((posts as any[]).filter((p) => p.authorId === a.id))
      )
    )
    .join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

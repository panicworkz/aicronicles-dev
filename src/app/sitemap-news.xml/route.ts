import { getPayload } from '@/lib/getPayload';

export const dynamic = 'force-dynamic';

export async function GET() {
  const payload = await getPayload();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabelo.testworkz.com';

  // Last 48 hours / latest 50 posts for Google News
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 50,
  });

  const items = posts.map((p) => {
    const pubDate = p.publishedAt ? new Date(p.publishedAt).toISOString() : new Date().toISOString();
    return `  <url>
    <loc>${siteUrl}/${p.slug}/</loc>
    <news:news>
      <news:publication>
        <news:name>Fabelo</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${p.title}]]></news:title>
    </news:news>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

import { getPayload } from '@/lib/getPayload';

export const dynamic = 'force-dynamic';

export async function GET() {
  const payload = await getPayload();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabelo.testworkz.com';

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    limit: 1000,
  });

  const { docs: tags } = await payload.find({
    collection: 'tags',
    limit: 100,
  });

  const { docs: pages } = await payload.find({
    collection: 'pages',
    limit: 100,
  });

  const urls: string[] = [
    `  <url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
  ];

  for (const p of posts) {
    const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString();
    urls.push(`  <url><loc>${siteUrl}/${p.slug}/</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  }

  for (const t of tags) {
    urls.push(`  <url><loc>${siteUrl}/tag/${t.slug}/</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
  }

  for (const page of pages) {
    urls.push(`  <url><loc>${siteUrl}/${page.slug}/</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

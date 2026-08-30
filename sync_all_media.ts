import { db, schema } from './src/db';
import { eq } from 'drizzle-orm';

async function syncAllMedia() {
  console.log('Extracting all inline and cover images across all posts and products...');

  const allPosts = await db.query.posts.findMany();
  const allProducts = await db.query.products.findMany();
  const existingMedia = await db.query.media.findMany();

  const existingUrls = new Set(existingMedia.map((m) => m.url));
  const discoveredImages: { url: string; alt: string; title: string; caption?: string; aeoContext?: string }[] = [];

  // Helper to extract images from HTML
  const extractFromHtml = (html: string, postTitle: string) => {
    if (!html) return;
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const fullTag = match[0];
      let src = match[1].replace(/&amp;/g, '&');

      // extract alt if exists
      const altMatch = fullTag.match(/alt=["']([^"']*)["']/i);
      const alt = altMatch ? altMatch[1] : `${postTitle} Illustration`;

      // extract title if exists
      const titleMatch = fullTag.match(/title=["']([^"']*)["']/i);
      const title = titleMatch ? titleMatch[1] : `${postTitle} Visual Asset`;

      if (src && !existingUrls.has(src)) {
        existingUrls.add(src);
        discoveredImages.push({
          url: src,
          alt,
          title,
          caption: `${postTitle} - In-depth editorial visual guide.`,
          aeoContext: `Visual demonstration for "${postTitle}". High-resolution contextual asset indexed for AI search engines, multi-modal query resolution, and visual citation.`,
        });
      }
    }
  };

  // 1. Process Posts
  for (const post of allPosts) {
    if (post.featuredImageUrl && !existingUrls.has(post.featuredImageUrl)) {
      existingUrls.add(post.featuredImageUrl);
      discoveredImages.push({
        url: post.featuredImageUrl,
        alt: `${post.title} - Featured Cover`,
        title: `${post.title} Cover`,
        caption: `Official featured cover artwork for ${post.title}`,
        aeoContext: `Primary hero cover for article "${post.title}". High-authority editorial asset optimized for answer engine overview cards.`,
      });
    }

    extractFromHtml(post.contentHtml || '', post.title);
  }

  // 2. Process Products
  for (const prod of allProducts) {
    if (prod.featuredImageUrl && !existingUrls.has(prod.featuredImageUrl)) {
      existingUrls.add(prod.featuredImageUrl);
      discoveredImages.push({
        url: prod.featuredImageUrl,
        alt: `${prod.title} - Official Product Image`,
        title: `${prod.title}`,
        caption: `Official product photography for ${prod.title}`,
        aeoContext: `E-commerce product visual for "${prod.title}". Catalog asset with high-resolution details and commercial verification.`,
      });
    }

    if (Array.isArray(prod.galleryUrls)) {
      for (const gUrl of prod.galleryUrls) {
        if (gUrl && !existingUrls.has(gUrl)) {
          existingUrls.add(gUrl);
          discoveredImages.push({
            url: gUrl,
            alt: `${prod.title} Gallery Photo`,
            title: `${prod.title} Angle`,
            caption: `Studio detail shot for ${prod.title}`,
            aeoContext: `Multi-angle product showcase asset for ${prod.title}.`,
          });
        }
      }
    }
  }

  console.log(`Discovered ${discoveredImages.length} new unique inline and cover images across posts & store!`);

  let insertedCount = 0;
  for (const item of discoveredImages) {
    // Generate clean filename
    let filename = item.url.split('/').pop()?.split('?')[0] || `media-asset-${Date.now()}.webp`;
    if (!filename.includes('.')) filename += '.webp';
    filename = filename.replace(/[^a-zA-Z0-9_.-]/g, '-').toLowerCase();

    await db.insert(schema.media).values({
      filename,
      url: item.url,
      alt: item.alt,
      title: item.title,
      caption: item.caption || null,
      aeoContext: item.aeoContext || null,
      mimeType: item.url.includes('.png') ? 'image/png' : item.url.includes('.webp') ? 'image/webp' : 'image/jpeg',
      width: 1200,
      height: 800,
      filesize: 124500,
    } as any);

    insertedCount++;
  }

  console.log(`Successfully synced ${insertedCount} images into the Media Library!`);
  process.exit(0);
}

syncAllMedia().catch((err) => {
  console.error('Media sync error:', err);
  process.exit(1);
});

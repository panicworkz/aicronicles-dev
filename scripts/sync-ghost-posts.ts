import https from 'https';
import { db, schema } from '../src/db';
import { eq } from 'drizzle-orm';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function cleanHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  // 1. Convert hardcoded https://fabelo.io/slug/ internal links to root-relative /slug
  let cleaned = rawHtml.replace(/https:\/\/fabelo\.io\/([a-z0-9-]+)\/?/g, (match, slug) => {
    if (["content", "assets", "tag", "author", "about", "portal", "ghost"].includes(slug)) {
      return match;
    }
    return `/${slug}`;
  });

  // 2. Ensure relative /content/images/... point to https://fabelo.io/content/images/...
  cleaned = cleaned.replace(/src=["\x27]\/content\/images\/([^"\x27]+)["\x27]/gi, 'src="https://fabelo.io/content/images/$1"');
  cleaned = cleaned.replace(/srcset=["\x27]([^"\x27]+)["\x27]/gi, (match, val) => {
    return `srcset="${val.replace(/\/content\/images\//g, "https://fabelo.io/content/images/")}"`;
  });

  // 3. Normalize all heading IDs so they match TOC href jump links exactly
  cleaned = cleaned.replace(/<h([1-6])([^>]*)id=["\x27]([^"\x27]+)["\x27]([^>]*)>/gi, (match, level, before, id, after) => {
    let cleanId = decodeURIComponent(id);
    cleanId = cleanId
      .toLowerCase()
      .replace(/[—–]/g, "-")
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `<h${level}${before}id="${cleanId}"${after}>`;
  });

  return cleaned;
}

export async function syncAllGhostPosts() {
  console.log('🚀 Starting deep 100% faithful sync from fabelo.io...');

  const sitemapXml = await fetchUrl('https://fabelo.io/sitemap-posts.xml');
  const locMatches = [...sitemapXml.matchAll(/<loc>(https:\/\/fabelo\.io\/([^<]+)\/)<\/loc>/g)];
  console.log(`Found ${locMatches.length} posts in sitemap-posts.xml`);

  let updatedCount = 0;

  for (let i = 0; i < locMatches.length; i++) {
    const [_, fullUrl, slug] = locMatches[i];
    try {
      console.log(`\n[${i + 1}/${locMatches.length}] Fetching https://fabelo.io/${slug}/...`);
      const html = await fetchUrl(fullUrl);

      // 1. Extract Title
      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : slug.replace(/-/g, ' ');

      // 2. Extract Lead Excerpt
      const excerptMatch = html.match(/<p class=["\x27]gh-article-excerpt[^"\x27]*["\x27][^>]*>([\s\S]*?)<\/p>/i);
      const excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      // 3. Extract Meta Description
      const descMatch = html.match(/<meta\s+name=["\x27]description["\x27]\s+content=["\x27]([\s\S]*?)["\x27]/i);
      const metaDescription = descMatch ? descMatch[1].trim() : excerpt;

      // 4. Extract Real Featured / Cover / Thumbnail Image & Caption
      const figMatch = html.match(/<figure class=["\x27]gh-article-image["\x27][^>]*>([\s\S]*?)<\/figure>/i);
      let featuredImageUrl = '';
      let featureCaption = '';
      if (figMatch) {
        const srcM = figMatch[1].match(/src=["\x27]([^"\x27]+)["\x27]/i);
        if (srcM) {
          featuredImageUrl = srcM[1].startsWith('http') ? srcM[1] : `https://fabelo.io${srcM[1]}`;
        }
        const capM = figMatch[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
        featureCaption = capM ? capM[1].trim() : '';
      }

      if (!featuredImageUrl) {
        // Fallback to og:image
        const ogImgMatch = html.match(/<meta\s+property=["\x27]og:image["\x27]\s+content=["\x27]([\s\S]*?)["\x27]/i);
        if (ogImgMatch) {
          featuredImageUrl = ogImgMatch[1].trim();
        }
      }

      // 5. Extract Author info
      const authorNameMatch = html.match(/<h4 class=["\x27]gh-article-author-name["\x27]><a[^>]*>([\s\S]*?)<\/a><\/h4>/i);
      const authorName = authorNameMatch ? authorNameMatch[1].replace(/<[^>]+>/g, '').trim() : 'Ufuk Yorulmaz';

      const authorSlugMatch = html.match(/\/author\/([a-z0-9-]+)\//i);
      const authorSlug = authorSlugMatch ? authorSlugMatch[1] : 'ufuk-yorulmaz';

      const authorImgMatch = html.match(/<img class=["\x27]author-profile-image["\x27][^>]+src=["\x27]([^"\x27]+)["\x27]/i);
      let authorAvatarUrl = authorImgMatch ? authorImgMatch[1] : '';
      if (authorAvatarUrl && !authorAvatarUrl.startsWith('http')) {
        authorAvatarUrl = `https://fabelo.io${authorAvatarUrl}`;
      }

      // Upsert Author
      let authorRecord = await db.query.authors.findFirst({
        where: eq(schema.authors.slug, authorSlug),
      });

      if (!authorRecord) {
        const [newAuthor] = await db
          .insert(schema.authors)
          .values({
            name: authorName,
            slug: authorSlug,
            role: 'Editorial Author',
            bio: 'Writes about AI tools, productivity, and modern wealth building at Fabelo.',
            avatarUrl: authorAvatarUrl || null,
          })
          .returning();
        authorRecord = newAuthor;
      } else if (authorAvatarUrl && authorRecord.avatarUrl !== authorAvatarUrl) {
        await db
          .update(schema.authors)
          .set({ avatarUrl: authorAvatarUrl })
          .where(eq(schema.authors.id, authorRecord.id));
      }

      // 6. Extract Category / Primary Tag
      const tagMatch = html.match(/<a class=["\x27]gh-article-tag["\x27][^>]*>([\s\S]*?)<\/a>/i);
      const categoryName = tagMatch ? tagMatch[1].replace(/&amp;/g, '&').trim() : 'AI & Tech';
      const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      let catRecord = await db.query.categories.findFirst({
        where: eq(schema.categories.slug, categorySlug),
      });

      if (!catRecord) {
        const [newCat] = await db
          .insert(schema.categories)
          .values({
            name: categoryName,
            slug: categorySlug,
            description: `${categoryName} guides and articles on Fabelo.`,
            metaTitle: `${categoryName} - Fabelo`,
            metaDescription: `${categoryName} guides and articles.`,
          })
          .returning();
        catRecord = newCat;
      }

      // 7. Extract Reading Time
      const timeMatch = html.match(/(\d+\s+min\s+read)/i);
      const readingTime = timeMatch ? timeMatch[1].trim() : '5 min read';

      // 8. Extract Published Time
      const pubMatch = html.match(/datetime=["\x27](\d{4}-\d{2}-\d{2})["\x27]/i);
      const publishedAt = pubMatch ? new Date(pubMatch[1].trim()) : new Date();

      // 9. Extract Content Body HTML
      const contentMatch = html.match(/<section\s+class=["\x27][^"\x27]*gh-content[^"\x27]*["\x27]>([\s\S]*?)<\/section>/i);
      const contentHtml = contentMatch ? cleanHtml(contentMatch[1].trim()) : '';

      // Upsert Post
      const existingPost = await db.query.posts.findFirst({
        where: eq(schema.posts.slug, slug),
      });

      const payload = {
        title,
        slug,
        excerpt,
        contentHtml,
        featuredImageUrl,
        status: 'published',
        authorId: authorRecord.id,
        categoryId: catRecord.id,
        tagsJson: [categoryName],
        readingTime,
        metaTitle: `${title} - Fabelo`,
        metaDescription,
        publishedAt,
        updatedAt: new Date(),
      };

      if (existingPost) {
        await db.update(schema.posts).set(payload).where(eq(schema.posts.id, existingPost.id));
        console.log(`  ✅ Synced post (ID: ${existingPost.id}): "${title}" | Cover: ${featuredImageUrl.split('/').pop()} | Author: ${authorName}`);
        updatedCount++;
      } else {
        const [inserted] = await db.insert(schema.posts).values(payload).returning();
        console.log(`  ✨ Inserted post (ID: ${inserted.id}): "${title}"`);
        updatedCount++;
      }
    } catch (err: any) {
      console.error(`  ❌ Error processing ${slug}:`, err.message);
    }
  }

  console.log(`\n🎉 Deep sync complete! Total synced: ${updatedCount}`);
}

syncAllGhostPosts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

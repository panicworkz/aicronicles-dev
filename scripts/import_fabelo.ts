import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPayload } from 'payload';
import config from '../src/payload.config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, '../migration_data/fabelo_export.json');
const MEDIA_DIR = path.resolve(__dirname, '../media');

async function runImport() {
  console.log('--- Starting Fabelo -> Payload CMS Import ---');

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Export file not found at: ${DATA_FILE}`);
    process.exit(1);
  }

  const exportData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`Loaded ${exportData.posts.length} posts and ${exportData.pages.length} pages.`);

  const payload = await getPayload({ config });

  // 1. Create or Find Authors
  const authorMap = new Map();
  const defaultAuthors = [
    { name: 'Ufuk Yorulmaz', slug: 'ufuk-yorulmaz', role: 'Founder & Tech Lead', bio: 'Founder of Panicworkz & AI Chronicles. Writes on AI agents, automation, and tech engineering.' },
    { name: 'Varn Kutser', slug: 'varn-kutser', role: 'Senior Finance Columnist', bio: 'Specialist in index investing, retirement planning, credit score strategies, and budgeting frameworks.' },
    { name: 'Fabelo', slug: 'fabelo', role: 'Editorial Staff', bio: 'Fabelo editorial desk covering career acceleration, online freelancing, and workplace AI transformations.' }
  ];

  for (const a of defaultAuthors) {
    const existing = await payload.find({
      collection: 'authors',
      where: { slug: { equals: a.slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      authorMap.set(a.name, existing.docs[0].id);
      console.log(`Found author: ${a.name}`);
    } else {
      const created = await payload.create({
        collection: 'authors',
        data: a,
      });
      authorMap.set(a.name, created.id);
      console.log(`Created author: ${a.name}`);
    }
  }

  // 2. Create or Find Tags
  const tagMap = new Map();
  const defaultTags = [
    { name: 'Personal Finance', slug: 'personal-finance', description: 'Actionable money guides, budgeting, high yield savings, and investing tactics.', color: '#16a34a' },
    { name: 'Career', slug: 'career', description: 'Career pivots, remote work, salary negotiation, and future-proof skills.', color: '#2563eb' },
    { name: 'AI & Tech', slug: 'ai-tech', description: 'Curated AI productivity tools, workplace automation, and LLM guides.', color: '#9333ea' },
    { name: 'General', slug: 'general', description: 'General articles and guides.', color: '#6b7280' }
  ];

  for (const t of defaultTags) {
    const existing = await payload.find({
      collection: 'tags',
      where: { slug: { equals: t.slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      tagMap.set(t.name, existing.docs[0].id);
      tagMap.set(t.slug, existing.docs[0].id);
      console.log(`Found tag: ${t.name}`);
    } else {
      const created = await payload.create({
        collection: 'tags',
        data: t,
      });
      tagMap.set(t.name, created.id);
      tagMap.set(t.slug, created.id);
      console.log(`Created tag: ${t.name}`);
    }
  }

  // 3. Create or Find Media
  const mediaMap = new Map();
  async function getOrCreateMedia(filename) {
    if (!filename) return null;
    if (mediaMap.has(filename)) return mediaMap.get(filename);

    const filePath = path.join(MEDIA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      mediaMap.set(filename, existing.docs[0].id);
      return existing.docs[0].id;
    }

    try {
      const created = await payload.create({
        collection: 'media',
        data: {
          alt: filename.replace(/[-_.]+/g, ' '),
        },
        filePath,
      });
      mediaMap.set(filename, created.id);
      return created.id;
    } catch (err) {
      console.error(`Error uploading media ${filename}:`, err.message);
      return null;
    }
  }

  // 4. Import Posts
  let importedPosts = 0;
  for (const post of exportData.posts) {
    const authorId = authorMap.get(post.authorName) || authorMap.get('Fabelo');
    
    // Tag matching
    let tagId = tagMap.get(post.tag) || tagMap.get(post.tagSlug.toLowerCase());
    if (!tagId) {
      if (post.tagSlug.toLowerCase().includes('finance') || post.slug.includes('budget') || post.slug.includes('invest') || post.slug.includes('credit')) {
        tagId = tagMap.get('Personal Finance');
      } else if (post.slug.includes('ai') || post.tagSlug.toLowerCase().includes('ai')) {
        tagId = tagMap.get('AI & Tech');
      } else {
        tagId = tagMap.get('Career');
      }
    }

    let mediaId = null;
    if (post.featuredImageFile) {
      mediaId = await getOrCreateMedia(post.featuredImageFile);
    }

    const existingPost = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
    });

    const postPayload = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      contentHtml: post.contentHtml,
      featuredImage: mediaId,
      author: authorId,
      tags: tagId ? [tagId] : [],
      publishedAt: post.publishedAt,
      status: 'published',
      readingTime: '5 min read',
      meta: {
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.excerpt,
        canonical: post.canonical,
      },
    };

    if (existingPost.docs.length > 0) {
      await payload.update({
        collection: 'posts',
        id: existingPost.docs[0].id,
        data: postPayload,
      });
      console.log(`Updated post: ${post.title}`);
    } else {
      await payload.create({
        collection: 'posts',
        data: postPayload,
      });
      console.log(`Created post: ${post.title}`);
    }
    importedPosts++;
  }

  // 5. Import Pages
  for (const page of exportData.pages) {
    const existingPage = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    });

    const pagePayload = {
      title: page.title,
      slug: page.slug,
      contentHtml: page.contentHtml,
      meta: {
        title: page.metaTitle || page.title,
        description: page.metaDescription || page.title,
      },
    };

    if (existingPage.docs.length > 0) {
      await payload.update({
        collection: 'pages',
        id: existingPage.docs[0].id,
        data: pagePayload,
      });
      console.log(`Updated page: ${page.title}`);
    } else {
      await payload.create({
        collection: 'pages',
        data: pagePayload,
      });
      console.log(`Created page: ${page.title}`);
    }
  }

  console.log(`\n🎉 IMPORT COMPLETED SUCCESSFULLY! Imported ${importedPosts} posts and ${exportData.pages.length} pages.`);
  process.exit(0);
}

runImport().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});

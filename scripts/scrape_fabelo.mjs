import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://fabelo.io';
const MEDIA_DIR = path.resolve(__dirname, '../migration_data/media');
const DATA_FILE = path.resolve(__dirname, '../migration_data/fabelo_export.json');

if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) throw new Error(`Status ${res.status} for ${url}`);
    return await res.text();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
    return null;
  }
}

async function downloadImage(imgUrl) {
  if (!imgUrl) return null;
  try {
    const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
    const urlObj = new URL(fullUrl);
    const filename = path.basename(urlObj.pathname);
    const destPath = path.join(MEDIA_DIR, filename);

    if (fs.existsSync(destPath)) {
      return { filename, localPath: destPath, originalUrl: fullUrl };
    }

    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    console.log(`Downloaded image: ${filename}`);
    return { filename, localPath: destPath, originalUrl: fullUrl };
  } catch (err) {
    console.error(`Failed to download image ${imgUrl}:`, err.message);
    return null;
  }
}

function extractMeta(html, tag, attr = 'name', val = 'content') {
  const regex = new RegExp(`<meta[^>]*${attr}=["']${tag}["'][^>]*${val}=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  if (match) return match[1];
  const regexAlt = new RegExp(`<meta[^>]*${val}=["']([^"']*)["'][^>]*${attr}=["']${tag}["']`, 'i');
  const matchAlt = html.match(regexAlt);
  return matchAlt ? matchAlt[1] : null;
}

function parsePostPage(html, url) {
  const slug = url.replace(BASE_URL, '').replace(/^\/|\/$/g, '');

  // Title
  const titleMatch = html.match(/<h1[^>]*class=["'][^"']*article-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]+>/g, '') : '';

  // Excerpt / Subtitle
  const excerptMatch = html.match(/<p[^>]*class=["'][^"']*article-excerpt[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  const excerpt = excerptMatch ? excerptMatch[1].trim().replace(/<[^>]+>/g, '') : (extractMeta(html, 'description') || '');

  // Featured Image
  let featuredImg = extractMeta(html, 'og:image', 'property');
  if (!featuredImg) {
    const imgMatch = html.match(/<figure[^>]*class=["'][^"']*article-image[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i);
    if (imgMatch) featuredImg = imgMatch[1];
  }

  // Article Content
  const contentMatch = html.match(/<section[^>]*class=["'][^"']*gh-content[^"']*["'][^>]*>([\s\S]*?)<\/section>/i) ||
                       html.match(/<section[^>]*class=["'][^"']*article-content[^"']*["'][^>]*>([\s\S]*?)<\/section>/i) ||
                       html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const contentHtml = contentMatch ? contentMatch[1].trim() : '';

  // Author
  const authorMatch = html.match(/<a[^>]*class=["'][^"']*author-name[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) ||
                      html.match(/<div[^>]*class=["'][^"']*author-name[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  let authorName = authorMatch ? authorMatch[1].trim().replace(/<[^>]+>/g, '') : 'Fabelo';
  const metaAuthor = extractMeta(html, 'author');
  if (metaAuthor) authorName = metaAuthor;

  // Published Date
  const dateMatch = html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
  let publishedAt = dateMatch ? dateMatch[1] : (extractMeta(html, 'article:published_time', 'property') || new Date().toISOString());

  // Primary Tag / Category
  const tagMatch = html.match(/<a[^>]*class=["'][^"']*article-tag[^"']*["'][^>]*>([\s\S]*?)<\/a>/i) ||
                   html.match(/<a[^>]*href=["']\/tag\/([^"']+)[\/]?["'][^>]*>([\s\S]*?)<\/a>/i);
  let tag = tagMatch ? (tagMatch[2] || tagMatch[1]).trim().replace(/<[^>]+>/g, '') : 'General';
  let tagSlug = tagMatch ? (tagMatch[1].includes('/') ? tag.toLowerCase().replace(/[^a-z0-9]+/g, '-') : tagMatch[1]) : 'general';

  // SEO & Meta
  const metaTitle = extractMeta(html, 'og:title', 'property') || title;
  const metaDescription = extractMeta(html, 'description') || extractMeta(html, 'og:description', 'property') || excerpt;
  const canonical = extractMeta(html, 'canonical') || `${BASE_URL}/${slug}/`;

  // Find all inline images in content to download
  const inlineImages = [];
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(contentHtml)) !== null) {
    inlineImages.push(match[1]);
  }

  return {
    title,
    slug,
    url,
    excerpt,
    featuredImg,
    contentHtml,
    authorName,
    publishedAt,
    tag,
    tagSlug,
    metaTitle,
    metaDescription,
    canonical,
    inlineImages
  };
}

async function scrapeAll() {
  console.log('Fetching sitemaps from Fabelo.io...');
  const sitemapXml = await fetchText(`${BASE_URL}/sitemap-posts.xml`);
  if (!sitemapXml) {
    console.error('Failed to fetch posts sitemap');
    return;
  }

  const postUrls = [];
  const locRegex = /<loc>(https:\/\/fabelo\.io\/[^<]+)<\/loc>/g;
  let locMatch;
  while ((locMatch = locRegex.exec(sitemapXml)) !== null) {
    postUrls.push(locMatch[1]);
  }

  console.log(`Found ${postUrls.length} posts in sitemap.`);

  const posts = [];
  const authorsSet = new Set();
  const tagsSet = new Set();

  for (let i = 0; i < postUrls.length; i++) {
    const postUrl = postUrls[i];
    console.log(`[${i + 1}/${postUrls.length}] Scraping: ${postUrl}`);
    const html = await fetchText(postUrl);
    if (!html) continue;

    const postData = parsePostPage(html, postUrl);

    // Download featured image
    if (postData.featuredImg) {
      const imgInfo = await downloadImage(postData.featuredImg);
      postData.featuredImageFile = imgInfo ? imgInfo.filename : null;
    }

    // Download inline images
    postData.inlineImageFiles = [];
    for (const inlineImg of postData.inlineImages) {
      const imgInfo = await downloadImage(inlineImg);
      if (imgInfo) postData.inlineImageFiles.push(imgInfo.filename);
    }

    authorsSet.add(postData.authorName);
    tagsSet.add(JSON.stringify({ name: postData.tag, slug: postData.tagSlug }));
    posts.push(postData);
  }

  // Scrape Pages
  const pages = [];
  const pageUrls = [
    `${BASE_URL}/about/`,
    `${BASE_URL}/advertise/`,
    `${BASE_URL}/sponsor/`,
    `${BASE_URL}/terms-and-conditions/`,
    `${BASE_URL}/data-and-privacy/`
  ];

  for (const pageUrl of pageUrls) {
    console.log(`Scraping page: ${pageUrl}`);
    const html = await fetchText(pageUrl);
    if (!html) continue;
    const pageData = parsePostPage(html, pageUrl);
    pages.push(pageData);
  }

  const exportData = {
    scrapedAt: new Date().toISOString(),
    postsCount: posts.length,
    pagesCount: pages.length,
    authors: Array.from(authorsSet),
    tags: Array.from(tagsSet).map(t => JSON.parse(t)),
    posts,
    pages
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(exportData, null, 2));
  console.log(`\n Successfully exported ${posts.length} posts and ${pages.length} pages to ${DATA_FILE}`);
}

scrapeAll();

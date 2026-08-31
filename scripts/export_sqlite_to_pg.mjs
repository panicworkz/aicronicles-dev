import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlitePath = path.join(__dirname, '../payload.db');
const sqlite = new Database(sqlitePath);

async function generateSql() {
  let sql = `
-- PANIC CMS POSTGRESQL INITIAL SCHEMA & DATA

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'Editorial Staff',
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#2563eb',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  mime_type TEXT DEFAULT 'image/jpeg',
  filesize INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content_json JSONB,
  content_html TEXT,
  featured_image_id INTEGER,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  author_id INTEGER,
  category_id INTEGER,
  tags_json JSONB DEFAULT '[]'::jsonb,
  reading_time TEXT DEFAULT '5 min read',
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_json JSONB,
  content_html TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`;

  // Admin user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123Pan_?', salt);
  sql += `\nINSERT INTO users (id, name, email, password_hash, role) VALUES (1, 'Fabelo Admin', 'support@fabelo.io', '${passwordHash}', 'admin') ON CONFLICT (email) DO UPDATE SET password_hash = '${passwordHash}';\n`;

  // Categories
  const defaultCats = [
    { id: 1, name: 'Personal Finance', slug: 'personal-finance', description: 'Actionable money guides, budgeting, high yield savings, and investing tactics.' },
    { id: 2, name: 'Career', slug: 'career', description: 'Career pivots, remote work, salary negotiation, and future-proof skills.' },
    { id: 3, name: 'AI & Tech', slug: 'ai-tech', description: 'Curated AI productivity tools, workplace automation, and LLM guides.' },
    { id: 4, name: 'General', slug: 'general', description: 'General articles and guides.' }
  ];
  for (const c of defaultCats) {
    sql += `INSERT INTO categories (id, name, slug, description) VALUES (${c.id}, '${c.name.replace(/'/g, "''")}', '${c.slug}', '${c.description.replace(/'/g, "''")}') ON CONFLICT (id) DO UPDATE SET name = '${c.name.replace(/'/g, "''")}', description = '${c.description.replace(/'/g, "''")}';\n`;
  }

  // Media
  const mediaRows = sqlite.prepare('SELECT * FROM media').all();
  for (const m of mediaRows) {
    const url = m.url || `/media/${m.filename}`;
    const alt = (m.alt || '').replace(/'/g, "''");
    const mime = m.mime_type || 'image/jpeg';
    sql += `INSERT INTO media (id, filename, url, alt, mime_type, filesize, width, height) VALUES (${m.id}, '${m.filename}', '${url}', '${alt}', '${mime}', ${m.filesize || 0}, ${m.width || 0}, ${m.height || 0}) ON CONFLICT (id) DO UPDATE SET url = '${url}';\n`;
  }

  // Authors
  const authorRows = sqlite.prepare('SELECT * FROM authors').all();
  for (const a of authorRows) {
    const name = (a.name || '').replace(/'/g, "''");
    const slug = (a.slug || '').replace(/'/g, "''");
    const role = (a.role || '').replace(/'/g, "''");
    const bio = (a.bio || '').replace(/'/g, "''");
    sql += `INSERT INTO authors (id, name, slug, role, bio) VALUES (${a.id}, '${name}', '${slug}', '${role}', '${bio}') ON CONFLICT (id) DO UPDATE SET name = '${name}';\n`;
  }

  // Tags
  const tagRows = sqlite.prepare('SELECT * FROM tags').all();
  for (const t of tagRows) {
    const name = (t.name || '').replace(/'/g, "''");
    const slug = (t.slug || '').replace(/'/g, "''");
    const desc = (t.description || '').replace(/'/g, "''");
    sql += `INSERT INTO tags (id, name, slug, description, color) VALUES (${t.id}, '${name}', '${slug}', '${desc}', '${t.color || '#2563eb'}') ON CONFLICT (id) DO UPDATE SET name = '${name}';\n`;
  }

  // Post Tag Relations lookup
  const rels = sqlite.prepare(`
    SELECT r.parent_id, t.id as tag_id, t.name as tag_name, t.slug as tag_slug
    FROM posts_rels r
    JOIN tags t ON t.id = r.tags_id
    WHERE r.path = 'tags'
  `).all();
  const postTagMap = new Map();
  for (const r of rels) {
    postTagMap.set(r.parent_id, r);
  }

  // Posts
  const postRows = sqlite.prepare('SELECT * FROM posts').all();
  for (const p of postRows) {
    const title = (p.title || '').replace(/'/g, "''");
    const slug = (p.slug || '').replace(/'/g, "''");
    const excerpt = (p.excerpt || '').replace(/'/g, "''");
    const contentHtml = (p.content_html || '').replace(/'/g, "''");
    const status = (p._status || 'published').replace(/'/g, "''");
    const readingTime = (p.reading_time || '5 min read').replace(/'/g, "''");
    const metaTitle = (p.meta_title || p.title || '').replace(/'/g, "''");
    const metaDesc = (p.meta_description || p.excerpt || '').replace(/'/g, "''");
    const publishedAt = p.published_at ? `'${p.published_at}'` : 'CURRENT_TIMESTAMP';
    
    let featUrl = '/media/default.webp';
    if (p.featured_image_id) {
      const img = mediaRows.find(m => m.id === p.featured_image_id);
      if (img) featUrl = img.url || `/media/${img.filename}`;
    }

    const tagRel = postTagMap.get(p.id);
    let catId = 4;
    let tagsJson = '[]';
    if (tagRel) {
      if (tagRel.tag_slug === 'personal-finance') catId = 1;
      else if (tagRel.tag_slug === 'career') catId = 2;
      else if (tagRel.tag_slug === 'ai-tech') catId = 3;
      tagsJson = JSON.stringify([{ id: tagRel.tag_id, name: tagRel.tag_name, slug: tagRel.tag_slug }]).replace(/'/g, "''");
    }

    sql += `INSERT INTO posts (id, title, slug, excerpt, content_html, featured_image_id, featured_image_url, status, author_id, category_id, tags_json, reading_time, meta_title, meta_description, published_at) VALUES (${p.id}, '${title}', '${slug}', '${excerpt}', '${contentHtml}', ${p.featured_image_id || 'NULL'}, '${featUrl}', '${status}', ${p.author_id || 1}, ${catId}, '${tagsJson}', '${readingTime}', '${metaTitle}', '${metaDesc}', ${publishedAt}) ON CONFLICT (id) DO UPDATE SET title = '${title}', content_html = '${contentHtml}', featured_image_url = '${featUrl}', category_id = ${catId}, tags_json = '${tagsJson}';\n`;
  }

  // Pages
  const pageRows = sqlite.prepare('SELECT * FROM pages').all();
  for (const page of pageRows) {
    const title = (page.title || '').replace(/'/g, "''");
    const slug = (page.slug || '').replace(/'/g, "''");
    const contentHtml = (page.content_html || '').replace(/'/g, "''");
    const metaTitle = (page.meta_title || page.title || '').replace(/'/g, "''");
    const metaDesc = (page.meta_description || '').replace(/'/g, "''");
    sql += `INSERT INTO pages (id, title, slug, content_html, status, meta_title, meta_description) VALUES (${page.id}, '${title}', '${slug}', '${contentHtml}', 'published', '${metaTitle}', '${metaDesc}') ON CONFLICT (id) DO UPDATE SET title = '${title}', content_html = '${contentHtml}';\n`;
  }

  sql += `
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));
SELECT setval('media_id_seq', (SELECT MAX(id) FROM media));
SELECT setval('authors_id_seq', (SELECT MAX(id) FROM authors));
SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('pages_id_seq', (SELECT MAX(id) FROM pages));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
`;

  fs.writeFileSync(path.join(__dirname, '../panic_cms_dump.sql'), sql);
  console.log('✓ Created panic_cms_dump.sql with all tables, categories, tags, users, posts, media.');
}

generateSql();

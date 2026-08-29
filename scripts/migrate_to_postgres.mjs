import Database from 'better-sqlite3';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://fabelo_user:fabelo_secure_db_pass_2026@127.0.0.1:5432/panic_cms';
const pool = new Pool({ connectionString });

async function migrate() {
  console.log('=== STARTING PANIC CMS MIGRATION ===');
  const client = await pool.connect();

  try {
    // 1. Create Tables in PostgreSQL
    console.log('1. Creating tables in PostgreSQL...');
    await client.query(`
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
    `);
    console.log('✓ Tables created successfully.');

    // 2. Create Admin User (support@fabelo.io / 123Pan_?)
    console.log('2. Ensuring Admin User exists...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123Pan_?', salt);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET password_hash = $3
    `, ['Fabelo Admin', 'support@fabelo.io', passwordHash, 'admin']);
    console.log('✓ Admin user verified: support@fabelo.io');

    // 3. Read from payload.db SQLite
    const sqlitePath = path.join(__dirname, '../payload.db');
    const sqlite = new Database(sqlitePath);

    // Migrate Media
    console.log('3. Migrating Media...');
    const mediaRows = sqlite.prepare('SELECT * FROM media').all();
    for (const m of mediaRows) {
      await client.query(`
        INSERT INTO media (id, filename, url, alt, mime_type, filesize, width, height)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET url = $3, filename = $2
      `, [m.id, m.filename, m.url || `/media/${m.filename}`, m.alt, m.mime_type, m.filesize, m.width, m.height]);
    }
    console.log(`✓ Migrated ${mediaRows.length} media files.`);

    // Migrate Authors
    console.log('4. Migrating Authors...');
    const authorRows = sqlite.prepare('SELECT * FROM authors').all();
    for (const a of authorRows) {
      await client.query(`
        INSERT INTO authors (id, name, slug, role, bio)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3
      `, [a.id, a.name, a.slug, a.role, a.bio]);
    }
    console.log(`✓ Migrated ${authorRows.length} authors.`);

    // Migrate Tags
    console.log('5. Migrating Tags...');
    const tagRows = sqlite.prepare('SELECT * FROM tags').all();
    for (const t of tagRows) {
      await client.query(`
        INSERT INTO tags (id, name, slug, description, color)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3
      `, [t.id, t.name, t.slug, t.description, t.color]);
    }
    console.log(`✓ Migrated ${tagRows.length} tags.`);

    // Migrate Posts
    console.log('6. Migrating Posts...');
    const postRows = sqlite.prepare('SELECT * FROM posts').all();
    for (const p of postRows) {
      // Find featured image URL
      let featUrl = '/media/default.webp';
      if (p.featured_image_id) {
        const img = mediaRows.find(m => m.id === p.featured_image_id);
        if (img) featUrl = img.url || `/media/${img.filename}`;
      }

      await client.query(`
        INSERT INTO posts (
          id, title, slug, excerpt, content_html, featured_image_id, featured_image_url,
          status, author_id, reading_time, meta_title, meta_description, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          title = $2, slug = $3, excerpt = $4, content_html = $5,
          featured_image_url = $7, status = $8, updated_at = CURRENT_TIMESTAMP
      `, [
        p.id, p.title, p.slug, p.excerpt, p.content_html,
        p.featured_image_id, featUrl, p._status || 'published',
        p.author_id || 1, p.reading_time || '5 min read',
        p.meta_title || p.title, p.meta_description || p.excerpt,
        p.published_at ? new Date(p.published_at) : new Date()
      ]);
    }
    console.log(`✓ Migrated ${postRows.length} posts.`);

    // Migrate Pages
    console.log('7. Migrating Pages...');
    const pageRows = sqlite.prepare('SELECT * FROM pages').all();
    for (const page of pageRows) {
      await client.query(`
        INSERT INTO pages (id, title, slug, content_html, status, meta_title, meta_description)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET title = $2, content_html = $4
      `, [
        page.id, page.title, page.slug, page.content_html,
        page._status || 'published', page.meta_title || page.title, page.meta_description
      ]);
    }
    console.log(`✓ Migrated ${pageRows.length} pages.`);

    // Set auto-increment sequences
    await client.query(`
      SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));
      SELECT setval('media_id_seq', (SELECT MAX(id) FROM media));
      SELECT setval('authors_id_seq', (SELECT MAX(id) FROM authors));
      SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));
      SELECT setval('pages_id_seq', (SELECT MAX(id) FROM pages));
      SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
    `);
    console.log('✓ Auto-increment sequences aligned.');
    console.log('🎉 ALL DATA MIGRATED TO POSTGRESQL SUCCESSFULLY!');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

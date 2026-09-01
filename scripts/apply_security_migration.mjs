import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URI ||
  process.env.PG_URL ||
  'postgresql://panic:panic_secure_password@127.0.0.1:5432/panic_cms';

console.log('🔄 Connecting to PostgreSQL database...');
const pool = new Pool({ connectionString });

async function run() {
  let client;
  try {
    client = await pool.connect();
    const sqlPath = path.join(__dirname, 'schema_migration_v2.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Applying Schema Migration V2 (Foreign Keys, Indexes & Ads Table)...');
    await client.query(sqlContent);
    console.log('✅ Migration applied successfully! Foreign Keys, Indexes, and Ads table are active.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();

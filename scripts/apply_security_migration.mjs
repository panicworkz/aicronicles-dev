import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URI ||
  'postgresql://fabelo_user:fabelo_secure_db_pass_2026@127.0.0.1:5432/panic_cms';

console.log(' Connecting to PostgreSQL database...');
const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'schema_migration_v2.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log(' Applying Foreign Keys & Indexes Migration (schema_migration_v2.sql)...');
    await client.query(sqlContent);
    console.log(' Migration applied successfully! Foreign Keys and Indexes are active.');
  } catch (err) {
    console.error(' Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

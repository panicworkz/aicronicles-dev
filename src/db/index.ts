import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://fabelo_user:fabelo_secure_db_pass_2026@127.0.0.1:5432/panic_cms';

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
export { schema };

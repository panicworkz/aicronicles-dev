import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Authors } from './collections/Authors';
import { Tags } from './collections/Tags';
import { Posts } from './collections/Posts';
import { Pages } from './collections/Pages';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const databaseUri = process.env.DATABASE_URI || '';

const db = databaseUri.startsWith('postgres')
  ? postgresAdapter({
      pool: {
        connectionString: databaseUri,
      },
    })
  : sqliteAdapter({
      client: {
        url: databaseUri || 'file:./payload.db',
      },
    });

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Authors, Tags, Posts, Pages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'fabelo-secret-key-9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db,
  sharp,
});

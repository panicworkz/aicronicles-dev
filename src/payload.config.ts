import { buildConfig } from 'payload';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { Posts } from './collections/Posts';
import { Pages } from './collections/Pages';
import { Media } from './collections/Media';
import { Users } from './collections/Users';
import { Authors } from './collections/Authors';
import { Tags } from './collections/Tags';
import { AiTools } from './collections/AiTools';
import { SiteSettings } from './globals/SiteSettings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const isPostgres = process.env.DATABASE_URI && process.env.DATABASE_URI.startsWith('postgres');

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  collections: [
    Posts,
    AiTools,
    Pages,
    Media,
    Authors,
    Tags,
    Users,
  ],
  globals: [
    SiteSettings,
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'fabelo-dev-secret-key-34a81281-9638-4f9b-bc29',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: isPostgres
    ? postgresAdapter({
        pool: {
          connectionString: process.env.DATABASE_URI || '',
        },
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URI || 'file:./payload.db',
        },
      }),
  sharp,
});

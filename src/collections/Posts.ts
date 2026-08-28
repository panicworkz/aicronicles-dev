import type { CollectionConfig } from 'payload';

async function pingIndexNow(slug: string) {
  try {
    const host = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'fabelo.testworkz.com';
    const key = process.env.INDEXNOW_KEY || 'fabelo_indexnow_key_2026';
    const url = `https://${host}/${slug}/`;

    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: [url],
      }),
    });
    console.log(`[IndexNow] Pinged URL: ${url}`);
  } catch (err) {
    // Non-blocking in dev/offline
  }
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'author', 'publishedAt', 'status'],
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        if (doc.status === 'published' && doc.slug) {
          await pingIndexNow(doc.slug);
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: false,
      maxLength: 10000,
    },
    {
      name: 'contentHtml',
      type: 'textarea',
      required: false,
      maxLength: 2000000, // Supports massive deep-dive guides
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: false,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'readingTime',
      type: 'text',
      defaultValue: '5 min read',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'published',
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Meta Title',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Meta Description',
          maxLength: 10000,
        },
        {
          name: 'canonical',
          type: 'text',
          label: 'Canonical URL',
        },
      ],
    },
  ],
};

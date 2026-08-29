import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'publishedAt'],
    livePreview: {
      url: ({ data }) => {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabelo.testworkz.com';
        return `${siteUrl}/${data.slug}`;
      },
    },
  },
  versions: {
    drafts: {
      autosave: {
        interval: 1500, // Autosave every 1.5 seconds while typing
      },
    },
    maxPerDoc: 50, // Keep 50 revisions for rollbacks
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
      admin: {
        description: 'Brief summary for search engines, AI crawlers, and social previews',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    {
      name: 'contentHtml',
      type: 'textarea',
      maxLength: 2000000,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'readingTime',
      type: 'text',
      defaultValue: '5 min read',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'canonical', type: 'text' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (doc._status === 'published' || doc.status === 'published') {
          try {
            const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'fabelo.testworkz.com';
            const key = process.env.INDEXNOW_KEY || 'fabelo_indexnow_key_2026';
            const url = `https://${domain}/${doc.slug}`;
            await fetch('https://api.indexnow.org/indexnow', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                host: domain,
                key: key,
                keyLocation: `https://${domain}/${key}.txt`,
                urlList: [url],
              }),
            });
          } catch (e) {
            console.error('IndexNow ping error:', e);
          }
        }
      },
    ],
  },
};

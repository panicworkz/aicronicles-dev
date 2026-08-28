import type { CollectionConfig } from 'payload';

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'role'],
  },
  fields: [
    {
      name: 'name',
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
      name: 'role',
      type: 'text',
      defaultValue: 'Contributor & Writer',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'twitter',
      type: 'text',
    },
    {
      name: 'linkedin',
      type: 'text',
    },
    {
      name: 'website',
      type: 'text',
    },
  ],
};

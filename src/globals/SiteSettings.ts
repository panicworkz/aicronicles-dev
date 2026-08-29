import type { GlobalConfig } from 'payload';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Configuration',
  },
  fields: [
    {
      name: 'general',
      type: 'group',
      label: 'General Branding',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          defaultValue: 'Fabelo',
          required: true,
        },
        {
          name: 'tagline',
          type: 'text',
          defaultValue: 'Premier Tech & Finance Publications',
        },
        {
          name: 'logoText',
          type: 'text',
          defaultValue: 'FABELO',
        },
      ],
    },
    {
      name: 'modules',
      type: 'group',
      label: 'Feature Modules (On/Off Switches)',
      fields: [
        {
          name: 'enableEcommerce',
          type: 'checkbox',
          label: 'Enable E-Commerce & Digital Products Store',
          defaultValue: false,
          admin: {
            description: 'When enabled, Product catalog, Cart, and Stripe Checkout become available.',
          },
        },
        {
          name: 'enableMultiLanguage',
          type: 'checkbox',
          label: 'Enable Multi-Language / Localization (i18n)',
          defaultValue: false,
          admin: {
            description: 'When enabled, articles can be published in multiple languages (EN, TR, DE).',
          },
        },
        {
          name: 'enableAiToolsDirectory',
          type: 'checkbox',
          label: 'Enable AI & Software Tools Directory',
          defaultValue: true,
          admin: {
            description: 'Directory for rating and comparing AI tools & productivity software.',
          },
        },
        {
          name: 'enableNewsletter',
          type: 'checkbox',
          label: 'Enable Newsletter & Lead Capture',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'socials',
      type: 'group',
      label: 'Social & Community Links',
      fields: [
        { name: 'twitter', type: 'text', label: 'X / Twitter URL' },
        { name: 'linkedin', type: 'text', label: 'LinkedIn URL' },
        { name: 'youtube', type: 'text', label: 'YouTube URL' },
        { name: 'github', type: 'text', label: 'GitHub URL' },
      ],
    },
  ],
};

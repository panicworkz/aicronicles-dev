import { db, schema } from './src/db';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding products with multi-photo gallery...');

  const updates = [
    {
      slug: 'minimalist-matte-ceramic-mug',
      galleryUrls: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1536939459926-301728717817?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      slug: 'full-grain-leather-desk-pad',
      galleryUrls: [
        'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      slug: 'aeo-masterclass-llm-citation-playbook',
      galleryUrls: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
      ],
    },
  ];

  for (const item of updates) {
    await db
      .update(schema.products)
      .set({ galleryUrls: item.galleryUrls } as any)
      .where(eq(schema.products.slug, item.slug));
    console.log(`Updated gallery for ${item.slug}`);
  }

  console.log('Gallery updates complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

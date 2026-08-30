import { db, schema } from './src/db';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding rich specifications and categories into demo products...');

  const categories = await db.query.productCategories.findMany();
  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  const updates = [
    {
      slug: 'aeo-masterclass-llm-citation-playbook',
      categoryId: catMap.get('digital-assets') || null,
      checkoutUrl: 'https://buy.stripe.com/test_aeo_playbook',
      specificationsJson: [
        { key: 'Format', value: 'PDF, ePub & Interactive Schema Builder' },
        { key: 'Page Count', value: '184 Pages with Case Studies' },
        { key: 'Access Level', value: 'Instant Lifetime Access & Free Updates' },
        { key: 'AEO Compliance', value: '100% LLM Citation Optimized (2026)' },
      ],
    },
    {
      slug: 'minimalist-matte-ceramic-mug',
      categoryId: catMap.get('lifestyle-goods') || null,
      specificationsJson: [
        { key: 'Material', value: 'Handcrafted Scandinavian Matte Ceramic' },
        { key: 'Capacity', value: '350 ml (11.8 oz)' },
        { key: 'Care', value: 'Dishwasher & Microwave Safe' },
        { key: 'Finish', value: 'Satin Matte Soft-Touch' },
      ],
    },
    {
      slug: 'executive-ai-architecture-consultation',
      categoryId: catMap.get('consulting-strategy') || null,
      checkoutUrl: 'https://buy.stripe.com/test_consulting_session',
      specificationsJson: [
        { key: 'Session Duration', value: '60 Minutes 1-on-1 Video Conference' },
        { key: 'Lead Advisor', value: 'Senior Headless AI Systems Architect' },
        { key: 'Deliverables', value: 'Full Recording, Tech Audit & 90-Day Roadmap' },
        { key: 'Follow-up', value: '30 Days Asynchronous Q&A Support' },
      ],
    },
    {
      slug: 'full-grain-leather-desk-pad',
      categoryId: catMap.get('lifestyle-goods') || null,
      specificationsJson: [
        { key: 'Leather Type', value: '100% Full-Grain Vegetable-Tanned Leather' },
        { key: 'Backing', value: 'Non-Slip Waterproof Suede' },
        { key: 'Stitching', value: 'Reinforced Perimeter Edge Hand-Stitched' },
        { key: 'Warranty', value: '5 Years Manufacturer Guarantee' },
      ],
    },
    {
      slug: 'nextjs-15-enterprise-starter-kit',
      categoryId: catMap.get('dev-kits') || null,
      checkoutUrl: 'https://buy.stripe.com/test_starter_kit',
      specificationsJson: [
        { key: 'Framework', value: 'Next.js 15 (App Router + Server Actions)' },
        { key: 'Database & ORM', value: 'PostgreSQL + Drizzle ORM' },
        { key: 'Styling', value: 'Tailwind CSS & Radix UI / Shadcn' },
        { key: 'License', value: 'Unlimited Commercial & Client Projects' },
      ],
    },
  ];

  for (const item of updates) {
    await db
      .update(schema.products)
      .set({
        categoryId: item.categoryId,
        checkoutUrl: item.checkoutUrl || null,
        specificationsJson: item.specificationsJson,
      } as any)
      .where(eq(schema.products.slug, item.slug));
    console.log(`Enriched specifications for ${item.slug}`);
  }

  console.log('All product specifications and categories seeded successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

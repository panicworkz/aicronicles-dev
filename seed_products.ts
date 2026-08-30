import { db, schema } from './src/db';

async function seed() {
  console.log('Seeding 5 rich real-world demo products...');

  const demoProducts = [
    {
      title: 'AEO Masterclass & LLM Citation Playbook (2026 Edition)',
      slug: 'aeo-masterclass-llm-citation-playbook',
      description: 'The definitive blueprint for ranking in ChatGPT, Perplexity, and Google Gemini AI Overviews. Includes 45+ prompt templates, schema generators, and real-case studies.',
      price: '79.00',
      compareAtPrice: '149.00',
      sku: 'AEO-BOOK-01',
      inventory: 500,
      unlimitedStock: true,
      productType: 'digital',
      digitalAssetUrl: 'https://fabelo.testworkz.com/downloads/aeo-playbook-2026.pdf',
      featuredImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      status: 'published',
      variants: [
        { title: 'Standard E-Book (PDF + ePub)', sku: 'AEO-STD', price: '79.00', inventory: 999 },
        { title: 'Team License + Video Walkthroughs (5 Seats)', sku: 'AEO-TEAM', price: '199.00', inventory: 999 },
        { title: 'Enterprise Blueprint + 1-on-1 Strategy Session', sku: 'AEO-ENT', price: '499.00', inventory: 50 },
      ],
    },
    {
      title: 'Minimalist Matte Ceramic Mug (Fabelo Edition)',
      slug: 'minimalist-matte-ceramic-mug',
      description: 'Handcrafted Scandinavian matte black ceramic mug with ergonomic handle. 350ml capacity, microwave and dishwasher safe. Perfect companion for deep-work focus sessions.',
      price: '28.00',
      compareAtPrice: '38.00',
      sku: 'MUG-BLK-01',
      inventory: 85,
      unlimitedStock: false,
      productType: 'physical',
      featuredImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      status: 'published',
      variants: [
        { title: 'Matte Charcoal Black (350ml)', sku: 'MUG-BLK', price: '28.00', inventory: 40 },
        { title: 'Nordic Snow White (350ml)', sku: 'MUG-WHT', price: '28.00', inventory: 25 },
        { title: 'Earthy Sand Beige (350ml)', sku: 'MUG-SND', price: '28.00', inventory: 20 },
      ],
    },
    {
      title: 'Executive AI Architecture & Tech Stack Consultation (60 Min)',
      slug: 'executive-ai-architecture-consultation',
      description: '1-on-1 private video strategy session with Fabelo Lead Architects. Review your content pipeline, headless CMS stack, LLM prompt engineering, and cloud deployment optimizations.',
      price: '350.00',
      compareAtPrice: '500.00',
      sku: 'CONSULT-60',
      inventory: 15,
      unlimitedStock: false,
      productType: 'service',
      featuredImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
      status: 'published',
      variants: [
        { title: '1-Hour Advisory Video Session', sku: 'CONSULT-1H', price: '350.00', inventory: 10 },
        { title: 'Half-Day Technical Audit & Implementation Roadmap', sku: 'AUDIT-HD', price: '1200.00', inventory: 5 },
      ],
    },
    {
      title: 'Full-Grain Leather Work Mat & Desk Pad',
      slug: 'full-grain-leather-desk-pad',
      description: 'Premium vegetable-tanned leather desk mat with waterproof backing. Provides effortless mouse glide, wrist comfort, and timeless minimalist aesthetics.',
      price: '64.00',
      compareAtPrice: '85.00',
      sku: 'DESK-LTHR-01',
      inventory: 45,
      unlimitedStock: false,
      productType: 'physical',
      featuredImageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
      status: 'published',
      variants: [
        { title: 'Medium (70 x 35 cm) - Walnut Brown', sku: 'DESK-M-BRN', price: '64.00', inventory: 20 },
        { title: 'Large (90 x 45 cm) - Walnut Brown', sku: 'DESK-L-BRN', price: '79.00', inventory: 15 },
        { title: 'Large (90 x 45 cm) - Midnight Black', sku: 'DESK-L-BLK', price: '79.00', inventory: 10 },
      ],
    },
    {
      title: 'Next.js 15 & Headless CMS Enterprise Starter Kit',
      slug: 'nextjs-15-enterprise-starter-kit',
      description: 'Production-ready Next.js 15 repository with Tailwind CSS, Drizzle ORM, multi-tenant authentication, automated sitemaps, and TipTap rich visual blocks out of the box.',
      price: '129.00',
      compareAtPrice: '249.00',
      sku: 'STARTER-NEXT15',
      inventory: 999,
      unlimitedStock: true,
      productType: 'digital',
      digitalAssetUrl: 'https://github.com/fabelo/starter-kit-private',
      featuredImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      status: 'published',
      variants: [
        { title: 'Single Developer License', sku: 'KIT-DEV', price: '129.00', inventory: 999 },
        { title: 'Unlimited Team & Commercial Agency License', sku: 'KIT-AGENCY', price: '349.00', inventory: 999 },
      ],
    },
  ];

  for (const p of demoProducts) {
    const { variants, ...prodData } = p;
    const [inserted] = await db
      .insert(schema.products)
      .values(prodData as any)
      .onConflictDoUpdate({
        target: schema.products.slug,
        set: {
          title: prodData.title,
          description: prodData.description,
          price: prodData.price,
          compareAtPrice: prodData.compareAtPrice,
          productType: prodData.productType,
          featuredImageUrl: prodData.featuredImageUrl,
          digitalAssetUrl: prodData.digitalAssetUrl,
        } as any,
      })
      .returning();

    // Insert variants
    for (const v of variants) {
      await db.insert(schema.productVariants).values({
        productId: inserted.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        inventory: v.inventory,
      } as any);
    }
    console.log(`Seeded: ${inserted.title}`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

import { db, schema } from './src/db';

async function seed() {
  console.log('Seeding realistic demo orders with product types and tracking...');

  await db.delete(schema.orderItems);
  await db.delete(schema.orders);

  const sampleOrders: any[] = [
    {
      orderNumber: 'ORD-849201',
      customerName: 'Alexander Vance',
      customerEmail: 'alex.vance@mit.edu',
      total: '149.00',
      subtotal: '149.00',
      currency: 'USD',
      paymentStatus: 'paid',
      orderStatus: 'shipped',
      carrier: 'DHL Express',
      trackingNumber: 'DHL-948201948US',
      shippingAddressJson: {
        name: 'Alexander Vance',
        street: '77 Massachusetts Ave',
        city: 'Cambridge',
        state: 'MA',
        postalCode: '02139',
        country: 'United States',
      },
      items: [
        {
          title: 'Full-Grain Leather Desk Pad (Large 90x45cm / Walnut Brown)',
          productType: 'physical',
          quantity: 1,
          unitPrice: '149.00',
          totalPrice: '149.00',
        },
      ],
    },
    {
      orderNumber: 'ORD-912384',
      customerName: 'Zeynep Kaya',
      customerEmail: 'zeynep.kaya@trendyol.com',
      total: '38.00',
      subtotal: '38.00',
      currency: 'USD',
      paymentStatus: 'paid',
      orderStatus: 'processing',
      carrier: 'Yurtiçi Kargo',
      trackingNumber: 'YK-384920184TR',
      shippingAddressJson: {
        name: 'Zeynep Kaya',
        street: 'Büyükdere Cad. No: 199, Levent',
        city: 'Istanbul',
        state: 'Besiktas',
        postalCode: '34394',
        country: 'Turkey',
      },
      items: [
        {
          title: 'Minimalist Matte Ceramic Mug (Matte Obsidian Black 350ml)',
          productType: 'physical',
          quantity: 1,
          unitPrice: '38.00',
          totalPrice: '38.00',
        },
      ],
    },
    {
      orderNumber: 'ORD-305819',
      customerName: 'Marcus Lindholm',
      customerEmail: 'marcus@klarna.se',
      total: '89.00',
      subtotal: '89.00',
      currency: 'USD',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      shippingAddressJson: {},
      items: [
        {
          title: 'AEO Masterclass: LLM & AI Citation Playbook (Instant PDF + Schema Builder)',
          productType: 'digital',
          digitalAssetUrl: 'https://assets.fabelo.com/aeo-masterclass-2026.zip',
          quantity: 1,
          unitPrice: '89.00',
          totalPrice: '89.00',
        },
      ],
    },
    {
      orderNumber: 'ORD-720194',
      customerName: 'Sophie Dubois',
      customerEmail: 's.dubois@paristech.fr',
      total: '450.00',
      subtotal: '450.00',
      currency: 'USD',
      paymentStatus: 'paid',
      orderStatus: 'processing',
      shippingAddressJson: {},
      items: [
        {
          title: 'Executive AI Architecture Consultation (1-Hour Private Strategy Session)',
          productType: 'service',
          quantity: 1,
          unitPrice: '450.00',
          totalPrice: '450.00',
        },
      ],
    },
    {
      orderNumber: 'ORD-610482',
      customerName: 'David Chen',
      customerEmail: 'd.chen@singaporefintech.sg',
      total: '199.00',
      subtotal: '199.00',
      currency: 'USD',
      paymentStatus: 'pending',
      orderStatus: 'processing',
      shippingAddressJson: {},
      items: [
        {
          title: 'Next.js 15 Enterprise Starter Kit (Developer Commercial License)',
          productType: 'digital',
          digitalAssetUrl: 'https://assets.fabelo.com/nextjs15-starter-source.zip',
          quantity: 1,
          unitPrice: '199.00',
          totalPrice: '199.00',
        },
      ],
    },
  ];

  for (const o of sampleOrders) {
    const [insertedOrder] = await db
      .insert(schema.orders)
      .values({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        total: o.total,
        subtotal: o.subtotal,
        currency: o.currency,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        carrier: o.carrier || null,
        trackingNumber: o.trackingNumber || null,
        shippingAddressJson: o.shippingAddressJson,
      } as any)
      .returning();

    for (const item of o.items) {
      await db.insert(schema.orderItems).values({
        orderId: insertedOrder.id,
        productId: 1,
        title: item.title,
        productType: item.productType,
        digitalAssetUrl: item.digitalAssetUrl || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      } as any);
    }
    console.log(`Created order ${o.orderNumber}`);
  }

  console.log('Orders with product types seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

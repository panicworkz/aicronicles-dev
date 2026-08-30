import { db, schema } from './src/db';
import { eq } from 'drizzle-orm';

async function seedRepeatBuyers() {
  console.log('Seeding multiple orders for Repeat Buyers...');

  // 1. Add extra orders for Alexander Vance (alex.vance@mit.edu)
  const alexExtraOrders = [
    {
      orderNumber: 'ORD-849202',
      customerName: 'Alexander Vance',
      customerEmail: 'alex.vance@mit.edu',
      total: '38.00',
      subtotal: '38.00',
      currency: 'USD',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      carrier: 'FedEx',
      trackingNumber: 'FX-84920182US',
      shippingAddressJson: {
        name: 'Alexander Vance',
        street: '77 Massachusetts Ave',
        city: 'Cambridge',
        state: 'MA',
        postalCode: '02139',
        country: 'United States',
      },
      item: {
        title: 'Minimalist Matte Ceramic Mug (Matte Obsidian Black 350ml)',
        productType: 'physical',
        quantity: 1,
        unitPrice: '38.00',
        totalPrice: '38.00',
      },
    },
    {
      orderNumber: 'ORD-849203',
      customerName: 'Alexander Vance',
      customerEmail: 'alex.vance@mit.edu',
      total: '89.00',
      subtotal: '89.00',
      currency: 'USD',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      shippingAddressJson: {},
      item: {
        title: 'AEO Masterclass: LLM & AI Citation Playbook (Instant PDF + Schema Builder)',
        productType: 'digital',
        digitalAssetUrl: 'https://assets.fabelo.com/aeo-masterclass-2026.zip',
        quantity: 1,
        unitPrice: '89.00',
        totalPrice: '89.00',
      },
    },
  ];

  for (const o of alexExtraOrders) {
    const [inserted] = await db
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

    await db.insert(schema.orderItems).values({
      orderId: inserted.id,
      productId: 1,
      title: o.item.title,
      productType: o.item.productType,
      digitalAssetUrl: o.item.digitalAssetUrl || null,
      quantity: o.item.quantity,
      unitPrice: o.item.unitPrice,
      totalPrice: o.item.totalPrice,
    } as any);

    console.log(`Inserted extra order ${o.orderNumber} for Alexander Vance`);
  }

  // 2. Add extra order for Marcus Lindholm (marcus@klarna.se)
  const marcusExtraOrder = {
    orderNumber: 'ORD-305820',
    customerName: 'Marcus Lindholm',
    customerEmail: 'marcus@klarna.se',
    total: '199.00',
    subtotal: '199.00',
    currency: 'USD',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    shippingAddressJson: {},
    item: {
      title: 'Next.js 15 Enterprise Starter Kit (Developer License)',
      productType: 'digital',
      digitalAssetUrl: 'https://assets.fabelo.com/nextjs15-starter-source.zip',
      quantity: 1,
      unitPrice: '199.00',
      totalPrice: '199.00',
    },
  };

  const [insertedMarcus] = await db
    .insert(schema.orders)
    .values({
      orderNumber: marcusExtraOrder.orderNumber,
      customerName: marcusExtraOrder.customerName,
      customerEmail: marcusExtraOrder.customerEmail,
      total: marcusExtraOrder.total,
      subtotal: marcusExtraOrder.subtotal,
      currency: marcusExtraOrder.currency,
      paymentStatus: marcusExtraOrder.paymentStatus,
      orderStatus: marcusExtraOrder.orderStatus,
      shippingAddressJson: marcusExtraOrder.shippingAddressJson,
    } as any)
    .returning();

  await db.insert(schema.orderItems).values({
    orderId: insertedMarcus.id,
    productId: 1,
    title: marcusExtraOrder.item.title,
    productType: marcusExtraOrder.item.productType,
    digitalAssetUrl: marcusExtraOrder.item.digitalAssetUrl || null,
    quantity: marcusExtraOrder.item.quantity,
    unitPrice: marcusExtraOrder.item.unitPrice,
    totalPrice: marcusExtraOrder.item.totalPrice,
  } as any);

  console.log(`Inserted extra order ${marcusExtraOrder.orderNumber} for Marcus Lindholm`);

  // 3. Update customers table totals & order counts
  await db
    .update(schema.customers)
    .set({
      orderCount: 3,
      totalSpent: '276.00',
    } as any)
    .where(eq(schema.customers.email, 'alex.vance@mit.edu'));

  await db
    .update(schema.customers)
    .set({
      orderCount: 2,
      totalSpent: '288.00',
    } as any)
    .where(eq(schema.customers.email, 'marcus@klarna.se'));

  console.log('Repeat buyers successfully seeded and updated!');
  process.exit(0);
}

seedRepeatBuyers().catch((err) => {
  console.error('Seed repeat error:', err);
  process.exit(1);
});

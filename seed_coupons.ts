import { db, schema } from './src/db';

async function seedCoupons() {
  console.log('Seeding realistic promotional coupon codes...');

  await db.delete(schema.coupons);

  const sampleCoupons = [
    {
      code: 'FABELO20',
      type: 'percentage',
      value: '20.00',
      minOrderAmount: '0.00',
      usageLimit: 500,
      timesUsed: 42,
      active: true,
    },
    {
      code: 'LAUNCH50',
      type: 'fixed',
      value: '50.00',
      minOrderAmount: '100.00',
      usageLimit: 100,
      timesUsed: 18,
      active: true,
    },
    {
      code: 'VIPEXECUTIVE',
      type: 'percentage',
      value: '30.00',
      minOrderAmount: '200.00',
      usageLimit: 50,
      timesUsed: 7,
      active: true,
    },
    {
      code: 'EXPIRED2025',
      type: 'percentage',
      value: '15.00',
      minOrderAmount: '0.00',
      usageLimit: 50,
      timesUsed: 50,
      active: false,
    },
  ];

  for (const c of sampleCoupons) {
    await db.insert(schema.coupons).values(c as any);
    console.log(`Created coupon code: ${c.code} (${c.type === 'percentage' ? `${c.value}%` : `$${c.value}`})`);
  }

  console.log('Coupons seeding complete!');
  process.exit(0);
}

seedCoupons().catch((err) => {
  console.error('Seed coupon error:', err);
  process.exit(1);
});

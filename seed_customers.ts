import { db, schema } from './src/db';

async function seed() {
  console.log('Seeding customer accounts with realistic LTV and order histories...');

  await db.delete(schema.customers);

  const sampleCustomers: any[] = [
    {
      name: 'Sophie Dubois',
      email: 's.dubois@paristech.fr',
      phone: '+33 1 44 27 65 00',
      totalSpent: '450.00',
      orderCount: 1,
      shippingAddressJson: {
        name: 'Sophie Dubois',
        street: '4 Place Jussieu',
        city: 'Paris',
        state: 'Ile-de-France',
        postalCode: '75005',
        country: 'France',
      },
    },
    {
      name: 'Alexander Vance',
      email: 'alex.vance@mit.edu',
      phone: '+1 (617) 253-1000',
      totalSpent: '149.00',
      orderCount: 1,
      shippingAddressJson: {
        name: 'Alexander Vance',
        street: '77 Massachusetts Ave',
        city: 'Cambridge',
        state: 'MA',
        postalCode: '02139',
        country: 'United States',
      },
    },
    {
      name: 'David Chen',
      email: 'd.chen@singaporefintech.sg',
      phone: '+65 6790 6900',
      totalSpent: '199.00',
      orderCount: 1,
      shippingAddressJson: {
        name: 'David Chen',
        street: '10 Marina Boulevard, Tower 2',
        city: 'Singapore',
        state: '',
        postalCode: '018983',
        country: 'Singapore',
      },
    },
    {
      name: 'Marcus Lindholm',
      email: 'marcus@klarna.se',
      phone: '+46 8 120 120 00',
      totalSpent: '89.00',
      orderCount: 1,
      shippingAddressJson: {
        name: 'Marcus Lindholm',
        street: 'Sveavägen 46',
        city: 'Stockholm',
        state: '',
        postalCode: '111 34',
        country: 'Sweden',
      },
    },
    {
      name: 'Zeynep Kaya',
      email: 'zeynep.kaya@trendyol.com',
      phone: '+90 212 331 0200',
      totalSpent: '38.00',
      orderCount: 1,
      shippingAddressJson: {
        name: 'Zeynep Kaya',
        street: 'Büyükdere Cad. No: 199, Levent',
        city: 'Istanbul',
        state: 'Besiktas',
        postalCode: '34394',
        country: 'Turkey',
      },
    },
  ];

  for (const c of sampleCustomers) {
    await db.insert(schema.customers).values({
      name: c.name,
      email: c.email,
      phone: c.phone,
      totalSpent: c.totalSpent,
      orderCount: c.orderCount,
      shippingAddressJson: c.shippingAddressJson,
    } as any);
    console.log(`Created customer account for ${c.name}`);
  }

  console.log('Customer seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

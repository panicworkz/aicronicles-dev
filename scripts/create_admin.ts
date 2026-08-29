import { getPayload } from 'payload';
import config from '../src/payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: 'support@fabelo.io' } },
  });

  if (existing.docs.length > 0) {
    console.log('User already exists');
  } else {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'support@fabelo.io',
        password: 'Password123!',
        name: 'fabelo',
        role: 'admin',
      },
    });
    console.log('✓ Admin user created successfully:', user.email);
  }
}
main().catch(err => console.error('Error:', err));

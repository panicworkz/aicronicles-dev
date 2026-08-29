import { getPayload } from 'payload';
import config from '../src/payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: 'support@fabelo.io' } },
  });

  if (existing.docs.length > 0) {
    const user = existing.docs[0];
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password: '123Pan_?',
      },
    });
    console.log('✓ Password updated successfully for:', user.email);
  } else {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'support@fabelo.io',
        password: '123Pan_?',
        name: 'fabelo',
        role: 'admin',
      },
    });
    console.log('✓ User created with new password:', user.email);
  }
}
main().catch(err => console.error('Error:', err));

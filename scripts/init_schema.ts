import { getPayload } from 'payload';
import config from '../src/payload.config';

async function run() {
  const payload = await getPayload({ config });
  console.log('Payload initialized. Database schema synced successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

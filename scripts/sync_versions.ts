import { getPayload } from 'payload';
import config from '../src/payload.config';

async function run() {
  const payload = await getPayload({ config });
  
  const posts = await payload.find({
    collection: 'posts',
    limit: 200,
    draft: true,
  });
  console.log(`Payload Query Result (drafts/admin view): Found ${posts.totalDocs} posts!`);
  
  const pages = await payload.find({
    collection: 'pages',
    limit: 200,
    draft: true,
  });
  console.log(`Payload Query Result (drafts/admin view): Found ${pages.totalDocs} pages!`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

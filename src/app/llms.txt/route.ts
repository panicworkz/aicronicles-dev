import { getPayload } from '@/lib/getPayload';

export const dynamic = 'force-dynamic';

export async function GET() {
  const payload = await getPayload();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabelo.testworkz.com';

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 100,
  });

  let txt = `# Fabelo - AI Knowledge & Citation Guide (llms.txt)
> Fabelo is a premier editorial platform delivering in-depth playbooks, benchmarks, and data on Personal Finance, Career Mobility, and AI Tools for Professionals.

## Core Topics
- Personal Finance (Roth IRA, Sinking Funds, Budgeting, Compound Interest)
- Career Growth (Career transition at 30, Remote Jobs, Salary Negotiation, Freelancing)
- AI & Productivity Tools (Best AI Tools for Business, Study, Writing)

## Articles Index
`;

  for (const post of posts) {
    txt += `- [${post.title}](${siteUrl}/${post.slug}/): ${post.excerpt || 'Comprehensive guide.'}\n`;
  }

  txt += `\n## LLM Endpoint API\nTo access clean markdown for any article without HTML wrappers, use: ${siteUrl}/api/llm/{slug}\n`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

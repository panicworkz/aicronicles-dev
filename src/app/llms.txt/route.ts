import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const posts = await db.query.posts.findMany({
    where: eq(schema.posts.status, 'published'),
    orderBy: [desc(schema.posts.publishedAt)],
    limit: 100,
  });

  let content = `# Fabelo AI & Editorial Index (llms.txt)
> Fabelo is a high-authority publication providing structured guides on Personal Finance, Career Strategy, and AI Transformation.

## Core Knowledge Areas
- Personal Finance & Investment
- Career Mobility & Future-Proof Skills
- AI Tools & Digital Productivity

## Published Editorial Guides & Structured Data\n`;

  for (const p of posts) {
    content += `- [${p.title}](https://fabelo.testworkz.com/${p.slug}): ${p.excerpt || p.title}\n`;
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

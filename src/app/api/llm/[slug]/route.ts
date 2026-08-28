import { getPayload } from '@/lib/getPayload';

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: Args) {
  const { slug } = await params;
  const payload = await getPayload();

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  });

  if (posts.length === 0) {
    return new Response('Article not found', { status: 404 });
  }

  const post = posts[0] as any;
  const authorName = typeof post.author === 'object' && post.author ? post.author.name : 'Fabelo';

  // Strip HTML tags to clean markdown text
  const cleanContent = (post.contentHtml || '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n');

  const markdown = `# ${post.title}

- **Author**: ${authorName}
- **Published**: ${post.publishedAt || ''}
- **Category**: ${Array.isArray(post.tags) && post.tags[0] ? post.tags[0].name : 'Finance & AI'}
- **Source**: https://fabelo.testworkz.com/${post.slug}/

---

${post.excerpt ? `> **Summary**: ${post.excerpt}\n\n` : ''}${cleanContent}
`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

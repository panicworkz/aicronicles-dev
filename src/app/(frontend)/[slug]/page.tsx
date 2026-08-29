import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@/payload.config';
import Link from 'next/link';
import { LiveArticleView } from '@/components/LiveArticleView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  // 1. Try to find post
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });

  const post = posts[0];

  // 2. If not post, check static pages
  if (!post) {
    const { docs: pages } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    });
    const page = pages[0];
    if (!page) notFound();

    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white font-serif">
              FABELO<span className="text-amber-500">.</span>
            </Link>
          </div>
        </header>
        <article className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-8 font-serif">{page.title}</h1>
          <div 
            className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-a:text-amber-500 hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }}
          />
        </article>
      </div>
    );
  }

  return <LiveArticleView post={post} />;
}

import { getPayload } from '@/lib/getPayload';
import ArticleCard from '@/components/ArticleCard';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayload();

  const { docs: tags } = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (tags.length > 0) {
    const tag = tags[0];
    return {
      title: `${tag.name} Articles & Guides`,
      description: tag.description || `Read the latest articles in ${tag.name} on Fabelo.`,
    };
  }

  return { title: 'Tag Not Found' };
}

export default async function TagArchivePage({ params }: Args) {
  const { slug } = await params;
  const payload = await getPayload();

  const { docs: tags } = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (tags.length === 0) {
    notFound();
  }

  const tag = tags[0];

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      tags: {
        contains: tag.id,
      },
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    depth: 2,
    limit: 50,
  });

  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Category Archive
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">
          {tag.name}
        </h1>
        {tag.description && (
          <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
            {tag.description}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <ArticleCard key={post.id} post={post as any} />
        ))}
      </div>
    </div>
  );
}

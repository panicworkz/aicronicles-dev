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

  const { docs: authors } = await payload.find({
    collection: 'authors',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (authors.length > 0) {
    const author = authors[0];
    return {
      title: `${author.name} - Author Profile`,
      description: author.bio || `Articles by ${author.name} on Fabelo.`,
    };
  }

  return { title: 'Author Not Found' };
}

export default async function AuthorArchivePage({ params }: Args) {
  const { slug } = await params;
  const payload = await getPayload();

  const { docs: authors } = await payload.find({
    collection: 'authors',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (authors.length === 0) {
    notFound();
  }

  const author = authors[0];

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      author: {
        equals: author.id,
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
    <div className="space-y-10">
      <header className="bg-zinc-50 dark:bg-zinc-900/60 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="w-20 h-20 rounded-full bg-emerald-600 text-white font-black text-3xl flex items-center justify-center flex-shrink-0">
          {author.name.charAt(0)}
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              {author.name}
            </h1>
            <span className="text-xs text-zinc-500 font-medium">({author.role})</span>
          </div>
          {author.bio && (
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
              {author.bio}
            </p>
          )}
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">
          Articles by {author.name} ({posts.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post as any} />
          ))}
        </div>
      </section>
    </div>
  );
}

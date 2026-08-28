import { getPayload } from '@/lib/getPayload';
import ArticleCard from '@/components/ArticleCard';
import NewsletterForm from '@/components/NewsletterForm';

export const revalidate = 60; // 60s ISR

export default async function HomePage() {
  const payload = await getPayload();

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    limit: 30,
    depth: 2,
  });

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const recentPosts = posts.length > 1 ? posts.slice(1) : [];

  return (
    <div className="space-y-12">
      {/* Hero Intro */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 pb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Fabelo Editorial
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base max-w-2xl">
          Deep-dive guides, benchmarks, and actionable playbooks on personal finance, AI tools, and high-growth careers.
        </p>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section>
          <ArticleCard post={featuredPost as any} featured={true} />
        </section>
      )}

      {/* Latest Articles Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Latest Stories & Guides
          </h2>
          <span className="text-xs text-zinc-500 font-medium">
            Showing {recentPosts.length} articles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.map((post) => (
            <ArticleCard key={post.id} post={post as any} />
          ))}
        </div>
      </section>

      {/* Newsletter Box */}
      <section id="newsletter" className="bg-emerald-900 text-white rounded-2xl p-8 sm:p-12 text-center space-y-4">
        <h3 className="text-2xl sm:text-3xl font-extrabold">
          Stay Ahead of the Curve
        </h3>
        <p className="text-emerald-100 max-w-lg mx-auto text-sm sm:text-base">
          Join ambitious professionals receiving weekly curated insights on career mobility, smart finance, and cutting-edge AI tools.
        </p>
        <NewsletterForm />
      </section>
    </div>
  );
}

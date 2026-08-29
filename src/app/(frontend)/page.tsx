import Link from 'next/link';
import { getPayload } from 'payload';
import config from '@/payload.config';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const payload = await getPayload({ config });
  
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' },
    },
    sort: '-publishedAt',
    limit: 30,
    depth: 2,
  });

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-black">
      {/* Header / Nav */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-tight text-white font-serif">
              FABELO<span className="text-amber-500">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-400">
            <Link href="/tag/personal-finance" className="hover:text-white transition">Finance</Link>
            <Link href="/tag/career" className="hover:text-white transition">Career</Link>
            <Link href="/tag/ai-tech" className="hover:text-white transition">AI & Tools</Link>
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/admin" className="text-amber-500 hover:text-amber-400 transition font-semibold">Admin</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category Pills */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <Link href="/" className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500 text-black">
            All Editorial
          </Link>
          <Link href="/tag/personal-finance" className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500 transition">
            Personal Finance
          </Link>
          <Link href="/tag/career" className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500 transition">
            Career Mobility
          </Link>
          <Link href="/tag/ai-tech" className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500 transition">
            AI & Productivity
          </Link>
        </div>

        {/* Featured Hero Post */}
        {featuredPost && (
          <div className="mb-14">
            <Link href={`/${featuredPost.slug}`} className="group block relative rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-900/50 hover:border-amber-500/50 transition duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center space-x-3 text-xs font-mono text-amber-500">
                    <span className="bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">Featured Guide</span>
                    <span>•</span>
                    <span>{featuredPost.readingTime || 5} min read</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white group-hover:text-amber-400 transition font-serif leading-tight">
                    {featuredPost.title}
                  </h1>
                  <p className="text-neutral-400 line-clamp-3 text-base sm:text-lg leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>
                <div className="lg:col-span-5 aspect-[16/10] rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700/50">
                  <img
                    src={typeof featuredPost.featuredImage === 'object' && featuredPost.featuredImage ? featuredPost.featuredImage.url : '/media/default.webp'}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Latest Publications Grid */}
        <div className="border-t border-neutral-800/60 pt-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white font-serif">Latest Editorial Guides</h2>
            <span className="text-xs text-neutral-500 font-mono uppercase tracking-widest">
              {posts.length} Publications
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => {
              const imgUrl = typeof post.featuredImage === 'object' && post.featuredImage ? post.featuredImage.url : '/media/default.webp';
              return (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="group flex flex-col rounded-xl overflow-hidden border border-neutral-800/80 bg-neutral-900/30 hover:border-amber-500/50 hover:bg-neutral-900/60 transition duration-300"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-800 border-b border-neutral-800">
                    <img
                      src={imgUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-mono text-neutral-500">
                        <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                        <span>•</span>
                        <span>{post.readingTime || 4} min</span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition font-serif line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-neutral-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-500 group-hover:translate-x-1 transition duration-200 inline-flex items-center">
                      Read Deep Dive →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-12 mt-20 text-neutral-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p>© {new Date().getFullYear()} Fabelo. All rights reserved.</p>
          <div className="flex space-x-6 text-xs">
            <Link href="/sitemap.xml" className="hover:text-neutral-300">Sitemap</Link>
            <Link href="/sitemap-news.xml" className="hover:text-neutral-300">News Sitemap</Link>
            <Link href="/llms.txt" className="hover:text-neutral-300">llms.txt (AI)</Link>
            <Link href="/terms-and-conditions" className="hover:text-neutral-300">Terms</Link>
            <Link href="/data-and-privacy" className="hover:text-neutral-300">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

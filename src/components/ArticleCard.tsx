import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  post: {
    title: string;
    slug: string;
    excerpt?: string;
    featuredImage?: any;
    author?: any;
    tags?: any[];
    publishedAt?: string;
    readingTime?: string;
  };
  featured?: boolean;
}

export default function ArticleCard({ post, featured = false }: ArticleCardProps) {
  const authorName = typeof post.author === 'object' && post.author ? post.author.name : 'Fabelo';
  const tagObj = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags[0] : null;
  const tagName = typeof tagObj === 'object' && tagObj ? tagObj.name : 'Guide';
  const tagSlug = typeof tagObj === 'object' && tagObj ? tagObj.slug : 'general';

  const imageUrl = typeof post.featuredImage === 'object' && post.featuredImage?.filename
    ? `/media/${post.featuredImage.filename}`
    : typeof post.featuredImage === 'string'
    ? post.featuredImage
    : null;

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  if (featured) {
    return (
      <article className="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-50 dark:bg-zinc-900/60 p-6 md:p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 transition">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/tag/${tagSlug}`}
              className="text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded"
            >
              {tagName}
            </Link>
            <span className="text-xs text-zinc-400">{dateStr}</span>
            {post.readingTime && <span className="text-xs text-zinc-400">· {post.readingTime}</span>}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
            <Link href={`/${post.slug}`}>{post.title}</Link>
          </h2>

          {post.excerpt && (
            <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="pt-2 flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>By <strong className="font-semibold">{authorName}</strong></span>
          </div>
        </div>

        <div className="lg:col-span-5 relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-400">
              No Image
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col bg-white dark:bg-zinc-900/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-400">
            No Image
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href={`/tag/${tagSlug}`}
              className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {tagName}
            </Link>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-400">{dateStr}</span>
          </div>

          <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
            <Link href={`/${post.slug}`}>{post.title}</Link>
          </h3>

          {post.excerpt && (
            <p className="text-zinc-600 dark:text-zinc-300 text-sm line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        <div className="pt-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80">
          By {authorName}
        </div>
      </div>
    </article>
  );
}

import { getPayload } from '@/lib/getPayload';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayload();

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (posts.length > 0) {
    const post = posts[0];
    const metaTitle = (post.meta as any)?.title || post.title;
    const metaDesc = (post.meta as any)?.description || post.excerpt;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabelo.testworkz.com';
    const canonical = (post.meta as any)?.canonical || `${siteUrl}/${post.slug}/`;

    return {
      title: metaTitle,
      description: metaDesc,
      alternates: {
        canonical,
      },
      openGraph: {
        title: metaTitle,
        description: metaDesc,
        type: 'article',
        publishedTime: post.publishedAt || undefined,
        url: `${siteUrl}/${post.slug}/`,
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDesc,
      },
    };
  }

  const { docs: pages } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (pages.length > 0) {
    const page = pages[0];
    return {
      title: (page.meta as any)?.title || page.title,
      description: (page.meta as any)?.description || page.title,
    };
  }

  return {
    title: 'Not Found',
  };
}

export default async function DynamicSlugPage({ params }: Args) {
  const { slug } = await params;
  const payload = await getPayload();

  // Try finding post
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });

  if (posts.length > 0) {
    const post = posts[0] as any;
    const authorName = typeof post.author === 'object' && post.author ? post.author.name : 'Fabelo';
    const authorRole = typeof post.author === 'object' && post.author?.role ? post.author.role : 'Editorial Team';
    const authorSlug = typeof post.author === 'object' && post.author?.slug ? post.author.slug : 'fabelo';
    const authorBio = typeof post.author === 'object' && post.author?.bio ? post.author.bio : 'Writes on career strategies, AI tools, and personal wealth.';
    const tagObj = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags[0] : null;
    const tagName = typeof tagObj === 'object' && tagObj ? tagObj.name : null;
    const tagSlug = typeof tagObj === 'object' && tagObj ? tagObj.slug : null;

    const imageUrl = typeof post.featuredImage === 'object' && post.featuredImage?.filename
      ? `/media/${post.featuredImage.filename}`
      : null;

    const dateStr = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fabelo.testworkz.com';

    // JSON-LD Structured Data Schema for NewsArticle / TechArticle
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: post.title,
      description: post.excerpt || post.title,
      image: imageUrl ? [`${siteUrl}${imageUrl}`] : [],
      datePublished: post.publishedAt || new Date().toISOString(),
      dateModified: post.updatedAt || post.publishedAt || new Date().toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${siteUrl}/${post.slug}/`,
      },
      author: {
        '@type': 'Person',
        name: authorName,
        url: `${siteUrl}/author/${authorSlug}`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Fabelo',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.png`,
        },
      },
    };

    return (
      <article className="max-w-4xl mx-auto space-y-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header section */}
        <header className="space-y-4 text-center sm:text-left">
          {tagName && tagSlug && (
            <div>
              <Link
                href={`/tag/${tagSlug}`}
                className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded"
              >
                {tagName}
              </Link>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-zinc-500 dark:text-zinc-400 border-y border-zinc-200 dark:border-zinc-800 py-3">
            <Link href={`/author/${authorSlug}`} className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">
              {authorName}
            </Link>
            <span>·</span>
            <time dateTime={post.publishedAt}>{dateStr}</time>
            {post.readingTime && (
              <>
                <span>·</span>
                <span>{post.readingTime}</span>
              </>
            )}
            <span className="ml-auto text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
              <a href={`/api/llm/${post.slug}`} target="_blank" rel="noopener">
                AI / Raw Markdown
              </a>
            </span>
          </div>
        </header>

        {/* Featured Image */}
        {imageUrl && (
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
            <img
              src={imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Article Body */}
        <div
          className="prose dark:prose-invert mx-auto pt-4"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
        />

        {/* Author Bio Box */}
        <section className="mt-16 p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center flex-shrink-0">
            {authorName.charAt(0)}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <Link href={`/author/${authorSlug}`} className="font-bold text-lg text-zinc-900 dark:text-white hover:underline">
                {authorName}
              </Link>
              <span className="text-xs text-zinc-500 font-medium">({authorRole})</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {authorBio}
            </p>
          </div>
        </section>
      </article>
    );
  }

  // Try finding static page (about, advertise, etc.)
  const { docs: pages } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (pages.length > 0) {
    const page = pages[0];
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {page.title}
        </h1>
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }}
        />
      </div>
    );
  }

  notFound();
}

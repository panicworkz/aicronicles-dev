'use client';
import { useLivePreview } from '@/hooks/useLivePreview';
import Link from 'next/link';

export function LiveArticleView({ post: initialPost }: { post: any }) {
  const { data: post } = useLivePreview({ initialData: initialPost });

  const authorName = typeof post.author === 'object' && post.author ? post.author.name : 'Fabelo Editorial';
  const tagList = Array.isArray(post.tags) ? post.tags.map((t: any) => typeof t === 'object' ? t.name : t) : [];
  const imageUrl = typeof post.featuredImage === 'object' && post.featuredImage ? post.featuredImage.url : (post.featuredImage || '/media/default.webp');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white font-serif">
            FABELO<span className="text-amber-500">.</span>
          </Link>
          <div className="flex items-center space-x-4 text-xs font-mono text-neutral-400">
            <Link href="/llms.txt" className="text-amber-500 hover:underline">AEO / llms.txt</Link>
            <Link href={`/api/llm/${post.slug}`} className="hover:text-white">AI Raw View</Link>
          </div>
        </div>
      </header>

      {/* Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tagList.map((tag: string) => (
              <span key={tag} className="text-xs font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-6 font-serif">
          {post.title}
        </h1>

        <div className="flex items-center space-x-4 border-y border-neutral-800 py-4 mb-8 text-xs text-neutral-400 font-mono">
          <span className="text-neutral-200 font-sans font-medium">{authorName}</span>
          <span>•</span>
          <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Editorial'}</span>
          {post.readingTime && (
            <>
              <span>•</span>
              <span>{post.readingTime}</span>
            </>
          )}
        </div>

        {imageUrl && (
          <div className="mb-10 rounded-xl overflow-hidden border border-neutral-800 aspect-video bg-neutral-900">
            <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content Body */}
        <div 
          className="prose prose-invert prose-lg max-w-none font-sans leading-relaxed
            prose-headings:font-serif prose-headings:text-white prose-headings:tracking-tight
            prose-a:text-amber-500 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:border prose-img:border-neutral-800
            prose-blockquote:border-l-amber-500 prose-blockquote:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-12 mt-20 text-neutral-500 text-sm">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <p>© {new Date().getFullYear()} Fabelo Editorial.</p>
          <Link href="/" className="text-xs text-amber-500 hover:underline">Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}

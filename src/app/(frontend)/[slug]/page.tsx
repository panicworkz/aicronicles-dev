import React from 'react';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArticleLiveWrapper } from './ArticleLiveWrapper';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.slug, slug),
  });

  if (!post) {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) });
    if (!page) return { title: 'Not Found - Fabelo' };
    return { title: `${page.title} - Fabelo` };
  }

  return {
    title: `${post.metaTitle || post.title}`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Try to find Post
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.slug, slug),
  });

  if (post) {
    let author = null;
    if (post.authorId) {
      author = await db.query.authors.findFirst({
        where: eq(schema.authors.id, post.authorId),
      });
    }

    let category = null;
    if (post.categoryId) {
      category = await db.query.categories.findFirst({
        where: eq(schema.categories.id, post.categoryId),
      });
    }

    return (
      <div className="gh-site min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Ghost 1:1 Navigation Header */}
        <header id="gh-navigation" className="gh-navigation is-stacked gh-outer">
          <div className="gh-navigation-inner gh-inner">
            <div className="gh-navigation-brand">
              <Link className="gh-navigation-logo is-title" href="/">
                <img
                  src="https://fabelo.io/content/images/2026/04/fabelo-logo-256.webp"
                  alt="Fabelo"
                  className="h-8 w-auto object-contain"
                />
              </Link>
            </div>

            <nav className="gh-navigation-menu">
              <ul className="nav">
                <li className="nav-personal-finance">
                  <Link href="/tag/personal-finance">Personal Finance</Link>
                </li>
                <li className="nav-career">
                  <Link href="/tag/career">Career</Link>
                </li>
                <li className="nav-ai-tech">
                  <Link href="/tag/ai-tech">AI &amp; Tech</Link>
                </li>
                <li className="nav-about">
                  <Link href="/about">About</Link>
                </li>
              </ul>
            </nav>

            <div className="gh-navigation-actions">
              <div className="gh-navigation-members flex items-center gap-3">
                <Link href={`/api/llm/${post.slug}`} className="text-xs font-mono text-muted-foreground hover:text-foreground hidden sm:inline">
                  AI Raw
                </Link>
                <Link href={`/panic/posts/${post.id}`} className="gh-button gh-button-secondary text-xs">
                  CMS Edit
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Ghost Page Main Container */}
        <div className="gh-page">
          <ArticleLiveWrapper
            initialTitle={post.title}
            initialContentHtml={post.contentHtml || ''}
            initialCoverUrl={post.featuredImageUrl}
            excerpt={post.excerpt}
            readingTime={post.readingTime}
            publishedAt={post.publishedAt ? post.publishedAt.toISOString() : null}
            author={author}
            category={category}
          />
        </div>

        {/* Ghost 1:1 Footer */}
        <footer className="gh-footer gh-outer">
          <div className="gh-footer-inner gh-inner">
            <div className="gh-footer-bar">
              <span className="gh-footer-logo is-title">
                <img
                  src="https://fabelo.io/content/images/2026/04/fabelo-logo-256.webp"
                  alt="Fabelo"
                  className="h-7 w-auto object-contain"
                />
              </span>
              <nav className="gh-footer-menu">
                <ul className="nav">
                  <li className="nav-advertise">
                    <Link href="/advertise">Advertise</Link>
                  </li>
                  <li className="nav-sponsor">
                    <Link href="/sponsor">Sponsor</Link>
                  </li>
                  <li className="nav-terms-conditions">
                    <Link href="/terms-and-conditions">Terms &amp; conditions</Link>
                  </li>
                  <li className="nav-data-privacy">
                    <Link href="/data-and-privacy">Data &amp; privacy</Link>
                  </li>
                </ul>
              </nav>
              <div className="gh-footer-copyright">
                Powered by <Link href="/panic" className="font-semibold text-primary hover:underline">Panic CMS</Link>
              </div>
            </div>

            <section className="gh-footer-signup">
              <h2 className="gh-footer-signup-header is-title">
                Fabelo
              </h2>
              <p className="gh-footer-signup-subhead is-body">
                Personal finance tips, career strategies, and AI tool reviews for ambitious professionals.
              </p>
              <form className="gh-form">
                <input
                  className="gh-form-input"
                  id="footer-email"
                  name="email"
                  type="email"
                  placeholder="jamie@example.com"
                  required
                />
                <button className="gh-button" type="button">
                  <span>Subscribe</span>
                </button>
              </form>
            </section>
          </div>
        </footer>
      </div>
    );
  }

  // 2. Try to find Static Page
  const page = await db.query.pages.findFirst({
    where: eq(schema.pages.slug, slug),
  });

  if (!page) notFound();

  return (
    <div className="gh-site min-h-screen bg-background text-foreground">
      <header id="gh-navigation" className="gh-navigation is-stacked gh-outer">
        <div className="gh-navigation-inner gh-inner">
          <div className="gh-navigation-brand">
            <Link className="gh-navigation-logo is-title" href="/">
              <img
                src="https://fabelo.io/content/images/2026/04/fabelo-logo-256.webp"
                alt="Fabelo"
                className="h-8 w-auto"
              />
            </Link>
          </div>
        </div>
      </header>
      <div className="gh-page">
        <article className="gh-article gh-canvas py-16">
          <h1 className="gh-article-title is-title mb-8">{page.title}</h1>
          <div
            className="gh-content is-body"
            dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }}
          />
        </article>
      </div>
    </div>
  );
}

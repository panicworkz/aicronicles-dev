"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, Clock, ArrowRight, Filter } from "lucide-react";
import { PostCard, CardPost } from "@/components/magazine/PostCard";

interface SearchClientProps {
  initialQuery: string;
  initialCategory: string;
  posts: any[];
  categories: any[];
  authors: any[];
}

export default function SearchClient({
  initialQuery,
  initialCategory,
  posts,
  categories,
  authors,
}: SearchClientProps) {
  const [q, setQ] = useState(initialQuery);
  const [selectedCat, setSelectedCat] = useState(initialCategory || "all");

  const authorMap = useMemo(() => {
    const map: Record<number, any> = {};
    authors.forEach((a) => {
      if (a?.id) map[a.id] = a;
    });
    return map;
  }, [authors]);

  const categoryMap = useMemo(() => {
    const map: Record<number, any> = {};
    categories.forEach((c) => {
      if (c?.id) map[c.id] = c;
    });
    return map;
  }, [categories]);

  const filteredPosts = useMemo(() => {
    const query = q.trim().toLowerCase();
    return posts.filter((p) => {
      const matchCat =
        selectedCat === "all" ||
        (p.categoryId && categoryMap[p.categoryId]?.slug === selectedCat) ||
        JSON.stringify(p.tagsJson || "").toLowerCase().includes(selectedCat.toLowerCase());

      if (!matchCat) return false;
      if (!query) return true;

      const inTitle = p.title?.toLowerCase().includes(query);
      const inExcerpt = p.excerpt?.toLowerCase().includes(query);
      const inSlug = p.slug?.toLowerCase().includes(query);

      return inTitle || inExcerpt || inSlug;
    });
  }, [posts, q, selectedCat, categoryMap]);

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[var(--bg-2)] border border-[var(--line)] space-y-6">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--accent)]">
            Explore All Content
          </span>
          <h1 className="f-manifesto text-[clamp(2.2rem,4vw,3.6rem)]">
            Search The Journal
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            Search across all our guides, career playbooks, and AI workflows.
          </p>
        </div>

        {/* Input Bar */}
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[var(--muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type search terms (e.g. credit score, remote work, ChatGPT, budgeting)…"
            className="w-full h-14 pl-12 pr-12 rounded-2xl bg-[var(--bg)] border border-[var(--line)] text-sm sm:text-base text-[var(--fg)] outline-none focus:border-[var(--accent)] shadow-xs transition"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 size-6 rounded-full bg-[var(--bg-2)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              selectedCat === "all"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--card)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--fg)]"
            }`}
          >
            All Topics ({posts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setSelectedCat(c.slug)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                selectedCat === c.slug
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--card)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--fg)]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
        <h2 className="text-lg font-bold tracking-tight text-[var(--heading)]">
          {q ? `Search Results for "${q}"` : "Browse Articles"}
        </h2>
        <span className="text-xs font-mono text-[var(--muted)]">
          {filteredPosts.length} Results
        </span>
      </div>

      {/* Results Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={post.authorId ? authorMap[post.authorId] : null}
              category={post.categoryId ? categoryMap[post.categoryId] : null}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-3 rounded-2xl bg-[var(--bg-2)] border border-[var(--line)]">
          <p className="text-base font-bold text-[var(--heading)]">
            No articles found matching &quot;{q}&quot;
          </p>
          <p className="text-xs text-[var(--muted)]">
            Try adjusting your search query or selecting a different topic filter.
          </p>
          <button
            onClick={() => {
              setQ("");
              setSelectedCat("all");
            }}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[var(--accent)] text-white hover:opacity-90 transition mt-2"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  FolderTree,
  Tag,
  X,
  Edit3,
  ExternalLink,
  Loader2,
  BookOpen,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TaxonomyArticleDrawerProps {
  taxonomy: { type: 'category' | 'tag'; item: any } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaxonomyArticleDrawer({
  taxonomy,
  isOpen,
  onClose,
}: TaxonomyArticleDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTaxonomy, setActiveTaxonomy] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (taxonomy && isOpen) {
      setActiveTaxonomy(taxonomy);
      setLoading(true);
      const url =
        taxonomy.type === 'category'
          ? `/api/posts?categoryId=${taxonomy.item.id}`
          : `/api/posts?tag=${encodeURIComponent(taxonomy.item.name)}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setPosts(data.posts || []);
        })
        .catch(() => {
          setPosts([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [taxonomy, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const current = taxonomy || activeTaxonomy;
  if (!mounted || !current) return null;

  return createPortal(
    <div
      className={`fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] flex justify-end overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen
          ? 'opacity-100 pointer-events-auto visible'
          : 'opacity-0 pointer-events-none invisible'
      }`}
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
    >
      {/* Backdrop with smooth fade */}
      <div
        className={`fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
        onClick={onClose}
      />

      {/* Slide-over Drawer - Strictly Flush to top-0 of document.body */}
      <aside
        className={`relative z-[100000] flex h-screen max-h-screen w-full sm:w-[560px] flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-in-out will-change-transform top-0 right-0 m-0 p-0 rounded-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ height: '100vh', maxHeight: '100vh', top: 0, bottom: 0, right: 0 }}
      >
        {/* Header - Fixed Height & Flush */}
        <div className="flex h-14 items-center justify-between gap-3 border-b px-5 shrink-0 bg-background">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              {current.type === 'category' ? (
                <FolderTree className="size-4" />
              ) : (
                <Tag className="size-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {current.type === 'category' ? 'Category Articles' : 'Topic Tag Articles'}
              </div>
              <h3 className="text-sm font-bold font-serif text-foreground truncate">
                {current.item.name}
              </h3>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="size-8 text-muted-foreground hover:text-foreground"
            title="Close Drawer (ESC)"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2 text-xs">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Loading assigned articles...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <BookOpen className="size-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-xs text-muted-foreground">
                No articles currently assigned to this {current.type}.
              </p>
              <Link href="/panic/posts/new">
                <Button size="xs" variant="outline" className="gap-1 mt-2">
                  <Plus className="size-3" />
                  <span>Write First Article</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-mono text-muted-foreground pb-1">
                Showing {posts.length} assigned articles:
              </div>
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl border border-border bg-card/60 hover:border-primary/40 hover:bg-card transition flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={post.status === 'published' ? 'default' : 'secondary'}
                        className="capitalize text-[10px] h-4 px-1.5 font-normal"
                      >
                        {post.status}
                      </Badge>
                      <span className="text-xs font-semibold text-foreground truncate block font-serif">
                        {post.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      /{post.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/panic/posts/${post.id}`}>
                      <Button variant="outline" size="xs" className="h-7 text-xs gap-1">
                        <Edit3 className="size-3" />
                        <span>Edit</span>
                      </Button>
                    </Link>
                    <Link href={`/${post.slug}`} target="_blank">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        title="View Live Article"
                      >
                        <ExternalLink className="size-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed Height */}
        <div className="flex h-14 items-center justify-between border-t px-5 shrink-0 bg-muted/20">
          <span className="text-xs font-mono text-muted-foreground">
            Total: <b>{posts.length}</b> articles
          </span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </aside>
    </div>,
    document.body
  );
}

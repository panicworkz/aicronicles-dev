'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  Globe,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PanicPagesListPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.pages) {
        setPages(data.pages);
      }
    } catch (err) {
      toast.error('Failed to load static pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPages((prev) => prev.filter((p) => p.id !== id));
        toast.success('Page deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete page');
      }
    } catch (err) {
      toast.error('Error deleting page');
    }
  };

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Static & Custom Pages</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage corporate, legal, and custom landing pages (About, Privacy, Terms, Sponsor, etc.)
          </p>
        </div>

        <Link href="/panic/pages/new">
          <Button size="sm" className="gap-1.5 font-medium shadow-xs">
            <Plus className="size-3.5" />
            <span>Create New Page</span>
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages by title or slug..."
            className="pl-9 h-8.5 text-xs bg-background"
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {filteredPages.length} {filteredPages.length === 1 ? 'page' : 'pages'}
        </span>
      </div>

      {/* Pages Table Card */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Page Title & Slug</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground animate-pulse">
                    Loading pages...
                  </td>
                </tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    No pages found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPages.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition group">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <Link
                          href={`/panic/pages/${p.id}`}
                          className="font-semibold text-foreground hover:text-primary transition text-sm flex items-center gap-1.5"
                        >
                          <FileText className="size-3.5 text-primary" />
                          <span>{p.title}</span>
                        </Link>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                          <span>/{p.slug}</span>
                          <Link
                            href={`/${p.slug}`}
                            target="_blank"
                            className="text-primary hover:underline inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition ml-1"
                            title="View on Live Storefront"
                          >
                            <span>Live</span>
                            <ExternalLink className="size-2.5" />
                          </Link>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={p.status === 'published' ? 'default' : 'secondary'}
                        className="text-[10px] uppercase font-mono capitalize"
                      >
                        {p.status || 'published'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/panic/pages/${p.id}`}>
                          <Button variant="ghost" size="icon-xs" className="size-7" title="Edit Page">
                            <Edit className="size-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/${p.slug}`} target="_blank">
                          <Button variant="ghost" size="icon-xs" className="size-7 text-muted-foreground hover:text-primary" title="View Live Page">
                            <ExternalLink className="size-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(p.id, p.title)}
                          className="size-7 text-destructive hover:bg-destructive/10"
                          title="Delete Page"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

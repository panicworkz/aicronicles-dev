'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function PanicPostsListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `/api/posts?limit=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this guide?')) return;

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Articles & Guides</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage publications, SEO metadata, and visual content</p>
        </div>
        <Link href="/panic/posts/new">
          <Button size="sm" className="gap-2 text-xs font-medium">
            <Plus className="size-4" />
            <span>New Article</span>
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </form>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['all', 'published', 'draft'].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="capitalize text-xs h-8"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border font-medium">
                <tr>
                  <th className="py-3 px-4">Cover</th>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reading Time</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Loading publications...
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No articles found matching criteria.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-4 w-16">
                        <div className="w-12 h-8 rounded-md bg-muted overflow-hidden border border-border">
                          <img
                            src={post.featuredImageUrl || '/media/default.webp'}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/panic/posts/${post.id}`}
                          className="font-medium text-foreground hover:text-primary transition line-clamp-1 max-w-md"
                        >
                          {post.title}
                        </Link>
                        <div className="text-[11px] text-muted-foreground font-mono truncate max-w-md">/{post.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                          {post.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{post.readingTime}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <Link href={`/${post.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Public Page">
                            <Eye className="size-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/panic/posts/${post.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" title="Edit in Visual Editor">
                            <Edit3 className="size-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="Delete Post"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

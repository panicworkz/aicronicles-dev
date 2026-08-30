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
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles & Guides</h1>
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

      {/* Full-width Posts Table Card */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Cover</TableHead>
              <TableHead>Title & Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reading Time</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  Loading publications...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No articles found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="w-12 h-8 rounded-md bg-muted overflow-hidden border border-border">
                      <img
                        src={post.featuredImageUrl || '/media/default.webp'}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/panic/posts/${post.id}`}
                      className="font-medium text-foreground hover:text-primary transition line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono">/{post.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize text-xs font-normal">
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{post.readingTime}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Link href={`/${post.slug}`} target="_blank">
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" title="View Live Page">
                        <Eye className="size-4" />
                      </Button>
                    </Link>
                    <Link href={`/panic/posts/${post.id}`}>
                      <Button variant="ghost" size="icon" className="size-8 text-primary hover:text-primary" title="Edit in Visual Editor">
                        <Edit3 className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      className="size-8 text-destructive hover:text-destructive"
                      title="Delete Post"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

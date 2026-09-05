'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Users,
  Eye,
  Edit3,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { LivePreviewDrawer } from '@/components/preview/LivePreviewDrawer';
import { SITE_DOMAIN } from '@/lib/seo';

export default function PanicDashboardPage() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    mediaCount: 0,
    authorCount: 3,
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState<any | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/posts?limit=10');
        const data = await res.json();
        if (data.posts) {
          setRecentPosts(data.posts);
          setStats((prev) => ({
            ...prev,
            totalPosts: data.total || data.posts.length,
            publishedPosts: data.publishedTotal || data.posts.filter((p: any) => p.status === 'published').length,
          }));
        }

        const mediaRes = await fetch('/api/media');
        const mediaData = await mediaRes.json();
        if (mediaData.media) {
          setStats((prev) => ({
            ...prev,
            mediaCount: mediaData.media.length,
          }));
        }

        const authorRes = await fetch('/api/authors');
        const authorData = await authorRes.json();
        if (authorData.authors) {
          setStats((prev) => ({
            ...prev,
            authorCount: authorData.authors.length,
          }));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview &amp; Content Analytics</h1>
          <p className="text-sm text-muted-foreground">Project: Fabelo Editorial Hub ({SITE_DOMAIN})</p>
        </div>
        <Link href="/panic/posts/new">
          <Button className="gap-2 bg-primary text-primary-foreground font-semibold shadow-xs">
            <Plus className="size-4" />
            <span>Create Article</span>
          </Button>
        </Link>
      </div>

      {/* Analytics Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Publications"
          value={loading ? "..." : stats.totalPosts.toString()}
          change="All time articles"
          icon={FileText}
        />
        <StatCard
          title="Published Guides"
          value={loading ? "..." : stats.publishedPosts.toString()}
          change="Live on feed"
          icon={CheckCircle2}
        />
        <StatCard
          title="Media Assets"
          value={loading ? "..." : stats.mediaCount.toString()}
          change="Optimized WebP"
          icon={ImageIcon}
        />
        <StatCard
          title="Authors & Editors"
          value={loading ? "..." : stats.authorCount.toString()}
          change="Active staff"
          icon={Users}
        />
      </div>

      {/* Recent Publications Table */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Recent Publications</CardTitle>
            <p className="text-xs text-muted-foreground">Latest articles published or edited</p>
          </div>
          <Link href="/panic/posts" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading publications...</div>
          ) : recentPosts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No publications found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs">Title &amp; Slug</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs">Reading Time</TableHead>
                  <TableHead className="font-semibold text-xs">Last Modified</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPosts.map((post) => (
                  <TableRow key={post.id} className="hover:bg-muted/40 transition">
                    <TableCell className="font-medium">
                      <div className="space-y-0.5">
                        <Link href={`/panic/posts/${post.id}`} className="text-sm font-semibold hover:text-primary transition line-clamp-1">
                          {post.title}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-md">/{post.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={post.status === 'published' ? 'default' : 'secondary'}
                        className={`text-[10px] font-semibold uppercase ${
                          post.status === 'published'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {post.readingTime || '5 min read'}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Aug 31'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPost(post)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                          title="Live Preview"
                        >
                          <Eye className="size-4" />
                        </button>
                        <Link
                          href={`/panic/posts/${post.id}`}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition inline-block"
                          title="Edit Post"
                        >
                          <Edit3 className="size-4" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Live Preview Drawer */}
      <LivePreviewDrawer
        post={previewPost}
        onClose={() => setPreviewPost(null)}
      />
    </div>
  );
}

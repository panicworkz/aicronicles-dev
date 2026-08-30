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
            publishedPosts: data.posts.filter((p: any) => p.status === 'published').length,
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
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview & Content Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Project: Fabelo Editorial Hub (fabelo.testworkz.com)</p>
        </div>
        <Link href="/panic/posts/new">
          <Button size="default" className="gap-2">
            <Plus className="size-4" />
            <span>Create Article</span>
          </Button>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Publications"
          value={stats.totalPosts}
          change="All time articles"
          icon={FileText}
          trend="up"
        />
        <StatCard
          title="Published Guides"
          value={stats.publishedPosts}
          change="Live on web"
          icon={CheckCircle2}
          trend="up"
        />
        <StatCard
          title="Media Assets"
          value={stats.mediaCount}
          change="Optimized WebP"
          icon={ImageIcon}
          trend="up"
        />
        <StatCard
          title="Authors & Editors"
          value={stats.authorCount}
          change="Active staff"
          icon={Users}
          trend="up"
        />
      </div>

      {/* Recent Publications Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-sm font-semibold">Recent Publications</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Latest articles published or edited</p>
          </div>
          <Link href="/panic/posts">
            <Button variant="ghost" size="default" className="gap-1 text-xs text-primary hover:text-primary">
              <span>View all</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title & Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reading Time</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                    Loading recent articles...
                  </TableCell>
                </TableRow>
              ) : recentPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                    No articles found.
                  </TableCell>
                </TableRow>
              ) : (
                recentPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Link
                        href={`/panic/posts/${post.id}`}
                        className="font-medium text-foreground hover:text-primary transition line-clamp-1 text-xs"
                      >
                        {post.title}
                      </Link>
                      <div className="text-[11px] text-muted-foreground font-mono">/{post.slug}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize text-xs font-normal">
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{post.readingTime || '5 min read'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Aug 29'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewPost(post)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Live Slide-over Preview"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Link href={`/panic/posts/${post.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-primary"
                          title="Edit"
                        >
                          <Edit3 className="size-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Live Preview Slide-Over Drawer */}
      <LivePreviewDrawer
        post={previewPost}
        onClose={() => setPreviewPost(null)}
      />
    </div>
  );
}

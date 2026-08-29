import React from 'react';
import Link from 'next/link';
import { db, schema } from '@/db';
import { desc, count, eq } from 'drizzle-orm';
import {
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Users,
  Plus,
  ArrowRight,
  Eye,
  Edit3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PanicDashboardPage() {
  const [totalPostsResult] = await db.select({ value: count() }).from(schema.posts);
  const [publishedPostsResult] = await db.select({ value: count() }).from(schema.posts).where(eq(schema.posts.status, 'published'));
  const [mediaResult] = await db.select({ value: count() }).from(schema.media);
  const [authorResult] = await db.select({ value: count() }).from(schema.authors);

  const recentPosts = await db.query.posts.findMany({
    orderBy: [desc(schema.posts.updatedAt), desc(schema.posts.createdAt)],
    limit: 8,
  });

  const stats = [
    { label: 'Total Publications', value: totalPostsResult.value, icon: FileText, change: 'All time' },
    { label: 'Published Guides', value: publishedPostsResult.value, icon: CheckCircle2, change: 'Live on web' },
    { label: 'Media Assets', value: mediaResult.value, icon: ImageIcon, change: 'Optimized WebP' },
    { label: 'Authors & Editors', value: authorResult.value, icon: Users, change: 'Active staff' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview & Content Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Project: Fabelo Editorial Hub (fabelo.testworkz.com)</p>
        </div>
        <Link href="/panic/posts/new">
          <Button size="sm" className="gap-2 text-xs font-medium">
            <Plus className="size-4" />
            <span>Create Article</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{stat.change}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Publications Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/60">
          <div>
            <CardTitle className="text-base font-semibold">Recent Publications</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Latest articles published or edited</p>
          </div>
          <Link href="/panic/posts" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 font-medium">
                <tr>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reading Time</th>
                  <th className="py-3 px-4">Last Modified</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground truncate max-w-md">{post.title}</div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate max-w-md">/{post.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                        {post.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{post.readingTime}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

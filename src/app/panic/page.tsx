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
import { StatCard } from '@/components/dashboard/stat-card';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview & Content Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Project: Fabelo Editorial Hub (fabelo.testworkz.com)</p>
        </div>
        <Link href="/panic/posts/new">
          <Button size="sm" className="gap-2 text-xs font-medium">
            <Plus className="size-4" />
            <span>Create Article</span>
          </Button>
        </Link>
      </div>

      {/* Hubz Stat Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Publications"
          value={totalPostsResult.value}
          change="All time articles"
          icon={FileText}
          trend="up"
        />
        <StatCard
          title="Published Guides"
          value={publishedPostsResult.value}
          change="Live on web"
          icon={CheckCircle2}
          trend="up"
        />
        <StatCard
          title="Media Assets"
          value={mediaResult.value}
          change="Optimized WebP"
          icon={ImageIcon}
          trend="up"
        />
        <StatCard
          title="Authors & Editors"
          value={authorResult.value}
          change="Active staff"
          icon={Users}
          trend="up"
        />
      </div>

      {/* Recent Publications Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Recent Publications</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Latest articles published or edited</p>
          </div>
          <Link href="/panic/posts" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground border-b text-xs font-medium">
                <tr>
                  <th className="py-3 px-2">Title & Slug</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Reading Time</th>
                  <th className="py-3 px-2">Last Modified</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/40 transition">
                    <td className="py-3 px-2">
                      <div className="font-medium text-foreground truncate max-w-lg">{post.title}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-lg">/{post.slug}</div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize text-xs font-normal">
                        {post.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">{post.readingTime}</td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">
                      {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                    </td>
                    <td className="py-3 px-2 text-right space-x-1">
                      <Link href={`/${post.slug}`} target="_blank">
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" title="View Public Page">
                          <Eye className="size-4" />
                        </Button>
                      </Link>
                      <Link href={`/panic/posts/${post.id}`}>
                        <Button variant="ghost" size="icon" className="size-8 text-primary hover:text-primary" title="Edit in Visual Editor">
                          <Edit3 className="size-4" />
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

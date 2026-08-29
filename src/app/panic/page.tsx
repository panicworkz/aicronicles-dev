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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Overview & Content Analytics</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">Project: Fabelo Editorial Hub (fabelo.testworkz.com)</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/panic/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Article</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">{stat.label}</span>
                <div className="p-2 rounded-lg bg-neutral-800/80 text-amber-500">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white font-mono">{stat.value}</div>
              <div className="text-[11px] text-neutral-500 font-mono">{stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Posts Table */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 overflow-hidden backdrop-blur shadow-sm">
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent Publications</h2>
            <p className="text-xs text-neutral-400 font-mono">Latest articles published or edited</p>
          </div>
          <Link
            href="/panic/posts"
            className="text-xs font-semibold text-amber-500 hover:text-amber-400 inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 text-neutral-400 font-mono border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4 font-medium">Title & Slug</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Reading Time</th>
                <th className="py-3 px-4 font-medium">Last Modified</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {recentPosts.map((post) => (
                <tr key={post.id} className="hover:bg-neutral-800/30 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white truncate max-w-md">{post.title}</div>
                    <div className="text-[11px] text-neutral-500 font-mono truncate max-w-md">/{post.slug}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-400">{post.readingTime}</td>
                  <td className="py-3 px-4 font-mono text-neutral-400">
                    {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      href={`/${post.slug}`}
                      target="_blank"
                      className="p-1.5 inline-flex items-center text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
                      title="View Public Page"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/panic/posts/${post.id}`}
                      className="p-1.5 inline-flex items-center text-amber-500 hover:text-amber-400 rounded hover:bg-neutral-800 transition"
                      title="Edit in Visual Editor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

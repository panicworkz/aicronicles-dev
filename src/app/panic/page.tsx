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
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Overview & Content Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Project: Fabelo Editorial Hub (fabelo.testworkz.com)</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/panic/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition shadow-sm"
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
              className="rounded-xl border border-slate-800/80 bg-[#0f172a]/60 p-5 backdrop-blur shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-[11px] text-slate-500 font-medium">{stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Posts Table */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0f172a]/40 overflow-hidden backdrop-blur shadow-sm">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Publications</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest articles published or edited</p>
          </div>
          <Link
            href="/panic/posts"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0f19]/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4">Title & Slug</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reading Time</th>
                <th className="py-3 px-4">Last Modified</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-100 truncate max-w-md">{post.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-md">/{post.slug}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{post.readingTime}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      href={`/${post.slug}`}
                      target="_blank"
                      className="p-1.5 inline-flex items-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                      title="View Public Page"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/panic/posts/${post.id}`}
                      className="p-1.5 inline-flex items-center text-indigo-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition"
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

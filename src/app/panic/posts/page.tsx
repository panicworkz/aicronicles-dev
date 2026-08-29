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
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Articles & Guides</h1>
          <p className="text-xs text-slate-400 mt-1">Manage publications, SEO metadata, and visual content</p>
        </div>
        <Link
          href="/panic/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#0f172a]/60 border-slate-800"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['all', 'published', 'draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                statusFilter === st
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white bg-[#0f172a]/40 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0f172a]/40 overflow-hidden backdrop-blur shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0f19]/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4">Cover</th>
                <th className="py-3 px-4">Title & Slug</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reading Time</th>
                <th className="py-3 px-4">Published</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Loading publications...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No articles found matching criteria.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 w-16">
                      <div className="w-12 h-8 rounded bg-slate-800 overflow-hidden border border-slate-700/60">
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
                        className="font-medium text-slate-100 hover:text-indigo-400 transition line-clamp-1 max-w-md"
                      >
                        {post.title}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-md">/{post.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                          post.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{post.readingTime}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link
                        href={`/${post.slug}`}
                        target="_blank"
                        className="p-1.5 inline-flex items-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                        title="View Live Page"
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
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 inline-flex items-center text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

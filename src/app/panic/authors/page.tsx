'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  ArrowRight,
  Edit3,
  Trash2,
  Save,
  X,
  ExternalLink,
  BookOpen,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function PanicAuthorsPage() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Author Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [role, setRole] = useState('Author');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/authors');
      const data = await res.json();
      if (data.authors) setAuthors(data.authors);
    } catch (err) {
      toast.error('Failed to load authors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const openCreate = () => {
    setEditingAuthor(null);
    setName('');
    setSlug('');
    setRole('Author');
    setBio('');
    setAvatarUrl('');
    setModalOpen(true);
  };

  const openEdit = (a: any) => {
    setEditingAuthor(a);
    setName(a.name);
    setSlug(a.slug);
    setRole(a.role || 'Author');
    setBio(a.bio || '');
    setAvatarUrl(a.avatarUrl || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Author name is required');

    setSaving(true);
    try {
      const url = editingAuthor ? `/api/authors/${editingAuthor.id}` : '/api/authors';
      const method = editingAuthor ? 'PUT' : 'POST';
      const body = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        role,
        bio,
        avatarUrl,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingAuthor ? 'Author profile updated' : 'New author created');
        setModalOpen(false);
        fetchAuthors();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Error saving author profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, authorName: string) => {
    if (!confirm(`Are you sure you want to delete author "${authorName}"?`)) return;

    try {
      const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Author deleted');
        setAuthors(authors.filter((a) => a.id !== id));
      } else {
        toast.error(data.error || 'Failed to delete author');
      }
    } catch (err) {
      toast.error('Error deleting author');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight font-serif">Authors & Contributors</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {authors.length} Members
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Manage editorial staff, author bios, avatars, and public archive pages.
          </p>
        </div>

        <Button onClick={openCreate} size="sm" className="gap-1.5 font-medium shadow-xs">
          <Plus className="size-4" />
          <span>New Author</span>
        </Button>
      </div>

      {/* Author Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl border bg-card/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {authors.map((author) => (
            <Card key={author.id} className="relative overflow-hidden border border-border bg-card/60 hover:border-primary/40 transition duration-200 flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-base font-bold text-primary uppercase overflow-hidden shrink-0 shadow-2xs">
                      {author.avatarUrl ? (
                        <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        author.name.slice(0, 2)
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold font-serif">{author.name}</CardTitle>
                      <span className="text-[11px] font-mono text-primary font-medium">{author.role || 'Author'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEdit(author)}
                      className="size-7 text-muted-foreground hover:text-foreground"
                      title="Edit Author"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(author.id, author.name)}
                      className="size-7 text-destructive hover:bg-destructive/10"
                      title="Delete Author"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {author.bio || 'No biography written yet.'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border/80 text-xs">
                  <span className="inline-flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
                    <BookOpen className="size-3 text-primary" />
                    <b>{author.postCount || 0}</b> Articles
                  </span>

                  <Link
                    href={`/author/${author.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                  >
                    <span>Public Profile</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT AUTHOR MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold font-serif">
                {editingAuthor ? 'Edit Author Profile' : 'Create New Author'}
              </h2>
              <Button variant="ghost" size="icon-xs" onClick={() => setModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingAuthor) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                      }
                    }}
                    placeholder="e.g. Ufuk Yorulmaz"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Role / Title</Label>
                  <Input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Founder & Tech Lead"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">URL Slug</Label>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md border">
                  <span>/author/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="author-slug"
                    className="bg-transparent text-foreground focus:outline-none flex-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Avatar Image URL</Label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://... or /media/avatar.webp"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Biography</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short editorial bio..."
                  rows={3}
                  className="text-xs leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                  <Save className="size-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Author'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

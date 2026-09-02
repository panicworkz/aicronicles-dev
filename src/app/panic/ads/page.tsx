'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Eye,
  MousePointerClick,
  Sparkles,
  Power,
  Calendar,
  Image as ImageIcon,
  Check,
  X,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

const PLACEMENT_CONFIG: Record<
  string,
  { label: string; size: string; w: number; h: number; desc: string; badgeColor: string }
> = {
  measure: {
    label: 'Measure',
    size: '1440×200',
    w: 1440,
    h: 200,
    desc: 'Full content width — home and category section breaks',
    badgeColor: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  },
  feature: {
    label: 'Feature',
    size: '940×180',
    w: 940,
    h: 180,
    desc: 'Article body, and two of three columns',
    badgeColor: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  },
  panel: {
    label: 'Panel',
    size: '511×300',
    w: 511,
    h: 300,
    desc: 'Home page sidebar',
    badgeColor: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  },
  rail: {
    label: 'Rail',
    size: '387×540',
    w: 387,
    h: 540,
    desc: 'Side rail — article, tag and author pages',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  },
};

export default function PanicAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  /** Buyuk onizlemede acik olan ilan */
  const [preview, setPreview] = useState<any | null>(null);
  const [filterPlacement, setFilterPlacement] = useState<string>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);

  const [name, setName] = useState('');
  const [placement, setPlacement] = useState('measure');
  const [imageUrl, setImageUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ads?active=all');
      const data = await res.json();
      if (data.ads) {
        setAds(data.ads);
      }
    } catch (err) {
      toast.error('Failed to load ad inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreateModal = () => {
    setEditingAd(null);
    setName('');
    setPlacement('measure');
    setImageUrl('');
    setAlt('');
    setTargetUrl('');
    setIsActive(true);
    setStartsAt('');
    setEndsAt('');
    setIsModalOpen(true);
  };

  const openEditModal = (ad: any) => {
    setEditingAd(ad);
    setName(ad.name || '');
    setPlacement(ad.placement || 'measure');
    setImageUrl(ad.imageUrl || '');
    setAlt(ad.alt || '');
    setTargetUrl(ad.targetUrl || '');
    setIsActive(Boolean(ad.isActive));
    setStartsAt(ad.startsAt ? new Date(ad.startsAt).toISOString().split('T')[0] : '');
    setEndsAt(ad.endsAt ? new Date(ad.endsAt).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim() || !targetUrl.trim()) {
      toast.error('Please fill in all required fields (Name, Creative Image, Target URL)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        placement,
        imageUrl: imageUrl.trim(),
        alt: alt.trim() || null,
        targetUrl: targetUrl.trim(),
        isActive,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      };

      if (editingAd) {
        // PUT
        const res = await fetch('/api/ads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingAd.id, ...payload }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Ad updated successfully!');
          setIsModalOpen(false);
          fetchAds();
        } else {
          toast.error(data.error || 'Failed to update ad');
        }
      } else {
        // POST
        const res = await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('New ad created successfully!');
          setIsModalOpen(false);
          fetchAds();
        } else {
          toast.error(data.error || 'Failed to create ad');
        }
      }
    } catch (err) {
      toast.error('An error occurred while saving ad');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (ad: any) => {
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ad.id, isActive: !ad.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ad "${ad.name}" is now ${!ad.isActive ? 'Active' : 'Inactive'}`);
        fetchAds();
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (adId: number, adName: string) => {
    if (!confirm(`Are you sure you want to delete ad campaign "${adName}"?`)) return;

    try {
      const res = await fetch(`/api/ads?id=${adId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Ad deleted');
        fetchAds();
      } else {
        toast.error('Failed to delete ad');
      }
    } catch (err) {
      toast.error('Error deleting ad');
    }
  };

  // Metrics
  const totalCampaigns = ads.length;
  const activeCampaigns = ads.filter((a) => a.isActive).length;
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const filteredAds = filterPlacement === 'all'
    ? ads
    : ads.filter((a) => a.placement === filterPlacement);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1536px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Megaphone className="size-8 text-primary" />
            Ad Inventory &amp; Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fabelo&apos;s house formats — Measure, Feature, Panel and Rail. Sized from the site&apos;s twelve-column grid, so a creative fills its slot exactly at any width.
          </p>
        </div>

        <Button onClick={openCreateModal} className="gap-2 font-bold shadow-xs">
          <Plus className="size-4" />
          Create New Campaign
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono font-medium text-muted-foreground uppercase">Total Campaigns</p>
              <p className="text-2xl font-extrabold mt-1 text-foreground">{totalCampaigns}</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Megaphone className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono font-medium text-muted-foreground uppercase">Active Units</p>
              <p className="text-2xl font-extrabold mt-1 text-emerald-600">{activeCampaigns}</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Power className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono font-medium text-muted-foreground uppercase">Total Impressions</p>
              <p className="text-2xl font-extrabold mt-1 text-foreground">{totalImpressions.toLocaleString()}</p>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Eye className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono font-medium text-muted-foreground uppercase">Clicks (CTR)</p>
              <p className="text-2xl font-extrabold mt-1 text-foreground">
                {totalClicks.toLocaleString()}{' '}
                <span className="text-xs font-mono font-normal text-muted-foreground">({avgCtr}%)</span>
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <MousePointerClick className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <button
          onClick={() => setFilterPlacement('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            filterPlacement === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          All Units ({ads.length})
        </button>
        {Object.entries(PLACEMENT_CONFIG).map(([key, conf]) => {
          const count = ads.filter((a) => a.placement === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilterPlacement(key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterPlacement === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{conf.label}</span>
              <span className="opacity-70 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Ads Inventory Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[152px]">Creative</TableHead>
              <TableHead>Campaign &amp; Destination</TableHead>
              <TableHead>Placement &amp; Size</TableHead>
              <TableHead>Impressions</TableHead>
              <TableHead>Clicks (CTR)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Loading ad campaigns...
                </TableCell>
              </TableRow>
            ) : filteredAds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No ad campaigns found. Click &quot;Create New Campaign&quot; to create your first ad unit.
                </TableCell>
              </TableRow>
            ) : (
              filteredAds.map((ad) => {
                const conf = PLACEMENT_CONFIG[ad.placement] || {
                  label: ad.placement,
                  size: 'Custom',
                  w: 16,
                  h: 9,
                  desc: '',
                  badgeColor: 'bg-gray-500/10 text-gray-600',
                };
                const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';

                return (
                  <TableRow key={ad.id} className="hover:bg-muted/30 transition">
                    <TableCell>
                      {/* Onizleme ilanin KENDI oraninda; kareye sikistirmak
                          afisi taninmaz hale getiriyordu. Tiklayinca gercek
                          olcusunde aciliyor. */}
                      <button
                        type="button"
                        onClick={() => setPreview(ad)}
                        title="Open full size"
                        className="group block overflow-hidden rounded-md border border-border bg-muted/30 transition hover:border-primary"
                        style={{ width: 132, aspectRatio: `${conf.w} / ${conf.h}` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ad.imageUrl}
                          alt={ad.alt || ad.name}
                          className="size-full object-cover transition group-hover:opacity-90"
                          onError={(e) => {
                            (e.target as any).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23eee"/><text x="12" y="28" font-size="12" fill="%23666">AD</text></svg>';
                          }}
                        />
                      </button>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-bold text-foreground leading-snug">{ad.name}</p>
                        <a
                          href={ad.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono truncate max-w-[280px]"
                        >
                          <span className="truncate">{ad.targetUrl}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${conf.badgeColor}`}>
                          {conf.label}
                        </span>
                        <p className="text-[11px] font-mono text-muted-foreground">{conf.size}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-sm font-semibold">{ad.impressions.toLocaleString()}</span>
                    </TableCell>

                    <TableCell>
                      <div className="font-mono text-xs">
                        <span className="font-bold">{ad.clicks.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">({ctr}%)</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => toggleStatus(ad)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                          ad.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${ad.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        {ad.isActive ? 'Active' : 'Paused'}
                      </button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(ad)}
                          className="size-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ad.id, ad.name)}
                          className="size-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Megaphone className="size-5 text-primary" />
                {editingAd ? 'Edit Ad Campaign' : 'Create New Ad Campaign'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Campaign Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme SaaS Summer Launch"
                  required
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="placement" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Placement Slot *
                  </Label>
                  <select
                    id="placement"
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 rounded-lg bg-background border border-input text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="measure">Measure — 1440×200 (full width)</option>
                    <option value="feature">Feature — 940×180 (article body)</option>
                    <option value="panel">Panel — 511×300 (sidebar)</option>
                    <option value="rail">Rail — 387×540 (side rail)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Initial Status
                  </Label>
                  <select
                    id="status"
                    value={isActive ? '1' : '0'}
                    onChange={(e) => setIsActive(e.target.value === '1')}
                    className="mt-1.5 w-full h-10 px-3 rounded-lg bg-background border border-input text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="1">Active / Live</option>
                    <option value="0">Paused / Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Creative Image URL *
                </Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/media/banner.webp or https://..."
                  required
                  className="mt-1.5"
                />
                {imageUrl && (
                  <div className="mt-2 p-2 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
                    <div className="size-10 rounded overflow-hidden bg-muted border border-border shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="preview" className="size-full object-cover" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground truncate">{imageUrl}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="alt" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Image Alt Text (Accessibility)
                </Label>
                <Input
                  id="alt"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="e.g. Try Acme Analytics Free for 14 Days"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="targetUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Destination URL *
                </Label>
                <Input
                  id="targetUrl"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/partner-deal"
                  required
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label htmlFor="startsAt" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Start Date (Optional)
                  </Label>
                  <Input
                    id="startsAt"
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="endsAt" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    End Date (Optional)
                  </Label>
                  <Input
                    id="endsAt"
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="font-bold">
                  {submitting ? 'Saving...' : editingAd ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Buyuk onizleme -------------------------------------------------
          Afis gercek olcusunde aciliyor; ekrana sigmazsa oranini koruyarak
          kuculuyor. Animasyonlu SVG'ler burada da oynuyor, yani yayina
          almadan once afisin akisini gorebiliyoruz. */}
      {preview && (() => {
        const c = PLACEMENT_CONFIG[preview.placement] || { label: preview.placement, size: 'Custom', w: 16, h: 9 };
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${preview.name} preview`}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          >
            <div className="max-h-full w-full max-w-[1480px] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-white">
                <div>
                  <p className="text-base font-bold">{preview.name}</p>
                  <p className="font-mono text-xs text-white/70">
                    {c.label} · {c.size} · actual size
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setPreview(null)}>
                  <X className="mr-1.5 size-4" /> Close
                </Button>
              </div>

              {/* Sitedeki cerceveyle ayni: kagit zemin, ince kural */}
              <div
                className="mx-auto overflow-hidden border"
                style={{
                  width: c.w,
                  maxWidth: '100%',
                  aspectRatio: `${c.w} / ${c.h}`,
                  background: '#faf8f4',
                  borderColor: '#d9d3c6',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.imageUrl} alt={preview.alt || preview.name} className="size-full object-cover" />
              </div>

              <p className="mt-3 text-center font-mono text-[11px] text-white/50">
                Click outside to close
              </p>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

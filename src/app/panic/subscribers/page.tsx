'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Mail,
  Search,
  Download,
  Trash2,
  UserMinus,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Users,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';

/** Abonenin hangi formdan geldigi — sitedeki uc yer */
const KAYNAKLAR: Record<string, { label: string; hint: string; renk: string }> = {
  footer: {
    label: 'Footer',
    hint: 'Footer form, present on every page',
    renk: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  },
  dispatch: {
    label: 'Dispatch',
    hint: 'The dispatch block on the home page',
    renk: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
  },
  article: {
    label: 'Article',
    hint: 'The form inside an article',
    renk: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  },
  unknown: {
    label: 'Unknown',
    hint: 'Recorded before the source was tracked',
    renk: 'bg-muted text-muted-foreground border-border',
  },
};

type Abone = {
  id: number;
  email: string;
  source: string | null;
  source_url: string | null;
  status: string;
  gateway_status: string | null;
  ip: string | null;
  created_at: string;
  unsubscribed_at: string | null;
};

type Ozet = {
  toplam: number;
  aktif: number;
  cikan: number;
  iletilemeyen: number;
  bu_hafta: number;
};

/** Tam adresten okunur bir yol cikar — "/how-to-budget-money" gibi */
function yol(adres: string | null): string | null {
  if (!adres) return null;
  try {
    const u = new URL(adres);
    return u.pathname === "/" ? "Home page" : decodeURIComponent(u.pathname);
  } catch {
    return adres;
  }
}

const tarih = (d: string | null) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function SubscribersPage() {
  const [aboneler, setAboneler] = useState<Abone[]>([]);
  const [ozet, setOzet] = useState<Ozet | null>(null);
  const [eslesen, setEslesen] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState('');
  const [kaynak, setKaynak] = useState('');
  const [durum, setDurum] = useState('');

  const getir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const q = new URLSearchParams();
      if (arama) q.set('q', arama);
      if (kaynak) q.set('source', kaynak);
      if (durum) q.set('status', durum);
      const r = await fetch(`/api/subscribers?${q}`);
      if (!r.ok) throw new Error('request failed');
      const d = await r.json();
      setAboneler(d.subscribers ?? []);
      setOzet(d.stats ?? null);
      setEslesen(d.matched ?? 0);
    } catch {
      toast.error('Could not load subscribers.');
    } finally {
      setYukleniyor(false);
    }
  }, [arama, kaynak, durum]);

  // Yazarken her tusa istek atmayalim
  useEffect(() => {
    const z = setTimeout(getir, 250);
    return () => clearTimeout(z);
  }, [getir]);

  const durumDegistir = async (a: Abone) => {
    const yeni = a.status === 'active' ? 'unsubscribed' : 'active';
    const r = await fetch('/api/subscribers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, status: yeni }),
    });
    if (r.ok) {
      toast.success(
        yeni === 'unsubscribed' ? 'Subscription ended.' : 'Subscription restored.'
      );
      getir();
    } else {
      toast.error('That did not work.');
    }
  };

  const sil = async (a: Abone) => {
    if (!confirm(`Delete ${a.email} permanently? This cannot be undone.`)) return;
    const r = await fetch(`/api/subscribers?id=${a.id}`, { method: 'DELETE' });
    if (r.ok) {
      toast.success('Record deleted.');
      getir();
    } else {
      toast.error('Could not delete.');
    }
  };

  const disaAktar = () => {
    const q = new URLSearchParams({ export: 'csv' });
    if (arama) q.set('q', arama);
    if (kaynak) q.set('source', kaynak);
    if (durum) q.set('status', durum);
    window.location.href = `/api/subscribers?${q}`;
  };

  const kartlar = [
    { baslik: 'Total subscribers', deger: ozet?.toplam ?? 0, ikon: Users, renk: 'text-foreground' },
    { baslik: 'Active', deger: ozet?.aktif ?? 0, ikon: UserCheck, renk: 'text-emerald-600' },
    { baslik: 'Last 7 days', deger: ozet?.bu_hafta ?? 0, ikon: TrendingUp, renk: 'text-cyan-600' },
    { baslik: 'Unsubscribed', deger: ozet?.cikan ?? 0, ikon: UserMinus, renk: 'text-muted-foreground' },
    {
      baslik: 'Not delivered',
      deger: ozet?.iletilemeyen ?? 0,
      ikon: AlertTriangle,
      renk: 'text-amber-600',
    },
  ];

  const filtreVar = Boolean(arama || kaynak || durum);

  return (
    <div className="space-y-6">
      {/* Baslik */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Mail className="size-6" />
            Newsletter Subscribers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign-ups for The Dispatch. Every address is written here first, then
            forwarded to the mail gateway for notification.
          </p>
        </div>
        <Button variant="outline" onClick={disaAktar} disabled={!aboneler.length}>
          <Download className="mr-2 size-4" />
          Download CSV{filtreVar ? ' (filtered)' : ''}
        </Button>
      </div>

      {/* Ozet */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kartlar.map((k) => (
          <Card key={k.baslik}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {k.baslik}
              </CardTitle>
              <k.ikon className={`size-4 ${k.renk}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold tabular-nums ${k.renk}`}>{k.deger}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Search email…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['', 'footer', 'dispatch', 'article'].map((k) => (
            <Button
              key={k || 'hepsi'}
              size="sm"
              variant={kaynak === k ? 'default' : 'outline'}
              onClick={() => setKaynak(k)}
              title={k ? KAYNAKLAR[k]?.hint : 'All sources'}
            >
              {k ? KAYNAKLAR[k].label : 'All'}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { d: '', ad: 'Any status' },
            { d: 'active', ad: 'Active' },
            { d: 'unsubscribed', ad: 'Unsubscribed' },
          ].map((x) => (
            <Button
              key={x.d || 'hepsi'}
              size="sm"
              variant={durum === x.d ? 'default' : 'outline'}
              onClick={() => setDurum(x.d)}
            >
              {x.ad}
            </Button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <Card>
        <CardContent className="p-0">
          {yukleniyor ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : !aboneler.length ? (
            <div className="p-16 text-center">
              <Inbox className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {filtreVar ? 'No records match this filter.' : 'No subscribers yet.'}
              </p>
              {!filtreVar && (
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  The first sign-up will appear here — from the footer, the dispatch
                  block on the home page, or a form inside an article.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Signed up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aboneler.map((a) => {
                  const k = KAYNAKLAR[a.source ?? 'unknown'] ?? KAYNAKLAR.unknown;
                  const cikti = a.status === 'unsubscribed';
                  return (
                    <TableRow key={a.id} className={cikti ? 'opacity-55' : undefined}>
                      <TableCell className="font-medium">{a.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={k.renk} title={k.hint}>
                          {k.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {a.source_url ? (
                          <a
                            href={a.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={a.source_url}
                            className="block truncate text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                          >
                            {yol(a.source_url)}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cikti ? (
                          <span className="text-sm text-muted-foreground">Left</span>
                        ) : (
                          <span className="text-sm text-emerald-600">Active</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.gateway_status === 'failed' ? (
                          <span
                            className="text-sm text-amber-600"
                            title="Recorded, but the notification email could not be sent"
                          >
                            Failed
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {a.gateway_status === 'sent' ? 'Sent' : '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tarih(a.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => durumDegistir(a)}
                            title={cikti ? 'Restore subscription' : 'End subscription'}
                          >
                            {cikti ? (
                              <UserCheck className="size-4" />
                            ) : (
                              <UserMinus className="size-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sil(a)}
                            title="Delete permanently"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {aboneler.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {eslesen} matched, showing {aboneler.length}.
        </p>
      )}
    </div>
  );
}

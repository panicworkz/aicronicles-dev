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
    hint: 'Her sayfadaki alt bilgi formu',
    renk: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  },
  dispatch: {
    label: 'Dispatch',
    hint: 'Ana sayfadaki büyük abonelik bloğu',
    renk: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
  },
  article: {
    label: 'Article',
    hint: 'Yazı sayfası içindeki form',
    renk: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  },
  unknown: {
    label: 'Bilinmiyor',
    hint: 'Kaynağı işaretlenmemiş kayıt',
    renk: 'bg-muted text-muted-foreground border-border',
  },
};

type Abone = {
  id: number;
  email: string;
  source: string | null;
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

const tarih = (d: string | null) =>
  d
    ? new Date(d).toLocaleString('tr-TR', {
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
      if (!r.ok) throw new Error('istek başarısız');
      const d = await r.json();
      setAboneler(d.subscribers ?? []);
      setOzet(d.stats ?? null);
      setEslesen(d.matched ?? 0);
    } catch {
      toast.error('Aboneler yüklenemedi.');
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
        yeni === 'unsubscribed' ? 'Abonelik sonlandırıldı.' : 'Abonelik geri alındı.'
      );
      getir();
    } else {
      toast.error('İşlem başarısız.');
    }
  };

  const sil = async (a: Abone) => {
    if (!confirm(`${a.email} kalıcı olarak silinsin mi? Bu geri alınamaz.`)) return;
    const r = await fetch(`/api/subscribers?id=${a.id}`, { method: 'DELETE' });
    if (r.ok) {
      toast.success('Kayıt silindi.');
      getir();
    } else {
      toast.error('Silinemedi.');
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
    { baslik: 'Toplam abone', deger: ozet?.toplam ?? 0, ikon: Users, renk: 'text-foreground' },
    { baslik: 'Aktif', deger: ozet?.aktif ?? 0, ikon: UserCheck, renk: 'text-emerald-600' },
    { baslik: 'Son 7 gün', deger: ozet?.bu_hafta ?? 0, ikon: TrendingUp, renk: 'text-cyan-600' },
    { baslik: 'Çıkanlar', deger: ozet?.cikan ?? 0, ikon: UserMinus, renk: 'text-muted-foreground' },
    {
      baslik: 'İletilemeyen',
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
            The Dispatch abonelikleri. Kayıtlar önce buraya yazılır, sonra bildirim
            e-postası gateway üzerinden gönderilir.
          </p>
        </div>
        <Button variant="outline" onClick={disaAktar} disabled={!aboneler.length}>
          <Download className="mr-2 size-4" />
          CSV indir{filtreVar ? ' (filtreli)' : ''}
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
            placeholder="E-posta ara…"
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
              title={k ? KAYNAKLAR[k]?.hint : 'Tüm kaynaklar'}
            >
              {k ? KAYNAKLAR[k].label : 'Tümü'}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { d: '', ad: 'Her durum' },
            { d: 'active', ad: 'Aktif' },
            { d: 'unsubscribed', ad: 'Çıkanlar' },
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
            <div className="p-12 text-center text-sm text-muted-foreground">Yükleniyor…</div>
          ) : !aboneler.length ? (
            <div className="p-16 text-center">
              <Inbox className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {filtreVar ? 'Bu filtreye uyan kayıt yok.' : 'Henüz abone yok.'}
              </p>
              {!filtreVar && (
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Siteye gelen ilk abonelik burada görünecek — footer, ana sayfadaki
                  Dispatch bloğu ve yazı sayfası formlarından.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İletim</TableHead>
                  <TableHead>Kayıt</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
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
                      <TableCell>
                        {cikti ? (
                          <span className="text-sm text-muted-foreground">Çıktı</span>
                        ) : (
                          <span className="text-sm text-emerald-600">Aktif</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.gateway_status === 'failed' ? (
                          <span
                            className="text-sm text-amber-600"
                            title="Kayıt alındı, bildirim e-postası gönderilemedi"
                          >
                            İletilemedi
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {a.gateway_status === 'sent' ? 'Gönderildi' : '—'}
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
                            title={cikti ? 'Aboneliği geri al' : 'Aboneliği sonlandır'}
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
                            title="Kaydı kalıcı sil"
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
          {eslesen} kayıt eşleşti, {aboneler.length} tanesi gösteriliyor.
        </p>
      )}
    </div>
  );
}

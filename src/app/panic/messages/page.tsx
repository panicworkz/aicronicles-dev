'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Inbox,
  Search,
  Trash2,
  MailOpen,
  CornerUpLeft,
  Archive,
  AlertTriangle,
  Building2,
  Phone,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * Iletisim mesajlari.
 *
 * Mesajlar once contact_messages tablosuna yaziliyor, sonra merkezi
 * gateway'e iletiliyor (bkz. api/contact). Bu ekran ASIL KAYDI
 * gosteriyor: gateway dusse bile mesaj burada duruyor ve iletim durumu
 * "failed" olarak isaretli geliyor.
 */

/** Formdaki sekmeler — sitedeki sabit sayfalarla ayni bolumleme. */
const KONULAR: Record<string, { etiket: string; renk: string }> = {
  general: { etiket: 'General', renk: 'bg-slate-500/15 text-slate-600 border-slate-500/30' },
  advertising: { etiket: 'Advertising', renk: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  sponsorship: { etiket: 'Sponsored', renk: 'bg-violet-500/15 text-violet-600 border-violet-500/30' },
  licensing: { etiket: 'Licensing', renk: 'bg-sky-500/15 text-sky-600 border-sky-500/30' },
  privacy: { etiket: 'Privacy', renk: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
};

const DURUMLAR = [
  { anahtar: 'new', etiket: 'New' },
  { anahtar: 'read', etiket: 'Read' },
  { anahtar: 'replied', etiket: 'Replied' },
  { anahtar: 'archived', etiket: 'Archived' },
] as const;

type Mesaj = {
  id: number;
  topic: string;
  topicLabel: string | null;
  name: string;
  email: string;
  organization: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  fields: Record<string, string> | null;
  sourceUrl: string | null;
  status: string;
  gatewayStatus: string | null;
  createdAt: string;
};

export default function MesajlarSayfasi() {
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [sayilar, setSayilar] = useState<Record<string, number>>({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [suzgec, setSuzgec] = useState<string>('');
  const [arama, setArama] = useState('');
  const [acik, setAcik] = useState<number | null>(null);

  const getir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const y = await fetch(`/api/messages${suzgec ? `?status=${suzgec}` : ''}`);
      const d = await y.json();
      if (d?.success) {
        setMesajlar(d.messages ?? []);
        setSayilar(d.counts ?? {});
      } else {
        toast.error(d?.message || d?.error || 'Messages could not be loaded');
      }
    } catch {
      toast.error('Messages could not be loaded');
    } finally {
      setYukleniyor(false);
    }
  }, [suzgec]);

  useEffect(() => {
    getir();
  }, [getir]);

  async function durumDegistir(id: number, status: string) {
    const y = await fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const d = await y.json();
    if (d?.success) {
      setMesajlar((m) => m.map((x) => (x.id === id ? { ...x, status } : x)));
      getir();
    } else toast.error(d?.message || 'Could not update');
  }

  async function sil(id: number) {
    if (!confirm('Delete this message permanently?')) return;
    const y = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' });
    const d = await y.json();
    if (d?.success) {
      toast.success('Message deleted');
      setMesajlar((m) => m.filter((x) => x.id !== id));
      getir();
    } else toast.error(d?.message || 'Could not delete');
  }

  const suzulmus = useMemo(() => {
    const a = arama.trim().toLowerCase();
    if (!a) return mesajlar;
    return mesajlar.filter((m) =>
      [m.name, m.email, m.organization, m.subject, m.message].some((x) =>
        (x || '').toLowerCase().includes(a)
      )
    );
  }, [mesajlar, arama]);

  const toplam = Object.values(sayilar).reduce((a, b) => a + b, 0);
  const iletilemeyen = mesajlar.filter((m) => m.gatewayStatus === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Inbox className="size-6" /> Messages
          </h1>
          <p className="text-sm text-muted-foreground">
            Everything sent through the contact form. The record lives here — the
            e-mail is a copy.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Search name, email, company, text…"
            className="w-72 pl-9"
          />
        </div>
      </div>

      {/* Ozet */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-2xl font-bold">{toplam}</span>
          </CardContent>
        </Card>
        {DURUMLAR.slice(0, 2).map((d) => (
          <Card key={d.anahtar}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {d.etiket}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-2xl font-bold">{sayilar[d.anahtar] ?? 0}</span>
            </CardContent>
          </Card>
        ))}
        <Card className={iletilemeyen ? 'border-red-500/40' : undefined}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {iletilemeyen > 0 && <AlertTriangle className="size-3.5 text-red-500" />}
              Not e-mailed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-2xl font-bold">{iletilemeyen}</span>
            {iletilemeyen > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Saved here, but the mail gateway refused them.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Durum suzgeci */}
      <div className="flex flex-wrap gap-2">
        <Button variant={suzgec === '' ? 'default' : 'outline'} size="sm" onClick={() => setSuzgec('')}>
          All
        </Button>
        {DURUMLAR.map((d) => (
          <Button
            key={d.anahtar}
            variant={suzgec === d.anahtar ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSuzgec(d.anahtar)}
          >
            {d.etiket}
            <span className="ml-1.5 font-mono text-[11px] opacity-70">
              {sayilar[d.anahtar] ?? 0}
            </span>
          </Button>
        ))}
      </div>

      {/* Liste */}
      {yukleniyor ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
      ) : suzulmus.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-20 text-center">
          <Inbox className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {arama ? 'Nothing matches that search.' : 'No messages yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {suzulmus.map((m) => {
            const konu = KONULAR[m.topic] ?? KONULAR.general;
            const acikMi = acik === m.id;
            return (
              <div
                key={m.id}
                className={`rounded-lg border transition-colors ${
                  m.status === 'new' ? 'border-primary/40 bg-primary/[0.03]' : 'border-border'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAcik(acikMi ? null : m.id);
                    if (!acikMi && m.status === 'new') durumDegistir(m.id, 'read');
                  }}
                  className="flex w-full flex-wrap items-center gap-3 p-4 text-left"
                >
                  <Badge variant="outline" className={`shrink-0 text-[11px] ${konu.renk}`}>
                    {m.topicLabel || konu.etiket}
                  </Badge>
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-muted-foreground">{m.email}</span>
                  {m.organization && (
                    <span className="hidden items-center gap-1 text-sm text-muted-foreground sm:inline-flex">
                      <Building2 className="size-3.5" /> {m.organization}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {m.gatewayStatus === 'failed' && (
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-[11px] text-red-600">
                      not e-mailed
                    </Badge>
                  )}
                  {m.status !== 'new' && (
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {m.status}
                    </Badge>
                  )}
                </button>

                {acikMi && (
                  <div className="space-y-4 border-t border-border p-4 pt-4">
                    {/* Sekmeye ozel alanlar */}
                    {m.fields && Object.keys(m.fields).length > 0 && (
                      <div className="grid gap-x-8 gap-y-2 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
                        {Object.entries(m.fields).map(([k, v]) => (
                          <div key={k} className="text-sm">
                            <span className="text-muted-foreground">{k}: </span>
                            <span className="font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{m.message}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      {m.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3.5" /> {m.phone}
                        </span>
                      )}
                      {m.sourceUrl && (
                        <a
                          href={m.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          <Link2 className="size-3.5" /> {m.sourceUrl.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => durumDegistir(m.id, 'read')}>
                        <MailOpen className="mr-1.5 size-3.5" /> Read
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => durumDegistir(m.id, 'replied')}>
                        <CornerUpLeft className="mr-1.5 size-3.5" /> Replied
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => durumDegistir(m.id, 'archived')}>
                        <Archive className="mr-1.5 size-3.5" /> Archive
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto text-red-600 hover:bg-red-500/10"
                        onClick={() => sil(m.id)}
                      >
                        <Trash2 className="mr-1.5 size-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/**
 * Iletisim mesajlari — iki bolmeli posta kutusu.
 *
 * Mesajlar once contact_messages tablosuna yaziliyor, sonra merkezi
 * gateway'e iletiliyor (bkz. api/contact). Bu ekran ASIL KAYDI
 * gosteriyor: gateway dusse bile mesaj burada duruyor ve iletim durumu
 * "not e-mailed" olarak isaretli geliyor.
 *
 * NEDEN AKORDIYON DEGIL: ilk hali satirlari acilip kapanan bir liste
 * yapmisti. Iki sorunu vardi. Bir, acilan satir altindaki her seyi
 * asagi itiyordu — okurken sayfa yerinden oynuyordu. Iki, mesaji
 * acmak "okundu" isaretliyor ve listeyi BASTAN CEKIYORDU; ekran
 * yenileniyormus gibi sicriyordu.
 *
 * Simdi solda liste, sagda secilen mesaj. Liste hic oynamiyor ve
 * "okundu" yalnizca yerel duruma yaziliyor; sunucuya arka planda
 * gidiyor, yanit beklenmiyor ve liste yeniden cekilmiyor.
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

const tarihKisa = (s: string) =>
  new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MesajlarSayfasi() {
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [sayilar, setSayilar] = useState<Record<string, number>>({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [suzgec, setSuzgec] = useState<string>('');
  const [arama, setArama] = useState('');
  const [secili, setSecili] = useState<number | null>(null);

  const getir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const y = await fetch(`/api/messages${suzgec ? `?status=${suzgec}` : ''}`);
      const d = await y.json();
      if (d?.success) {
        setMesajlar(d.messages ?? []);
        setSayilar(d.counts ?? {});
      } else toast.error(d?.message || d?.error || 'Messages could not be loaded');
    } catch {
      toast.error('Messages could not be loaded');
    } finally {
      setYukleniyor(false);
    }
  }, [suzgec]);

  useEffect(() => {
    getir();
  }, [getir]);

  /** Durumu YEREL olarak degistir, sunucuya arka planda bildir.
      Listeyi yeniden cekmiyoruz: ekranin sicramasinin sebebi oydu. */
  const durumYaz = useCallback((id: number, status: string) => {
    setMesajlar((m) => {
      const eski = m.find((x) => x.id === id)?.status;
      if (eski && eski !== status) {
        setSayilar((s) => ({
          ...s,
          [eski]: Math.max(0, (s[eski] ?? 0) - 1),
          [status]: (s[status] ?? 0) + 1,
        }));
      }
      return m.map((x) => (x.id === id ? { ...x, status } : x));
    });
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch(() => toast.error('Status could not be saved'));
  }, []);

  async function sil(id: number) {
    if (!confirm('Delete this message permanently?')) return;
    const y = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' });
    const d = await y.json();
    if (d?.success) {
      toast.success('Message deleted');
      setMesajlar((m) => m.filter((x) => x.id !== id));
      if (secili === id) setSecili(null);
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

  const acik = suzulmus.find((m) => m.id === secili) ?? null;
  const toplam = Object.values(sayilar).reduce((a, b) => a + b, 0);
  const iletilemeyen = mesajlar.filter((m) => m.gatewayStatus === 'failed').length;

  function sec(m: Mesaj) {
    setSecili(m.id);
    if (m.status === 'new') durumYaz(m.id, 'read');
  }

  return (
    <div className="space-y-5">
      {/* Baslik */}
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

      {/* Suzgec seridi — sayimlar rozet olarak, ayri kart yigini yerine */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={suzgec === '' ? 'default' : 'outline'} size="sm" onClick={() => setSuzgec('')}>
          All <span className="ml-1.5 font-mono text-[11px] opacity-70">{toplam}</span>
        </Button>
        {DURUMLAR.map((d) => (
          <Button
            key={d.anahtar}
            variant={suzgec === d.anahtar ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSuzgec(d.anahtar)}
          >
            {d.etiket}
            <span className="ml-1.5 font-mono text-[11px] opacity-70">{sayilar[d.anahtar] ?? 0}</span>
          </Button>
        ))}
        {iletilemeyen > 0 && (
          <Badge variant="outline" className="ml-auto border-red-500/30 bg-red-500/10 text-red-600">
            <AlertTriangle className="mr-1 size-3.5" />
            {iletilemeyen} not e-mailed
          </Badge>
        )}
      </div>

      {/* Iki bolme */}
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        {/* Liste */}
        <div className="overflow-hidden rounded-lg border border-border">
          {yukleniyor ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
          ) : suzulmus.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="mx-auto mb-3 size-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {arama ? 'Nothing matches that search.' : 'No messages yet.'}
              </p>
            </div>
          ) : (
            <ul className="max-h-[68vh] divide-y divide-border overflow-y-auto">
              {suzulmus.map((m) => {
                const konu = KONULAR[m.topic] ?? KONULAR.general;
                const seciliMi = m.id === secili;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => sec(m)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                        seciliMi ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {m.status === 'new' && (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="new" />
                        )}
                        <span className={`truncate text-sm ${m.status === 'new' ? 'font-semibold' : 'font-medium'}`}>
                          {m.name}
                        </span>
                        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                          {tarihKisa(m.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${konu.renk}`}>
                          {konu.etiket}
                        </Badge>
                        <span className="truncate text-[12px] text-muted-foreground">
                          {m.organization || m.email}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-[12px] text-muted-foreground">{m.message}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detay */}
        <div className="rounded-lg border border-border">
          {!acik ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center p-10 text-center">
              <Mail className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Pick a message on the left to read it.
              </p>
            </div>
          ) : (
            <article className="flex h-full flex-col">
              {/* Kunye */}
              <header className="border-b border-border p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[11px] ${(KONULAR[acik.topic] ?? KONULAR.general).renk}`}
                  >
                    {acik.topicLabel || (KONULAR[acik.topic] ?? KONULAR.general).etiket}
                  </Badge>
                  {acik.status !== 'new' && (
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {acik.status}
                    </Badge>
                  )}
                  {acik.gatewayStatus === 'failed' && (
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-[11px] text-red-600">
                      not e-mailed
                    </Badge>
                  )}
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                    {new Date(acik.createdAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{acik.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                  <a href={`mailto:${acik.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                    <Mail className="size-3.5" /> {acik.email}
                  </a>
                  {acik.organization && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="size-3.5" /> {acik.organization}
                    </span>
                  )}
                  {acik.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5" /> {acik.phone}
                    </span>
                  )}
                </div>
              </header>

              {/* Govde */}
              <div className="flex-1 space-y-5 p-5">
                {acik.fields && Object.keys(acik.fields).length > 0 && (
                  <dl className="grid gap-x-8 gap-y-2 rounded-md bg-muted/40 p-4 sm:grid-cols-2">
                    {Object.entries(acik.fields).map(([k, v]) => (
                      <div key={k} className="text-sm">
                        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{acik.message}</p>

                {acik.sourceUrl && (
                  <a
                    href={acik.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
                  >
                    <Link2 className="size-3.5" /> {acik.sourceUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              {/* Eylemler */}
              <footer className="flex flex-wrap gap-2 border-t border-border p-4">
                <Button size="sm" variant="outline" onClick={() => durumYaz(acik.id, 'read')}>
                  <MailOpen className="mr-1.5 size-3.5" /> Read
                </Button>
                <Button size="sm" variant="outline" onClick={() => durumYaz(acik.id, 'replied')}>
                  <CornerUpLeft className="mr-1.5 size-3.5" /> Replied
                </Button>
                <Button size="sm" variant="outline" onClick={() => durumYaz(acik.id, 'archived')}>
                  <Archive className="mr-1.5 size-3.5" /> Archive
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto text-red-600 hover:bg-red-500/10"
                  onClick={() => sil(acik.id)}
                >
                  <Trash2 className="mr-1.5 size-3.5" /> Delete
                </Button>
              </footer>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

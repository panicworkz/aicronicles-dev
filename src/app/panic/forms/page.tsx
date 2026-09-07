'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalAlt, onayla } from '@/components/ui/modal';
import { toast } from 'sonner';

/**
 * Iletisim formu — sekmeler ve alanlar.
 *
 * Once ikisi de kodda duruyordu; yeni bir sekme acmak ya da bir butce
 * araligini degistirmek yeniden derleme istiyordu.
 *
 * `key` adres parametresidir: /contact?type=advertising. Sabit
 * sayfalardaki baglantilar bu degeri kullaniyor, o yuzden degistirmek
 * o baglantilari kirar — ekran bunu yaninda yaziyor.
 */

/** Sekmeye baglanabilecek sabit sayfalar — elle yol yazdirmak yerine. */
const SAYFALAR = [
  { yol: '/about', ad: 'About' },
  { yol: '/advertise', ad: 'Advertise' },
  { yol: '/sponsor', ad: 'Sponsor' },
  { yol: '/terms-and-conditions', ad: 'Terms & conditions' },
  { yol: '/data-and-privacy', ad: 'Data & privacy' },
];

type Alan = {
  id?: number;
  name: string;
  label: string;
  type: string;
  hint: string | null;
  required: boolean;
  options: string[];
};

type Sekme = {
  id: number;
  key: string;
  no: string;
  title: string;
  summary: string | null;
  page: string | null;
  messageLabel: string;
  sortOrder: number;
  isActive: boolean;
  fields: Alan[];
};

export default function FormlarSayfasi() {
  const [sekmeler, setSekmeler] = useState<Sekme[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secili, setSecili] = useState<number | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  /* Yeni sekme penceresi — tarayicinin prompt()'u yerine. */
  const [yeniAcik, setYeniAcik] = useState(false);
  const [yeniAd, setYeniAd] = useState('');
  const [yeniAciklama, setYeniAciklama] = useState('');
  const [ekleniyor, setEkleniyor] = useState(false);

  const getir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const y = await fetch('/api/contact-form');
      const d = await y.json();
      if (d?.success) {
        const t = (d.tabs ?? []).map((x: any) => ({
          ...x,
          fields: (x.fields ?? []).map((f: any) => ({
            ...f,
            options: Array.isArray(f.options) ? f.options : [],
          })),
        }));
        setSekmeler(t);
        setSecili((s) => s ?? t[0]?.id ?? null);
      } else toast.error(d?.message || 'Form could not be loaded');
    } catch {
      toast.error('Form could not be loaded');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    getir();
  }, [getir]);

  const acik = sekmeler.find((s) => s.id === secili) ?? null;

  const guncelle = (yama: Partial<Sekme>) =>
    setSekmeler((m) => m.map((s) => (s.id === secili ? { ...s, ...yama } : s)));

  const alanGuncelle = (i: number, yama: Partial<Alan>) =>
    setSekmeler((m) =>
      m.map((s) =>
        s.id === secili
          ? { ...s, fields: s.fields.map((f, j) => (j === i ? { ...f, ...yama } : f)) }
          : s
      )
    );

  async function kaydet() {
    if (!acik) return;
    setKaydediliyor(true);
    try {
      const y = await fetch('/api/contact-form', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: acik.id,
          /* key ve no GONDERILMIYOR: ikisi de panelde duzenlenmiyor.
             key adres parametresi, no ise siradan uretiliyor
             (bkz. PATCH). Gonderilseydi ekrandaki eski bir deger
             sunucudakini geri yazabilirdi. */
          title: acik.title,
          summary: acik.summary,
          page: acik.page,
          messageLabel: acik.messageLabel,
          isActive: acik.isActive,
          fields: acik.fields,
        }),
      });
      const d = await y.json();
      if (d?.success) {
        toast.success('Saved — the live form updates on the next page load');
        getir();
      } else toast.error(d?.message || d?.error || 'Could not save', { duration: 8000 });
    } finally {
      setKaydediliyor(false);
    }
  }

  /* Yalnizca sekmenin adi soruluyor. Adres anahtari sunucuda
     basliktan uretiliyor (bkz. anahtarUret) — editorun "press" gibi
     bir dize dusunmesi gerekmiyordu. */
  async function sekmeEkle() {
    const title = yeniAd.trim();
    if (!title) return;
    setEkleniyor(true);
    try {
      const y = await fetch('/api/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary: yeniAciklama.trim() || null,
          messageLabel: 'Your message',
          fields: [],
        }),
      });
      const d = await y.json();
      if (d?.success) {
        toast.success(`“${title}” added`);
        setYeniAcik(false);
        setYeniAd('');
        setYeniAciklama('');
        await getir();
        setSecili(d.tab.id);
      } else toast.error(d?.message || d?.error || 'Could not add', { duration: 8000 });
    } finally {
      setEkleniyor(false);
    }
  }

  /** Sekmeyi bir sira yukari/asagi tasir ve hemen kaydeder.
      Once listede bir tutamac ikonu vardi ama hicbir seye bagli
      degildi: surukleneceini vaat edip hicbir sey yapmiyordu. */
  async function sekmeTasi(id: number, yon: -1 | 1) {
    const i = sekmeler.findIndex((s) => s.id === id);
    const j = i + yon;
    if (i < 0 || j < 0 || j >= sekmeler.length) return;
    const yeni = [...sekmeler];
    [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
    // Numaralar da kayiyor; sunucu da ayni sekilde yeniden yaziyor.
    setSekmeler(yeni.map((s, k) => ({ ...s, sortOrder: k, no: String(k + 1).padStart(2, "0") })));
    const y = await fetch("/api/contact-form", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: yeni.map((s) => s.id) }),
    });
    const d = await y.json();
    if (!d?.success) {
      toast.error(d?.message || "Order could not be saved");
      getir();
    }
  }

  /** Alani sekme icinde tasir; kaydetmek "Save tab" ile. */
  function alanTasi(i: number, yon: -1 | 1) {
    if (!acik) return;
    const j = i + yon;
    if (j < 0 || j >= acik.fields.length) return;
    const f = [...acik.fields];
    [f[i], f[j]] = [f[j], f[i]];
    guncelle({ fields: f });
  }

  async function sekmeSil(id: number) {
    const s = sekmeler.find((x) => x.id === id);
    /* Soru sayisi 0 olabiliyor; "0 question(s)" diye yazdirmak yerine
       o cumleyi hic kurmuyoruz. 1 ve digerleri de ayri. */
    const n = s?.fields.length ?? 0;
    const sorular =
      n === 0 ? '' : n === 1 ? 'Its one question goes with it, and t' : `Its ${n} questions go with it, and t`;
    const onay = await onayla({
      baslik: `Delete “${s?.title ?? 'this tab'}”?`,
      aciklama:
        `${sorular || 'T'}he tab disappears from the contact form. Messages already ` +
        `received are kept. This cannot be undone.`,
      onayYazisi: 'Delete tab',
      yikici: true,
    });
    if (!onay) return;
    const y = await fetch(`/api/contact-form?id=${id}`, { method: 'DELETE' });
    const d = await y.json();
    if (d?.success) {
      toast.success('Tab deleted');
      setSecili(null);
      getir();
    } else toast.error(d?.message || d?.error || 'Could not delete', { duration: 8000 });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ClipboardList className="size-6" /> Contact form
          </h1>
          <p className="text-sm text-muted-foreground">
            The tabs and fields on <span className="font-mono">/contact</span>. Messages
            arrive under <span className="font-mono">Messages</span>.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Bu projenin Button'i asChild desteklemiyor; baglantiyi
              dogrudan yaziyoruz. */}
          <a
            href="/contact"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm transition-colors hover:bg-muted"
          >
            <ExternalLink className="mr-1.5 size-3.5" /> View form
          </a>
          <Button size="sm" onClick={() => setYeniAcik(true)}>
            <Plus className="mr-1.5 size-3.5" /> New tab
          </Button>
        </div>
      </div>

      {yukleniyor ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
          {/* Sekme listesi */}
          <div className="overflow-hidden rounded-lg border border-border">
            <ul className="divide-y divide-border">
              {sekmeler.map((s, i) => (
                <li
                  key={s.id}
                  className={`flex items-center transition-colors ${
                    s.id === secili ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSecili(s.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3 text-left"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground">{s.no}</span>
                    <span className={`truncate text-sm ${s.isActive ? 'font-medium' : 'text-muted-foreground line-through'}`}>
                      {s.title}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                      {s.fields.length}
                    </span>
                  </button>
                  {/* Sira — sekmelerin formdaki sirasi. */}
                  <div className="flex shrink-0 flex-col pr-2">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => sekmeTasi(s.id, -1)}
                      className="text-muted-foreground disabled:opacity-25 hover:text-foreground"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={i === sekmeler.length - 1}
                      onClick={() => sekmeTasi(s.id, 1)}
                      className="text-muted-foreground disabled:opacity-25 hover:text-foreground"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Duzenleme */}
          <div className="rounded-lg border border-border">
            {!acik ? (
              <div className="flex min-h-[300px] items-center justify-center p-10 text-sm text-muted-foreground">
                Pick a tab on the left.
              </div>
            ) : (
              <div className="space-y-6 p-5">
                {/* Sekme bilgileri.
                    URL anahtari ve numara ARTIK INPUT DEGIL: ikisi de
                    editorun bilmesi gerekmeyen ic degerler. Numara
                    siradan uretiliyor, anahtar ise adres parametresi —
                    elle degistirilmesi statik sayfalardaki baglantilari
                    kirar. Anahtar asagida bilgi olarak duruyor. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      TAB NAME
                    </label>
                    <Input value={acik.title} onChange={(e) => guncelle({ title: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      DESCRIPTION — shown under the tab name
                    </label>
                    <Input value={acik.summary ?? ''} onChange={(e) => guncelle({ summary: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      QUESTION ABOVE THE MESSAGE BOX
                    </label>
                    <Input
                      value={acik.messageLabel}
                      onChange={(e) => guncelle({ messageLabel: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      WHICH PAGE SENDS PEOPLE HERE
                    </label>
                    <select
                      value={acik.page ?? ''}
                      onChange={(e) => guncelle({ page: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                    >
                      <option value="">— none —</option>
                      {SAYFALAR.map((x) => (
                        <option key={x.yol} value={x.yol}>
                          {x.ad}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Adres — bilgi, duzenlenecek bir alan degil. */}
                  <p className="sm:col-span-2 text-[12px] text-muted-foreground">
                    Opens at{' '}
                    <a
                      href={`/contact?type=${acik.key}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-foreground underline underline-offset-2"
                    >
                      /contact?type={acik.key}
                    </a>
                    . This address is fixed — the pages that link here use it.
                  </p>
                </div>

                {/* Alanlar */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Fields <span className="text-muted-foreground">({acik.fields.length})</span>
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        guncelle({
                          fields: [
                            ...acik.fields,
                            { name: '', label: '', type: 'text', hint: '', required: false, options: [] }, // ad kaydederken etiketten uretiliyor
                          ],
                        })
                      }
                    >
                      <Plus className="mr-1.5 size-3.5" /> Add field
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {acik.fields.map((f, i) => (
                      <div key={i} className="rounded-md border border-border p-3">
                        {/* Alan adi burada YOK: etiketten uretiliyor.
                            Editorun "general_category" gibi bir dize
                            yazmasi gerekmiyordu ve yanlis yazilinca
                            sessizce bozuluyordu. */}
                        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                          <Input
                            value={f.label}
                            onChange={(e) => alanGuncelle(i, { label: e.target.value })}
                            placeholder="Question shown to the visitor"
                          />
                          <select
                            value={f.type}
                            onChange={(e) => alanGuncelle(i, { type: e.target.value })}
                            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                          >
                            <option value="text">Free text</option>
                            <option value="select">Pick from a list</option>
                          </select>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={f.required}
                                onChange={(e) => alanGuncelle(i, { required: e.target.checked })}
                              />
                              Required
                            </label>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                aria-label="Move field up"
                                disabled={i === 0}
                                onClick={() => alanTasi(i, -1)}
                                className="text-muted-foreground disabled:opacity-25 hover:text-foreground"
                              >
                                <ChevronUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label="Move field down"
                                disabled={i === acik.fields.length - 1}
                                onClick={() => alanTasi(i, 1)}
                                className="text-muted-foreground disabled:opacity-25 hover:text-foreground"
                              >
                                <ChevronDown className="size-3.5" />
                              </button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() =>
                                guncelle({ fields: acik.fields.filter((_, j) => j !== i) })
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {f.type === 'select' ? (
                          <textarea
                            value={f.options.join('\n')}
                            onChange={(e) =>
                              alanGuncelle(i, {
                                options: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean),
                              })
                            }
                            rows={Math.max(3, f.options.length + 1)}
                            placeholder="One answer per line — the visitor picks one"
                            className="mt-3 w-full rounded-md border border-input bg-transparent p-2 text-[13px]"
                          />
                        ) : (
                          <Input
                            value={f.hint ?? ''}
                            onChange={(e) => alanGuncelle(i, { hint: e.target.value })}
                            placeholder="Hint inside the box (optional)"
                            className="mt-3"
                          />
                        )}
                      </div>
                    ))}
                    {acik.fields.length === 0 && (
                      <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                        No topic-specific fields. Name, company, email, phone and the message
                        box are always there.
                      </p>
                    )}
                  </div>
                </div>

                {/* Eylemler */}
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <Button onClick={kaydet} disabled={kaydediliyor}>
                    <Save className="mr-1.5 size-3.5" />
                    {kaydediliyor ? 'Saving…' : 'Save tab'}
                  </Button>
                  <Button variant="outline" onClick={() => guncelle({ isActive: !acik.isActive })}>
                    {acik.isActive ? (
                      <>
                        <EyeOff className="mr-1.5 size-3.5" /> Hide from form
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1.5 size-3.5" /> Show on form
                      </>
                    )}
                  </Button>
                  {!acik.isActive && (
                    <Badge variant="outline" className="text-[11px]">
                      hidden — save to apply
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    className="ml-auto text-red-600 hover:bg-red-500/10"
                    onClick={() => sekmeSil(acik.id)}
                  >
                    <Trash2 className="mr-1.5 size-3.5" /> Delete tab
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yeni sekme. Tek soru: adi. Gerisi acildiktan sonra
          duzenleniyor — pencerede on alan sormak yeni bir form
          demek olurdu. */}
      <Modal
        acik={yeniAcik}
        kapat={() => setYeniAcik(false)}
        baslik="New tab"
        aciklama="A new topic on the contact form. You can add its questions right after."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sekmeEkle();
          }}
        >
          <div className="space-y-4 px-5 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                TAB NAME
              </label>
              <Input
                value={yeniAd}
                onChange={(e) => setYeniAd(e.target.value)}
                placeholder="Press & media"
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                DESCRIPTION — optional, shown under the tab name
              </label>
              <Input
                value={yeniAciklama}
                onChange={(e) => setYeniAciklama(e.target.value)}
                placeholder="Interview requests, press enquiries and media kits."
                maxLength={400}
              />
            </div>
          </div>
          <ModalAlt>
            <Button type="button" variant="outline" onClick={() => setYeniAcik(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!yeniAd.trim() || ekleniyor}>
              {ekleniyor ? 'Adding…' : 'Add tab'}
            </Button>
          </ModalAlt>
        </form>
      </Modal>
    </div>
  );
}

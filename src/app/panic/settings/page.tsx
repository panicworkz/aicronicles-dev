'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, Globe, Loader2, ExternalLink, Type, Truck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontSecici } from '@/components/studio/FontSecici';
import { BOLGELER } from '@/lib/kargo';
import { toast } from 'sonner';
import { SITE, SITE_DOMAIN } from '@/lib/seo';

/**
 * Ayarlar.
 *
 * ONCEKI HALI TAMAMEN SAHTEYDI. "Save Settings" bir bildirim gosterip
 * hicbir sey kaydetmiyordu; proje adi ve alan adi duzenlenebilir
 * gorunuyor ama hicbir yere yazilmiyordu; "Enable Product Checkout"
 * anahtari da hicbir seye bagli degildi. Editor ayari degistirdigini
 * saniyordu — sipariş ekranlarindaki "Total Amount Paid" ile ayni
 * aile: panel olmayan bir seyi olmus gibi gosteriyordu.
 *
 * Simdi burada YALNIZCA gercekten calisan bir sey var: magazanin
 * disariya acik olup olmadigi. Degistirir degistirmez kaydediliyor
 * (ayri bir "kaydet" dugmesi yok — tek anahtar icin gereksiz ve
 * kaydedilmedigi halde kaydedildi sanmaya yol aciyordu).
 *
 * Okunan ama degistirilmeyen degerler (alan adi gibi) artik girdi
 * kutusu degil, duz yazi: duzenlenemiyorsa duzenlenebilir gorunmemeli.
 */
export default function AyarlarSayfasi() {
  const [magazaAcik, setMagazaAcik] = useState<boolean | null>(null);
  const [fontIkilisi, setFontIkilisi] = useState<string>('newsreader-inter');
  /* Kargo tarifesi metin olarak tutuluyor: kutuyu bosaltinca "0"
     olmasin, bos kalsin. Bos = "girilmedi", 0 = "bedava" — ikisi
     ayri sey ve sepette ayri gorunuyorlar. */
  const [tarife, setTarife] = useState<Record<string, string>>({ tr: '', avrupa: '', dunya: '' });
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const getir = useCallback(async () => {
    try {
      const y = await fetch('/api/settings');
      const d = await y.json();
      setMagazaAcik(Boolean(d?.settings?.magaza_acik));
      if (typeof d?.settings?.font_ikilisi === 'string') {
        setFontIkilisi(d.settings.font_ikilisi);
      }
      const k = d?.settings?.kargo_tarifesi;
      if (k && typeof k === 'object') {
        setTarife({
          tr: k.tr === null || k.tr === undefined ? '' : String(k.tr),
          avrupa: k.avrupa === null || k.avrupa === undefined ? '' : String(k.avrupa),
          dunya: k.dunya === null || k.dunya === undefined ? '' : String(k.dunya),
        });
      }
    } catch {
      toast.error('Settings could not be loaded');
      setMagazaAcik(false);
    }
  }, []);

  useEffect(() => {
    getir();
  }, [getir]);

  async function tarifeYaz() {
    setKaydediliyor(true);
    try {
      const y = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'kargo_tarifesi', value: tarife }),
      });
      const d = await y.json();
      if (!d?.success) throw new Error(d?.message);
      toast.success('Delivery charges saved');
    } catch {
      toast.error('Delivery charges could not be saved');
    } finally {
      setKaydediliyor(false);
    }
  }

  async function magazaYaz(yeni: boolean) {
    setKaydediliyor(true);
    /* Once ekranda degisiyor, sonra kaydediliyor: anahtar hemen tepki
       versin. Basarisiz olursa geri aliniyor. */
    setMagazaAcik(yeni);
    try {
      const y = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'magaza_acik', value: yeni }),
      });
      const d = await y.json();
      if (!d?.success) throw new Error(d?.message);
      toast.success(
        yeni
          ? 'The store is now open to everyone'
          : 'The store is closed — only signed-in staff can see it'
      );
    } catch {
      setMagazaAcik(!yeni);
      toast.error('That could not be saved');
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          What is switched on for this site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Store className="size-4 text-primary" />
            <span>The store</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-6 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Open the store to everyone
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                While this is off, <span className="font-mono">/store</span> answers 404
                for visitors, stays out of robots.txt and search, and is missing from the
                footer. You can still see it while signed in.
              </p>

              {magazaAcik === false && (
                /* Acmadan once yapilmasi gerekenler BURADA yaziyor:
                   anahtari cevirmek kolay, eksik birakilan bir sey
                   sahte urunleri ve bos sirket bilgilerini disariya
                   acar. */
                <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                  <li>
                    Before you open it: fill in the{' '}
                    <Link href="/panic/pages" className="underline">
                      seller and bank details
                    </Link>{' '}
                    marked <span className="font-mono">....</span> in the legal pages
                  </li>
                  <li>
                    Remove the demo products (their SKU starts with{' '}
                    <span className="font-mono">DEMO-</span>)
                  </li>
                  <li>Have the sales contract read by a lawyer</li>
                </ul>
              )}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(magazaAcik)}
              aria-label="Open the store to everyone"
              disabled={magazaAcik === null || kaydediliyor}
              onClick={() => magazaYaz(!magazaAcik)}
              className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-50 ${
                magazaAcik ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <div
                className={`size-5 rounded-full bg-background shadow-xs transition-transform ${
                  magazaAcik ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {magazaAcik === null && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Reading the current setting…
            </p>
          )}
        </CardContent>
      </Card>

      {/* KARGO TARIFESI.
          Neden burada: teslimat bedelinin siparis verilmeden ONCE
          gorunmesi AB ve BK'da zorunlu. Ucret girilmediginde sepet
          eski davranisa donuyor ("dispatch'ten once bildirilecek") —
          yani calisiyor ama o sart karsilanmiyor. Uyari asagida. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Truck className="size-4 text-primary" />
            <span>Delivery charges</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            One price per zone, in USD — the currency products are priced in.
            The basket shows it before the order is placed and adds it to the
            total. Leave a zone empty and that destination falls back to
            &ldquo;quoted before dispatch&rdquo;.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {BOLGELER.map((b) => (
              <div key={b.kod} className="space-y-1.5">
                <Label className="text-xs font-medium">{b.ad}</Label>
                <div className="flex items-center">
                  <span className="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted/60 px-2.5 font-mono text-xs text-muted-foreground">
                    $
                  </span>
                  <Input
                    inputMode="decimal"
                    placeholder="—"
                    value={tarife[b.kod]}
                    onChange={(e) => setTarife({ ...tarife, [b.kod]: e.target.value })}
                    className="h-9 rounded-l-none text-sm"
                  />
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {b.aciklama}
                </p>
              </div>
            ))}
          </div>

          {BOLGELER.some((b) => !tarife[b.kod].trim()) && (
            <p className="rounded-md border border-amber-400/60 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Zones left empty cannot show a delivery price at checkout. For
              buyers in the EU and the UK that price has to be shown before the
              order is placed, so leave them empty only while the store is
              closed.
            </p>
          )}

          <Button size="sm" onClick={tarifeYaz} disabled={kaydediliyor}>
            {kaydediliyor ? 'Saving…' : 'Save delivery charges'}
          </Button>
        </CardContent>
      </Card>

      {/* TIPOGRAFI — site geneli, yazi basina degil. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Type className="size-4 text-primary" />
            <span>Typography</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FontSecici
            secili={fontIkilisi}
            onSec={async (id) => {
              const y = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'font_ikilisi', value: id }),
              });
              const d = await y.json();
              if (!d?.success) throw new Error(d?.message);
              setFontIkilisi(id);
              /* Yayin tarafi sunucuda basiliyor: sekmeyi yenilemeden
                 degisiklik gorunmuyor. Bunu soylemek, "kaydettim ama
                 bir sey olmadi" dedirtmemek icin. */
              toast.message('Reload the site to see the new typography.');
            }}
          />
        </CardContent>
      </Card>

      {/* Okunan, degistirilmeyen degerler. Girdi kutusu DEGIL: bunlar
          ortam degiskeninden geliyor ve panelden degistirilemiyor;
          kutu icinde gostermek duzenlenebilir sanmaya yol aciyordu. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="size-4 text-primary" />
            <span>Where this site lives</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="text-xs">
            <div className="flex items-center justify-between border-b border-border py-2.5">
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-mono">
                <a
                  href={SITE}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {SITE_DOMAIN} <ExternalLink className="size-3" />
                </a>
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-muted-foreground">Set in</dt>
              <dd className="font-mono text-muted-foreground">
                NEXT_PUBLIC_SITE_URL
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

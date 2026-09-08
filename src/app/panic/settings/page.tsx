'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, Globe, Loader2, ExternalLink, Type } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FontSecici } from '@/components/studio/FontSecici';
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
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const getir = useCallback(async () => {
    try {
      const y = await fetch('/api/settings');
      const d = await y.json();
      setMagazaAcik(Boolean(d?.settings?.magaza_acik));
      if (typeof d?.settings?.font_ikilisi === 'string') {
        setFontIkilisi(d.settings.font_ikilisi);
      }
    } catch {
      toast.error('Settings could not be loaded');
      setMagazaAcik(false);
    }
  }, []);

  useEffect(() => {
    getir();
  }, [getir]);

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

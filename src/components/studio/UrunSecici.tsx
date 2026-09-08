'use client';

import React from 'react';
import { Modal, ModalAlt } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * URUN KARTI BLOGU icin urun secme penceresi.
 *
 * Yaziya giden sey yalnizca bir isaret:
 *   <div data-blok="urun" data-urun-id="12"></div>
 * Fiyat, ad, stok ve gorsel okuma aninda veriden geliyor
 * (lib/urun-blogu.ts). O yuzden burada yazara gosterilen sey de
 * gercek urun listesi — elle kod yazdirmak yerine seciyor.
 *
 * NEDEN KIMLIK, NEDEN FIYAT DEGIL: fiyati yaziya gomseydik urun
 * zamlandiginda yazi yalan soylemeye baslardi ve bunu kimse fark
 * etmezdi.
 */

type Urun = {
  id: number;
  title: string;
  slug: string;
  price: string | number | null;
  currency: string | null;
  status: string;
  featuredImageUrl: string | null;
};

export function UrunSecici({
  acik,
  kapat,
  sec,
}: {
  acik: boolean;
  kapat: () => void;
  /* Yalnizca kimlik degil URUNUN KENDISI donuyor: onizleme, kayit
     beklemeden kartin bir onizlemesini cizebilsin diye ad, fiyat ve
     gorsele de ihtiyaci var. */
  sec: (urun: Urun) => void;
}) {
  const [urunler, setUrunler] = React.useState<Urun[]>([]);
  const [arama, setArama] = React.useState('');
  const [yukleniyor, setYukleniyor] = React.useState(false);
  const [hata, setHata] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!acik) return;
    let iptal = false;

    setYukleniyor(true);
    setHata(null);

    /* Yalnizca YAYINDAKI urunler: taslak bir urunu yaziya koymak,
       okurun tiklayip bos sayfa gormesi demek. */
    const adres = `/api/products?status=published&limit=100${
      arama ? `&search=${encodeURIComponent(arama)}` : ''
    }`;

    /* Yazarken her harfte istek atmamak icin kisa bir bekleme. */
    const zamanlayici = setTimeout(async () => {
      try {
        const c = await fetch(adres);
        const v = await c.json();
        if (iptal) return;
        if (v.success) setUrunler(v.products ?? []);
        else setHata(v.error || 'Urunler alinamadi');
      } catch {
        if (!iptal) setHata('Urunler alinamadi');
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    }, 250);

    return () => {
      iptal = true;
      clearTimeout(zamanlayici);
    };
  }, [acik, arama]);

  return (
    <Modal acik={acik} kapat={kapat} baslik="Urun karti ekle" genislik="max-w-lg"
      aciklama="Yaziya urunun kimligi gomuluyor; fiyat ve stok her acilista veriden okunuyor.">
      <div className="space-y-3 p-5">
        <Input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Urun adi, slug ya da SKU"
          autoFocus
        />

        <div className="max-h-[46vh] overflow-y-auto rounded-md border border-border">
          {yukleniyor && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Yukleniyor…</p>
          )}

          {!yukleniyor && hata && (
            <p className="px-4 py-6 text-center text-sm text-destructive">{hata}</p>
          )}

          {/* Bos liste sessiz birakilmiyor: aramanin sonucsuz kalmasi
              ile magazada hic urun olmamasi ayri seyler. */}
          {!yukleniyor && !hata && urunler.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {arama ? 'Bu aramaya uyan yayinda urun yok.' : 'Yayinda urun yok.'}
            </p>
          )}

          {!yukleniyor &&
            !hata &&
            urunler.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  sec(u);
                  kapat();
                }}
                className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/60"
              >
                {u.featuredImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.featuredImageUrl}
                    alt=""
                    className="size-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="size-10 shrink-0 rounded bg-muted" />
                )}
                {/* min-w-0: yoksa uzun urun adi satiri tasirip
                    fiyati ekrandan atiyor. */}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{u.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">/{u.slug}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {u.price} {u.currency ?? 'USD'}
                </span>
              </button>
            ))}
        </div>
      </div>

      <ModalAlt>
        <Button type="button" variant="outline" onClick={kapat}>
          Vazgec
        </Button>
      </ModalAlt>
    </Modal>
  );
}

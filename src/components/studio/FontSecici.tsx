'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { FONT_IKILILERI, type FontIkilisi } from '@/lib/fontlar';
import { toast } from 'sonner';

/**
 * SITE GENELI TIPOGRAFI SECIMI.
 *
 * Yazar paragraf paragraf font secmiyor — tipografi bir TASARIM
 * karari ve yeri burasi. Serbest font secici dergiyi yazidan yaziya
 * dagitirdi.
 *
 * PROVA ALFABE DEGIL, GERCEK BILESENLER.
 * "AaBbCc" gostermek hicbir sey anlatmiyor: bir ikilinin nerede
 * kirildigi ancak manset, spot, govde, tarih satiri ve dugme yan yana
 * durunca gorunuyor. Yuksek kontrastli bir baslik fontu manşette iyi,
 * kucuk metinde okunmaz olabilir; genis bir govde fontu menuyu bir
 * satir kaydirabilir. Prova bunlarin hepsini ayni anda gosteriyor.
 *
 * PROVA FONTLARI TALEP UZERINE INIYOR: on ikilinin yirmi ailesi bu
 * ekran acilir acilmaz inseydi panel megabaytlarca font indirirdi.
 * Her kart yalnizca gorunur oldugunda kendi @font-face'ini basiyor.
 */

/* Yayin tarafiyla ayni unicode araliklari (bkz. lib/fontlar.ts):
   Turkce harfler latin-ext'te ve prova "ŞİLE" gibi bir metin
   gosterdiginde o dilim gerekiyor. */
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

function provaCss(ikili: FontIkilisi): string {
  const yuz = (ad: string, dosya: string, agirlik: string, aralik: string) =>
    `@font-face{font-family:"${ad}";src:url("/fonts/${dosya}") format("woff2");` +
    `font-weight:${agirlik};font-style:normal;font-display:swap;unicode-range:${aralik}}`;

  const aile = (a: FontIkilisi['baslik']) =>
    yuz(a.ad, a.dosya, a.agirlik, LATIN) +
    yuz(a.ad, a.dosya.replace(/\.woff2$/, '-ext.woff2'), a.agirlik, LATIN_EXT);

  return aile(ikili.baslik) + (ikili.govde.ad === ikili.baslik.ad ? '' : aile(ikili.govde));
}

function Prova({ ikili }: { ikili: FontIkilisi }) {
  const baslik = `"${ikili.baslik.ad}", Georgia, serif`;
  const govde = `"${ikili.govde.ad}", system-ui, sans-serif`;

  return (
    <div className="rounded-md border border-border bg-[#faf9f7] px-4 py-3.5 text-[#15171a]">
      {/* Kicker ve tarih satiri mono ile: o aile degismiyor, ama
          ikilinin yaninda nasil durdugu gorunmeli. */}
      <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#6b7280]">
        § Personal Finance · 02 Jul 2026 · 15 min
      </div>

      <div style={{ fontFamily: baslik }} className="text-[22px] leading-[1.15] tracking-tight">
        How To Build Wealth in Your 20s
      </div>

      <div style={{ fontFamily: govde }} className="mt-2 text-[12.5px] leading-[1.55] text-[#3d4148]">
        Saving money fast doesn’t require a six-figure salary — it requires a
        system. Şile, İstanbul & Miami.
      </div>

      <div className="mt-3 flex items-center gap-2">
        {/* Dugme ve menu: bir ikilinin en cok burada kirildigini
            gordugumuz yer — genis bir govde fontu satiri kaydiriyor. */}
        <span
          style={{ fontFamily: govde }}
          className="rounded-full bg-[#15171a] px-3 py-1 text-[11px] text-white"
        >
          Subscribe
        </span>
        <span style={{ fontFamily: govde }} className="text-[11px] text-[#6b7280]">
          Personal Finance · Career · AI &amp; Tech
        </span>
      </div>
    </div>
  );
}

export function FontSecici({
  secili,
  onSec,
}: {
  secili: string;
  onSec: (id: string) => Promise<void> | void;
}) {
  const [kaydedilen, setKaydedilen] = React.useState<string | null>(null);
  const [gorunur, setGorunur] = React.useState<Set<string>>(new Set([secili]));
  const kapRef = React.useRef<HTMLDivElement>(null);

  /* Kart ekrana girince fontunu yukle. Hepsini birden yuklemek
     panelde birkac megabayt indirmek demekti. */
  React.useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;
    const gozlemci = new IntersectionObserver(
      (girisler) => {
        setGorunur((onceki) => {
          const yeni = new Set(onceki);
          for (const g of girisler) {
            if (g.isIntersecting) yeni.add((g.target as HTMLElement).dataset.ikili!);
          }
          return yeni;
        });
      },
      { rootMargin: '200px' }
    );
    for (const k of Array.from(kap.querySelectorAll('[data-ikili]'))) gozlemci.observe(k);
    return () => gozlemci.disconnect();
  }, []);

  const sec = async (id: string) => {
    setKaydedilen(id);
    try {
      await onSec(id);
      toast.success('Typography updated');
    } catch {
      toast.error('Could not save typography');
    } finally {
      setKaydedilen(null);
    }
  };

  return (
    <div ref={kapRef} className="space-y-3">
      {/* Yalnizca gorunur kartlarin @font-face'i basiliyor. */}
      <style
        dangerouslySetInnerHTML={{
          __html: FONT_IKILILERI.filter((i) => gorunur.has(i.id)).map(provaCss).join(''),
        }}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {FONT_IKILILERI.map((ikili) => {
          const aktif = ikili.id === secili;
          return (
            <button
              key={ikili.id}
              type="button"
              data-ikili={ikili.id}
              onClick={() => !aktif && sec(ikili.id)}
              disabled={kaydedilen !== null}
              className={`rounded-lg border p-3 text-left transition ${
                aktif
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border hover:border-primary/50'
              } ${kaydedilen !== null && !aktif ? 'opacity-60' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{ikili.ad}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {ikili.aciklama}
                  </div>
                </div>
                {kaydedilen === ikili.id ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                ) : aktif ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-primary">
                    <Check className="size-3.5" /> In use
                  </span>
                ) : null}
              </div>

              {gorunur.has(ikili.id) ? (
                <Prova ikili={ikili} />
              ) : (
                /* Yer tutucu: kart yuksekligi degismesin, liste
                   kaydirilirken ziplamasin. */
                <div className="h-[132px] rounded-md border border-border bg-muted/30" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Only the selected pairing is downloaded by readers. Headings, body text,
        buttons and navigation all follow the choice — the monospace face
        (kickers, captions, dates) stays the same, because that is the
        publication’s voice rather than its typography.
      </p>
    </div>
  );
}

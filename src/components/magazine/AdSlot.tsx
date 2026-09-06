import React from "react";
import type { Baglam } from "@/lib/ads";
import AdBoard from "./AdBoard";

/**
 * Reklam alanlari.
 *
 * Bu dosya artik yalnizca OLCUYU biliyor; secimi ve afisi AdBoard
 * istemcide yapiyor. Onceden afis burada seciliyor ve SVG'si sayfaya
 * gomuluyordu — ana sayfanin HTML'inin yuzde 39'u reklamdi ve sayfayi
 * onbellege almak reklam donusunu de dondururdu. Gerekcesi AdBoard'un
 * basinda yazili.
 *
 * PostCard'in icindeyken sorun cikariyordu: arama ekrani (istemci
 * bileseni) PostCard'i iceri aliyor ve reklam kodu veritabanina
 * dokundugu icin sunucuya ait kod istemci paketine suruklenip derlemeyi
 * kiriyordu. Ayri modulde durunca bu bag kopuyor.
 */

/**
 * Ev olculeri.
 *
 * IAB'nin evrensel olculerini (970x250, 728x90...) kullanmiyoruz: onlar
 * programatik borsalar icin, bizse dogrudan yer veriyoruz. Sayfanin 12
 * kolonluk izgarasina oturmayan bir afis her zaman yamanmis duruyordu —
 * 970'lik billboard 1440'lik alanin ortasinda 235'er piksel bosluk
 * birakiyordu.
 *
 * Olculer artik SABIT PIKSEL DEGIL, ORAN. Afisler SVG oldugu icin kayipsiz
 * olcekleniyor; alan kabini her zaman tam dolduruyor, her ekran
 * genisliginde bosluksuz. Referans olculer afisi tasarlarken kullanilan
 * tuval; oran onlardan cikiyor.
 */
export type AdFormat = "measure" | "feature" | "panel" | "rail";

const AD_SPECS: Record<AdFormat, { w: number; h: number; note: string }> = {
  /* Tam icerik genisligi — ana sayfa ve kategori bolum aralari */
  measure: { w: 1440, h: 200, note: "MEASURE 1440 × 200" },
  /* Uc kolonun ikisi ve yazi govdesi — kap ~940 */
  feature: { w: 940, h: 180, note: "FEATURE 940 × 180" },
  /* Ana sayfa yan kolonu — kap ~511 */
  panel: { w: 511, h: 300, note: "PANEL 511 × 300" },
  /* Kenar rayi — kap ~387 */
  rail: { w: 387, h: 540, note: "RAIL 387 × 540" },
};

export function AdSlot({
  format = "feature",
  label = "Advertisement",
  placement,
  baglam,
}: {
  format?: AdFormat;
  label?: string;
  /** CMS yerlesim adi — verilmezse `format` kullanilir */
  placement?: string;
  /** Sayfanin konusu; hedeflenmis reklamlar buna gore seciliyor ve
      olay kaydinda saklaniyor. Verilmezse yalnizca hedefsiz reklamlar. */
  baglam?: Baglam;
}) {
  const spec = AD_SPECS[format];
  return (
    <AdBoard
      placement={placement ?? format}
      baglam={baglam}
      label={label}
      /* Alanda yayinda reklam yoksa — hic tanimlanmamis ya da takvimi
         dolmus — gri bir yer tutucu yerine kendi davetimiz giriyor.
         Yer tutucu hicbir sey kazandirmiyordu; bu afis ziyaretciyi
         /advertise sayfasina gonderiyor, yani bos alan satis yapiyor. */
      yedekAfis={`/media/house-${format}.svg`}
      en={spec.w}
      boy={spec.h}
    />
  );
}

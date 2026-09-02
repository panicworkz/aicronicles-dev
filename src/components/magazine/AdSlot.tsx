import React from "react";
import Link from "next/link";
import { alaniDoldur, type Baglam } from "@/lib/ads";
import { gomulecekSvg } from "@/lib/inlineSvg";
import AdTracker from "./AdTracker";

/**
 * Reklam alanlari — yalnizca sunucuda.
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

/**
 * Reklam alani.
 *
 * Yayini kendisi cekiyor: alan adini (`size`) yerlesim adi olarak kabul
 * edip CMS'te o yerlesime tanimli, tarihi gecerli ve aktif reklamlardan
 * birini basiyor. Boylece sayfalarda cagri sekli degismiyor —
 * <AdSlot size="billboard" /> yeterli.
 *
 * `creative` elle verilirse o oncelikli; ozel bir yerlesim gerektiginde
 * kullanilabilir. Hicbir reklam yoksa olculeri belli, editoryel dile
 * uygun bir yer tutucu gosteriliyor.
 */
export async function AdSlot({
  format = "feature",
  label = "Advertisement",
  creative,
  href,
  placement,
  baglam,
}: {
  format?: AdFormat;
  label?: string;
  creative?: { imageUrl?: string | null; alt?: string | null } | null;
  href?: string | null;
  /** CMS yerlesim adi — verilmezse `format` kullanilir */
  placement?: string;
  /** Sayfanin konusu; hedeflenmis reklamlar buna gore seciliyor ve
      olay kaydinda saklaniyor. Verilmezse yalnizca hedefsiz reklamlar. */
  baglam?: Baglam;
}) {
  const spec = AD_SPECS[format];

  // Elle verilmediyse CMS'ten al
  const cmsReklami = creative?.imageUrl ? null : await alaniDoldur(placement ?? format, baglam);

  const gorsel = creative?.imageUrl
    ? { imageUrl: creative.imageUrl, alt: creative.alt ?? null }
    : cmsReklami
      ? { imageUrl: cmsReklami.imageUrl, alt: cmsReklami.alt }
      : null;
  const hedef = href ?? cmsReklami?.targetUrl ?? null;

  /* Alanda yayinda reklam yoksa — hic tanimlanmamis ya da takvimi dolmus —
     gri bir yer tutucu yerine kendi davetimiz giriyor. Yer tutucu hicbir
     sey kazandirmiyordu; bu afis ziyaretciyi /advertise sayfasina
     gonderiyor, yani bos alan satis yapiyor. */
  const evReklami = !gorsel;
  const adres = gorsel ? gorsel.imageUrl : `/media/house-${format}.svg`;
  const altMetin = gorsel
    ? gorsel.alt || label
    : "This space is available — advertise on Fabelo";

  /* Afisi sayfaya GOMUYORUZ, <img> ile basmiyoruz.
     Bir <img> icindeki SVG'de bilesik katman yoktur: tarayici her karede
     goruntunun tamamini islemcide yeniden tarar. Gomulu SVG'de
     transform/opacity animasyonlari GPU'ya gidiyor. Dosya okunamazsa
     <img>'e duserek calismaya devam ediyoruz. */
  const gomulu = await gomulecekSvg(adres);

  const body = gomulu ? (
    <div
      role="img"
      aria-label={altMetin}
      className="ad-svg size-full"
      dangerouslySetInnerHTML={{ __html: gomulu }}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={adres} alt={altMetin} className="size-full object-cover" />
  );

  return (
    /* Alan, ilanin GERCEK olcusunde. Once w-full idi: 1440px'lik bir
       cerceve icinde 970px'lik afis duruyordu ve iki yanda 235'er piksel
       bos krem kaliyordu — ucuz bir kutu gibi gorunuyordu. Artik cerceve
       ilanin kendi genisligini asmiyor, dar ekranda oranini koruyarak
       kuculuyor. */
    <aside className="w-full" aria-label={label}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="folio" style={{ color: "var(--ink-3)" }}>
          {evReklami ? "AVAILABLE SPACE" : "ADVERTISEMENT"}
        </span>
        <span className="flex-1 rule" />
      </div>
      <div
        className="grid w-full place-items-center overflow-hidden"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          aspectRatio: `${spec.w} / ${spec.h}`,
          /* Ekran disindaki reklam hic islenmesin.
             Afisler animasyonlu SVG; bir <img> icindeki SVG her karede
             yeniden taranir ve bu sayfa disina ciktiginda da surer.
             content-visibility sayesinde tarayici gorunmeyen alani
             tamamen atliyor: dort reklam alani olsa da yalnizca ekranda
             olan islemci harciyor.
             contain-intrinsic-size tam olcuyu veriyor, boylece kaydirma
             sirasinda sayfa ziplamiyor. */
          contentVisibility: "auto",
          containIntrinsicSize: `${spec.w}px ${spec.h}px`,
        }}
      >
        {cmsReklami && hedef ? (
          // CMS reklami: gosterim ve tiklama sayiliyor
          <AdTracker
            id={cmsReklami.id}
            href={hedef}
            baglam={baglam}
            className="grid size-full place-items-center"
          >
            {body}
          </AdTracker>
        ) : hedef && gorsel ? (
          <a href={hedef} target="_blank" rel="noopener noreferrer sponsored" className="grid size-full place-items-center">
            {body}
          </a>
        ) : evReklami ? (
          /* Kendi sayfamiz: yeni sekme yok, sayac yok */
          <Link href="/advertise" className="grid size-full place-items-center">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>
    </aside>
  );
}

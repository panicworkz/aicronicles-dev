import React from "react";
import { alaniDoldur } from "@/lib/ads";
import AdTracker from "./AdTracker";

/**
 * Reklam alanlari — yalnizca sunucuda.
 *
 * PostCard'in icindeyken sorun cikariyordu: arama ekrani (istemci
 * bileseni) PostCard'i iceri aliyor ve reklam kodu veritabanina
 * dokundugu icin sunucuya ait kod istemci paketine suruklenip derlemeyi
 * kiriyordu. Ayri modulde durunca bu bag kopuyor.
 */

export type AdSize = "billboard" | "leaderboard" | "skyscraper" | "inread" | "rectangle";

const AD_SPECS: Record<AdSize, { w: number; h: number; note: string }> = {
  billboard: { w: 970, h: 250, note: "970 × 250" },
  leaderboard: { w: 728, h: 90, note: "728 × 90" },
  skyscraper: { w: 300, h: 600, note: "300 × 600" },
  rectangle: { w: 300, h: 250, note: "300 × 250" },
  inread: { w: 640, h: 200, note: "IN-READ" },
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
  size = "leaderboard",
  label = "Advertisement",
  creative,
  href,
  placement,
}: {
  size?: AdSize;
  label?: string;
  creative?: { imageUrl?: string | null; alt?: string | null } | null;
  href?: string | null;
  /** CMS yerlesim adi — verilmezse `size` kullanilir */
  placement?: string;
}) {
  const spec = AD_SPECS[size];

  // Elle verilmediyse CMS'ten al
  const cmsReklami = creative?.imageUrl ? null : await alaniDoldur(placement ?? size);

  const gorsel = creative?.imageUrl
    ? { imageUrl: creative.imageUrl, alt: creative.alt ?? null }
    : cmsReklami
      ? { imageUrl: cmsReklami.imageUrl, alt: cmsReklami.alt }
      : null;
  const hedef = href ?? cmsReklami?.targetUrl ?? null;

  const body = gorsel ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={gorsel.imageUrl} alt={gorsel.alt || label} className="size-full object-cover" />
  ) : (
    <span className="folio" style={{ color: "var(--ink-3)" }}>
      {label.toUpperCase()} · {spec.note}
    </span>
  );

  return (
    /* Alan, ilanin GERCEK olcusunde. Once w-full idi: 1440px'lik bir
       cerceve icinde 970px'lik afis duruyordu ve iki yanda 235'er piksel
       bos krem kaliyordu — ucuz bir kutu gibi gorunuyordu. Artik cerceve
       ilanin kendi genisligini asmiyor, dar ekranda oranini koruyarak
       kuculuyor. */
    <aside className="mx-auto w-full" style={{ maxWidth: spec.w }} aria-label={label}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="folio" style={{ color: "var(--ink-3)" }}>
          ADVERTISEMENT
        </span>
        <span className="flex-1 rule" />
      </div>
      <div
        className="grid w-full place-items-center overflow-hidden"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          aspectRatio: `${spec.w} / ${spec.h}`,
        }}
      >
        {cmsReklami && hedef ? (
          // CMS reklami: gosterim ve tiklama sayiliyor
          <AdTracker id={cmsReklami.id} href={hedef} className="grid size-full place-items-center">
            {body}
          </AdTracker>
        ) : hedef && gorsel ? (
          <a href={hedef} target="_blank" rel="noopener noreferrer sponsored" className="grid size-full place-items-center">
            {body}
          </a>
        ) : (
          body
        )}
      </div>
    </aside>
  );
}

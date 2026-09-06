"use client";

import React, { useEffect, useState } from "react";
import AdTracker from "./AdTracker";
import type { Baglam } from "@/lib/ads";

type Secim = { id: number; imageUrl: string; alt: string | null; targetUrl: string } | null;

/**
 * Reklam alani — cerceve sunucudan, afis istemciden.
 *
 * NEDEN BOYLE
 * Afis once sunucuda seciliyor ve SVG'si sayfaya GOMULUYORDU. Ana
 * sayfanin HTML'i 1,09 MB'ti ve bunun 425 KB'i (yuzde 39) reklamdi;
 * ayni afis her istekte yeniden gonderiliyordu. Ustelik sayfayi
 * onbellege almak reklami de dondururdu — bir yuvaya ikinci kampanya
 * girdigi gun onbellek penceresindeki herkes ayni reklami gorurdu.
 *
 * Simdi HTML yalnizca olculeri belli bos cerceveyi tasiyor. Secim her
 * ziyaretci icin ayri yapiliyor, afis dosyasi ise statik: kenarda
 * onbellekleniyor, ikinci sayfada tekrar inmiyor. Buyuk yayincilarin
 * yaptigi da bu.
 *
 * Bu bilesen "use client" ama Next onu ILK HTML'e de basiyor; yani
 * cerceve ve olcusu sunucudan geliyor, yalnizca afis sonradan
 * dusuyor. Sayfa bu yuzden ziplamiyor.
 *
 * AFIS YINE GOMULU BASILIYOR, <img> ile degil. Bir <img> icindeki
 * SVG'de bilesik katman yoktur: tarayici her karede goruntunun
 * tamamini islemcide yeniden tarar. Bu afisler animasyonlu; gomulu
 * olunca transform ve opacity GPU'ya gidiyor.
 */
export default function AdBoard({
  placement,
  baglam,
  label,
  yedekAfis,
  en,
  boy,
}: {
  placement: string;
  baglam?: Baglam;
  label: string;
  /** Alanda reklam yoksa basilacak kendi davetimiz. */
  yedekAfis: string;
  en: number;
  boy: number;
}) {
  const [secim, setSecim] = useState<Secim | undefined>(undefined);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;
    const p = new URLSearchParams({ placement });
    if (baglam?.tur) p.set("tur", baglam.tur);
    if (baglam?.slug) p.set("slug", baglam.slug);

    fetch(`/api/ads/pick?${p}`, { cache: "no-store" })
      .then((y) => (y.ok ? y.json() : null))
      .then((d: Secim) => !iptal && setSecim(d ?? null))
      .catch(() => !iptal && setSecim(null));
    return () => {
      iptal = true;
    };
  }, [placement, baglam?.tur, baglam?.slug]);

  /* Afis dosyasini metin olarak al. Alinamazsa <img>'e duser —
     animasyon islemcide calisir ama reklam yine gorunur. */
  useEffect(() => {
    if (secim === undefined) return;
    const adres = secim ? secim.imageUrl : yedekAfis;
    let iptal = false;
    fetch(adres)
      .then((y) => (y.ok ? y.text() : null))
      .then((t) => {
        if (!iptal && t && t.trimStart().startsWith("<svg")) setSvg(t);
      })
      .catch(() => {});
    return () => {
      iptal = true;
    };
  }, [secim, yedekAfis]);

  const evReklami = secim === null;
  const adres = secim ? secim.imageUrl : yedekAfis;
  const altMetin = secim
    ? secim.alt || label
    : "This space is available — advertise on Fabelo";

  const govde =
    secim === undefined ? null : svg ? (
      <div
        role="img"
        aria-label={altMetin}
        className="ad-svg size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={adres} alt={altMetin} className="size-full object-cover" />
    );

  const icerik =
    govde === null ? null : evReklami ? (
      /* Kendi sayfamiz: yeni sekme yok, sayac yok. */
      <a href="/advertise" className="grid size-full place-items-center">
        {govde}
      </a>
    ) : (
      <AdTracker
        id={secim!.id}
        href={secim!.targetUrl}
        baglam={baglam}
        className="grid size-full place-items-center"
      >
        {govde}
      </AdTracker>
    );

  return (
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
          aspectRatio: `${en} / ${boy}`,
          /* Ekran disindaki reklam hic islenmesin. Afisler animasyonlu
             SVG; gorunmeyen alani tarayici tamamen atliyor.
             contain-intrinsic-size tam olcuyu veriyor, boylece
             kaydirma sirasinda sayfa ziplamiyor. */
          contentVisibility: "auto",
          containIntrinsicSize: `${en}px ${boy}px`,
        }}
      >
        {icerik}
      </div>
    </aside>
  );
}

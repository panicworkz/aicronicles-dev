"use client";

import React, { useEffect, useRef } from "react";

/**
 * Reklam gosterim ve tiklama sayaci.
 *
 * Gosterim, alan gercekten ekrana girdiginde sayiliyor — sayfanin en
 * altindaki bir reklam, okuyucu oraya inmeden gosterilmis sayilmamali.
 * Her alan icin en fazla bir kez.
 *
 * Tiklama sayaci sendBeacon kullaniyor: sayfa reklamverenin adresine
 * giderken tarayici normal bir istegi yarida keserdi.
 */
export default function AdTracker({
  id,
  href,
  children,
  className,
  baglam,
}: {
  id: number;
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Sayfanin konusu — olay kaydina yaziliyor ki hangi baglamdan
      geldigi sonradan ayirt edilebilsin. */
  baglam?: { tur: string; slug?: string | null };
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const sayildi = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const gozlemci = new IntersectionObserver(
      (girisler) => {
        for (const g of girisler) {
          if (!g.isIntersecting || sayildi.current) continue;
          sayildi.current = true;
          gozlemci.disconnect();
          fetch(`/api/ads/${id}/impression`, {
            method: "POST",
            keepalive: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: location.pathname,
              contextType: baglam?.tur ?? null,
              contextSlug: baglam?.slug ?? null,
            }),
          }).catch(() => {});
        }
      },
      // Yarisi gorununce say — kenardan gecen bir alan gosterim sayilmasin
      { threshold: 0.5 }
    );

    gozlemci.observe(el);
    return () => gozlemci.disconnect();
  }, [id, baglam?.tur, baglam?.slug]);

  const tiklandi = () => {
    try {
      /* sendBeacon: sayfa reklamverene giderken normal bir istek
         yarida kesilirdi. Baglam da beraber gidiyor. */
      navigator.sendBeacon?.(
        `/api/ads/${id}/click`,
        new Blob(
          [JSON.stringify({
            path: location.pathname,
            contextType: baglam?.tur ?? null,
            contextSlug: baglam?.slug ?? null,
          })],
          { type: "application/json" }
        )
      );
    } catch {
      // Sayac tutulamazsa reklamverene gidis engellenmesin
    }
  };

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={tiklandi}
      className={className}
    >
      {children}
    </a>
  );
}

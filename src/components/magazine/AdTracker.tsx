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
}: {
  id: number;
  href: string;
  children: React.ReactNode;
  className?: string;
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
          fetch(`/api/ads/${id}/impression`, { method: "POST", keepalive: true }).catch(() => {});
        }
      },
      // Yarisi gorununce say — kenardan gecen bir alan gosterim sayilmasin
      { threshold: 0.5 }
    );

    gozlemci.observe(el);
    return () => gozlemci.disconnect();
  }, [id]);

  const tiklandi = () => {
    try {
      navigator.sendBeacon?.(`/api/ads/${id}/click`);
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

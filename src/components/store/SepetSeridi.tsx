"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSepet } from "@/components/store/SepetSaglayici";
import { fiyat } from "@/lib/magaza";

/**
 * Sepet seridi — magaza sayfalarinin tepesinde.
 *
 * BU YOKTU VE SEPET KAYBOLUYORDU. Urun sayfasinda "Add to basket"a
 * basinca dugmenin altinda kucuk bir baglanti cikiyordu; okur baska
 * bir sayfaya gecince o baglanti da gidiyordu ve sepete ulasmanin
 * hicbir yolu kalmiyordu — adresi elle yazmak disinda. Dergi basliginda
 * da sepet yok, cunku o baslik yayin tarafina ait.
 *
 * Serit yalnizca sepette bir sey VARKEN gorunuyor: bos sepet icin
 * kalici bir cubuk tutmak, olmayan bir seyi surekli hatirlatmak olurdu.
 *
 * Odeme sayfasinda da gizleniyor; okur zaten oradayken "sepete git"
 * demek anlamsiz.
 */
export function SepetSeridi() {
  const { toplamAdet, araToplam, paraBirimi, hazir } = useSepet();
  const yol = usePathname();

  /* hazir olana kadar cizilmiyor: sunucudan gelen HTML ile ilk cizim
     ayni olsun. Yoksa React uyari veriyor ve sayi bir an yanlis
     gorunuyor. */
  if (!hazir || toplamAdet === 0) return null;
  if (yol?.startsWith("/store/cart") || yol?.startsWith("/store/order")) return null;

  return (
    <div
      className="sticky top-0 z-40"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      <Link
        href="/store/cart"
        className="mag-wrap flex items-center gap-3 py-2.5 transition-opacity hover:opacity-90"
      >
        <span className="byline">
          {toplamAdet} {toplamAdet === 1 ? "ITEM" : "ITEMS"} IN YOUR BASKET
        </span>
        <span className="ml-auto byline">{fiyat(araToplam, paraBirimi)}</span>
        <span className="byline">CHECKOUT →</span>
      </Link>
    </div>
  );
}

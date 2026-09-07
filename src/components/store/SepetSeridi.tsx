"use client";

import React from "react";
import Link from "next/link";
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
 * YERI: magaza bolumunun ICINDE, derginin basliginin ALTINDA. Ilk
 * halinde ekranin en tepesine yapisan bir cubuktu ve derginin
 * basliginin bile ustunde duruyordu — yani siteye ait bir sey gibi
 * gorunuyordu, oysa yalnizca magazayi ilgilendiriyor.
 *
 * Serit yalnizca sepette bir sey VARKEN gorunuyor: bos sepet icin
 * kalici bir cubuk tutmak, olmayan bir seyi surekli hatirlatmak olurdu.
 *
 * Odeme sayfasinda da gizleniyor; okur zaten oradayken "sepete git"
 * demek anlamsiz.
 */
export function SepetSeridi() {
  const { toplamAdet, araToplam, paraBirimi, hazir } = useSepet();

  /* hazir olana kadar cizilmiyor: sunucudan gelen HTML ile ilk cizim
     ayni olsun. Yoksa React uyari veriyor ve sayi bir an yanlis
     gorunuyor. */
  if (!hazir || toplamAdet === 0) return null;

  return (
    <div className="mag-wrap pt-6">
      <Link
        href="/store/cart"
        className="flex items-center gap-3 px-4 py-3 transition-opacity hover:opacity-90"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
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

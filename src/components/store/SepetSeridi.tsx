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
 * YERI: magazanin KENDI baslik blogunun ALTINDA — "§ STORE / From the
 * desk"ten sonra. Once ekranin en tepesine yapisiyordu (derginin
 * basliginin bile ustunde, siteye ait bir sey gibi), sonra <main>'in
 * ilk ogesi oldu ama bu sefer de magaza baslinin ustunde bir afis
 * gibi duruyordu. Artik bolumun icinde, icerigin bir parcasi.
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
    <div className="mag-wrap pt-8">
      <Link
        href="/store/cart"
        className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3.5 transition-opacity hover:opacity-90"
        style={{ background: "var(--ink)" }}
      >
        {/* RENK HER SPAN'DA AYRI YAZILI. Kapsayiciya color vermek
            yetmiyordu: .mag .byline kendi rengini (--ink-3) tanimliyor
            ve mirasi eziyordu — koyu zeminde gri yazi cikiyordu,
            okunmuyordu. */}
        <span className="byline" style={{ color: "var(--paper)" }}>
          {toplamAdet} {toplamAdet === 1 ? "ITEM" : "ITEMS"} IN YOUR BASKET
        </span>
        <span className="ml-auto display text-[1.05rem]" style={{ color: "var(--paper)" }}>
          {fiyat(araToplam, paraBirimi)}
        </span>
        <span className="byline" style={{ color: "var(--accent)" }}>
          CHECKOUT →
        </span>
      </Link>
    </div>
  );
}

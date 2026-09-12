"use client";

import { useEffect } from "react";

/**
 * SAYFA OLCUMU — Umami.
 *
 * Betik BU BILESENDEN takiliyor, dogrudan <head>'e yazilmiyor.
 * Sebebi tek bir kural: PANELIN ONIZLEMESI OLCULMEMELI.
 *
 * Yazi editorundeki tuval, sayfanin kendisini bir cerceve icinde
 * ?live=1 ile aciyor. Betik kosulsuz yuklenseydi, yazar bir yaziyi
 * duzenlerken gecirdigi her dakika "ziyaret" olarak sayilirdi ve en
 * cok duzenlenen yazi en cok okunan yazi gibi gorunurdu. Ayni tuzaga
 * bir kez dusuldu: onizleme, yazarin kendi reklam gosterim sayaclarini
 * sisiriyordu. O yuzden kosul burada ve acikca yaziyor.
 *
 * Cerez yok, kisisel veri yok: Umami kendi sunucumuzda calisiyor ve
 * okurun tarayicisina hicbir sey yazmiyor.
 */
export default function Olcum({
  kok,
  siteKimligi,
}: {
  kok: string;
  siteKimligi: string;
}) {
  useEffect(() => {
    if (!kok || !siteKimligi) return;

    /* Cerceve icindeysek olcum yok: panelin onizlemesi de, baska bir
       sitenin gomdugu bir cerceve de okur ziyareti degil. */
    if (window !== window.parent) return;
    if (new URLSearchParams(window.location.search).get("live") === "1") return;

    /* Iki kez takilmasin: gezinme sirasinda bilesen yeniden
       baglanabiliyor ve ikinci bir betik her sayfayi iki kez
       sayardi. */
    if (document.querySelector("script[data-website-id]")) return;

    const betik = document.createElement("script");
    betik.src = `${kok.replace(/\/+$/, "")}/script.js`;
    betik.defer = true;
    betik.setAttribute("data-website-id", siteKimligi);
    document.head.appendChild(betik);
  }, [kok, siteKimligi]);

  return null;
}

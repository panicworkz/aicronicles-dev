"use client";

import { useEffect } from "react";

/**
 * VIDEO KAPAGINA TIKLANINCA OYNATICIYI YUKLER.
 *
 * Sayfa acilir acilmaz gomulu oynatici yuklenseydi her yazi birkac
 * yuz kilobayt ucuncu taraf kod ve izleyici cerezi tasirdi — okur
 * videoyu izlemeyecek olsa bile. Once yalnizca kapak gorseli
 * basiliyor; oynatici ancak tiklandiginda geliyor.
 *
 * Tek bir dinleyici, govdeye degil BELGEYE bagli: yazi icinde kac
 * video olursa olsun ve icerik sonradan degisse de calisiyor.
 */
export default function VideoOynat() {
  useEffect(() => {
    const tikla = (olay: MouseEvent) => {
      const hedef = (olay.target as HTMLElement | null)?.closest?.(".video-kapak");
      if (!hedef) return;

      const gomme = hedef.getAttribute("data-gomme");
      if (!gomme) return;
      olay.preventDefault();

      const cerceve = document.createElement("iframe");
      cerceve.src = gomme;
      cerceve.title = hedef.getAttribute("aria-label") || "Video";
      cerceve.loading = "lazy";
      cerceve.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      cerceve.setAttribute("allowfullscreen", "");
      cerceve.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      cerceve.className = "video-cerceve";

      hedef.replaceWith(cerceve);
    };

    document.addEventListener("click", tikla);
    return () => document.removeEventListener("click", tikla);
  }, []);

  return null;
}

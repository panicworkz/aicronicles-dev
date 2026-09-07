"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Gezinme cizgisi — sayfanin ustunde ince bir ilerleme seridi.
 *
 * ONCE BURADA BIR ISKELET EKRANI VARDI ((frontend)/loading.tsx) ve
 * gorev olarak dogruydu: butun yayin sayfalari force-dynamic, yani her
 * tiklamada sunucudan uretiliyor; arada hicbir sey olmayinca tiklama
 * ise yaramamis gibi duruyordu.
 *
 * Ama iskeletin gorunmeyen bir bedeli vardi. loading.tsx bir Suspense
 * siniri kuruyor; Next kabugu HEMEN akitmaya basliyor ve akis
 * basladiktan sonra HTTP durum kodu degistirilemiyor. Sonucta
 * notFound() 404 sayfasini basiyor ama yanit 200 gidiyordu — sitedeki
 * BUTUN 404'ler icin. Google'in "soft 404" dedigi durum: olmayan
 * adresler dizine girmeye aday kaliyor.
 *
 * Sunucuda iki yonlu olctum: iskelet varken her eksik sayfa 200,
 * iskeleti kaldirinca hepsi 404. Kontrolu generateMetadata'ya tasimayi
 * da denedim — o da akistan sonra cozuldugu icin ise yaramadi.
 *
 * O yuzden geri bildirim ISTEMCIDE. Bu serit sunucu tarafinda hicbir
 * sinir kurmuyor, yaniti akitmiyor, durum koduna dokunmuyor: yalnizca
 * baglantiya tiklandigini gorup adres degisene kadar bir cizgi
 * yurutuyor.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [oran, setOran] = useState(0);
  const [gorunur, setGorunur] = useState(false);
  const sayac = useRef<ReturnType<typeof setInterval> | null>(null);
  const bitis = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Tiklamayi tek bir dinleyiciyle yakaliyoruz: sayfadaki her baglantiya
     ayri isleyici baglamak, sonradan gelen kartlar icin de calismazdi. */
  useEffect(() => {
    const tiklama = (e: MouseEvent) => {
      // Yeni sekmede acmak ya da indirmek gezinme degil.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const bag = (e.target as HTMLElement | null)?.closest?.("a");
      if (!bag) return;
      if (bag.target && bag.target !== "_self") return;
      if (bag.hasAttribute("download")) return;

      const href = bag.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      const hedef = new URL(bag.href, window.location.href);
      if (hedef.origin !== window.location.origin) return;
      // Ayni sayfaya tiklamak bir bekleme yaratmiyor.
      if (hedef.pathname === window.location.pathname) return;

      basla();
    };

    document.addEventListener("click", tiklama);
    return () => document.removeEventListener("click", tiklama);
  }, []);

  function temizle() {
    if (sayac.current) clearInterval(sayac.current);
    if (bitis.current) clearTimeout(bitis.current);
    sayac.current = null;
    bitis.current = null;
  }

  function basla() {
    temizle();
    setOran(8);
    setGorunur(true);
    /* %90'a kadar yaklasarak gidiyor, orada bekliyor. Sunucunun ne kadar
       surecegini bilmiyoruz; cizgiyi sonuna dayamak sonra da bekletmek
       "takildi" hissi verirdi. */
    sayac.current = setInterval(() => {
      setOran((o) => (o >= 90 ? o : o + (90 - o) * 0.12));
    }, 120);
  }

  /* Adres degisti: sayfa geldi. Cizgiyi tamamlayip siliyoruz. */
  useEffect(() => {
    if (!gorunur) return;
    temizle();
    setOran(100);
    bitis.current = setTimeout(() => {
      setGorunur(false);
      setOran(0);
    }, 260);
    return temizle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => temizle, []);

  if (!gorunur) return null;

  return (
    <div
      className="nav-cizgi"
      role="progressbar"
      aria-label="Loading the next page"
      aria-hidden={!gorunur}
    >
      <span style={{ width: `${oran}%` }} />
    </div>
  );
}

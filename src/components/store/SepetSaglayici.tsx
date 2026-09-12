"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Sepet.
 *
 * MAGAZADA SEPET YOKTU. "Add to Cart" dugmesi bir bildirim gosterip
 * hicbir sey yapmiyordu; siparis olusmuyordu, hicbir yere yazilmiyordu.
 *
 * Sepet TARAYICIDA duruyor (localStorage), sunucuda degil:
 *   - Uyelik istemiyoruz. Okurun bir sey almak icin hesap acmasi
 *     gerekmemeli; iletisim formunda da ayni karari verdik.
 *   - Sunucuda tutmak oturum, cerez ve temizlik isi demek; sepet
 *     terk edilirse veritabaninda cop kaliyor.
 * Siparis verildigi anda sepet sunucuya gidiyor ve ORADA dogrulaniyor
 * — fiyat dahil. Tarayicidaki fiyata guvenmiyoruz.
 */

export type SepetKalemi = {
  urunId: number;
  varyantId?: number | null;
  slug: string;
  baslik: string;
  /* Fiyat burada GOSTERIM icin. Odemede sunucu urunu yeniden okuyup
     kendi fiyatini kullaniyor; buradaki deger degistirilse bile
     tahsil edilecek tutar degismez. */
  fiyat: number;
  paraBirimi: string;
  tur: string;
  gorsel?: string | null;
  adet: number;
};

type SepetDurumu = {
  kalemler: SepetKalemi[];
  ekle: (k: Omit<SepetKalemi, "adet">, adet?: number) => void;
  adetYaz: (urunId: number, varyantId: number | null | undefined, adet: number) => void;
  cikar: (urunId: number, varyantId?: number | null) => void;
  /* Fiyat sunucudan gelen guncel degerle degistirilebiliyor: sepette
     haftalarca bekleyen bir urunun fiyati degismis olabilir ve eski
     tutari gostermek, odemede baska bir tutarla karsilasmak demek. */
  fiyatYaz: (urunId: number, varyantId: number | null | undefined, fiyat: number) => void;
  bosalt: () => void;
  toplamAdet: number;
  araToplam: number;
  paraBirimi: string;
  /* Sepet tarayicidan okunana kadar false. Sunucuda uretilen HTML ile
     ilk cizim ayni olsun diye: yoksa React "hydration" uyarisi verir
     ve sayi bir an yanlis gorunur. */
  hazir: boolean;
};

const Baglam = createContext<SepetDurumu | null>(null);
const ANAHTAR = "fabelo_sepet_v1";
/* Sepetin sunucudaki golgesini tanimaya yarayan rastgele kimlik.
   Cerez DEGIL: localStorage'da duruyor, hicbir yere otomatik
   gonderilmiyor ve kime ait oldugu bilinmiyor. */
const BELIRTEC = "fabelo_sepet_belirtec";

function belirtecAl(): string {
  try {
    let b = localStorage.getItem(BELIRTEC);
    if (!b) {
      b = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
        .replace(/[^a-zA-Z0-9-]/g, "");
      localStorage.setItem(BELIRTEC, b);
    }
    return b;
  } catch {
    /* Gizli sekmede depolama kapali olabiliyor; takip yapilmiyor,
       sepet yine calisiyor. */
    return "";
  }
}

function ayniKalem(a: SepetKalemi, urunId: number, varyantId?: number | null) {
  return a.urunId === urunId && (a.varyantId ?? null) === (varyantId ?? null);
}

export function SepetSaglayici({ children }: { children: React.ReactNode }) {
  const [kalemler, setKalemler] = useState<SepetKalemi[]>([]);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    try {
      const ham = localStorage.getItem(ANAHTAR);
      if (ham) {
        const c = JSON.parse(ham);
        if (Array.isArray(c)) setKalemler(c.filter((k) => k && k.urunId && k.adet > 0));
      }
    } catch {
      /* Bozuk ya da erisilemez depolama sepeti kaybettirir, sayfayi
         degil. Gizli sekmede localStorage erisimi hata atabiliyor. */
    }
    setHazir(true);
  }, []);

  useEffect(() => {
    if (!hazir) return;
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(kalemler));
    } catch {}
  }, [kalemler, hazir]);

  /* SUNUCUYA HABER.
     Sepet yine tarayicida duruyor; sunucuya giden sey yalnizca "su an
     sepette sunlar var" bilgisi. Amaci raporlayabilmek: kac sepet
     acildi, kaci siparise dondu, birakilanlarda ne kadar para var.

     GECIKMELI (800ms): adet dugmesine ust uste basan biri her tikta
     bir istek atmasin. Son degisiklikten sonra bir kez gidiyor.

     keepalive: sekme kapanirken de son durum ulassin diye. Bu olmadan
     "sepete koydu ve hemen cikti" hali hic kaydedilmiyordu — yani tam
     da olcmek istedigimiz durum kayboluyordu. */
  useEffect(() => {
    if (!hazir) return;
    const belirtec = belirtecAl();
    if (!belirtec) return;

    const zamanlayici = setTimeout(() => {
      fetch("/api/cart/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          token: belirtec,
          items: kalemler.map((k) => ({ urunId: k.urunId, adet: k.adet })),
        }),
      }).catch(() => {
        /* Takip bir kolaylik; basarisiz olmasi alisverisi
           etkilememeli. */
      });
    }, 800);

    return () => clearTimeout(zamanlayici);
  }, [kalemler, hazir]);

  const durum = useMemo<SepetDurumu>(() => {
    const toplamAdet = kalemler.reduce((t, k) => t + k.adet, 0);
    const araToplam = kalemler.reduce((t, k) => t + k.fiyat * k.adet, 0);

    return {
      kalemler,
      hazir,
      toplamAdet,
      araToplam,
      /* Sepetteki ilk kalemin birimi. Farkli birimli urunleri ayni
         sepete koymak tek bir toplam uretemez; ekle() bunu engelliyor. */
      paraBirimi: kalemler[0]?.paraBirimi || "USD",

      ekle: (k, adet = 1) =>
        setKalemler((m) => {
          const v = m.findIndex((x) => ayniKalem(x, k.urunId, k.varyantId));
          if (v >= 0) {
            const y = [...m];
            y[v] = { ...y[v], adet: y[v].adet + adet };
            return y;
          }
          return [...m, { ...k, adet }];
        }),

      adetYaz: (urunId, varyantId, adet) =>
        setKalemler((m) =>
          adet <= 0
            ? m.filter((x) => !ayniKalem(x, urunId, varyantId))
            : m.map((x) => (ayniKalem(x, urunId, varyantId) ? { ...x, adet } : x))
        ),

      cikar: (urunId, varyantId) =>
        setKalemler((m) => m.filter((x) => !ayniKalem(x, urunId, varyantId))),

      fiyatYaz: (urunId, varyantId, fiyat) =>
        setKalemler((m) =>
          m.map((x) => (ayniKalem(x, urunId, varyantId) ? { ...x, fiyat } : x))
        ),

      bosalt: () => setKalemler([]),
    };
  }, [kalemler, hazir]);

  return <Baglam.Provider value={durum}>{children}</Baglam.Provider>;
}

export function useSepet(): SepetDurumu {
  const b = useContext(Baglam);
  if (!b) throw new Error("useSepet, SepetSaglayici icinde cagrilmali.");
  return b;
}

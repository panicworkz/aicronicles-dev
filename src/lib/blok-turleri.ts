import type { Blok } from "@/lib/bloklar";

/**
 * BLOK TURLERI KAYDI — arayuzun tek beslenme noktasi.
 *
 * Neden var: onceki arac cubugu TUR KORUYDU. Paragrafin da gorselin de
 * ustunde ayni bes dugme cikiyordu ve bu yuzden "gercek blok" hissi
 * vermiyordu. Turu bilen bir arayuz yazmanin iki yolu var:
 *
 *   1. Her denetimin icinde "eger gorselse... eger baslıksa..." diye
 *      DOM koklamak. Bes ozel durum yazarsiniz, altinci tur gelince
 *      hepsini yeniden yazarsiniz. Yama budur.
 *   2. Turu bir yerde TARIF etmek, arayuzun oradan okumasi.
 *
 * Burasi ikincisi. Arac cubugu, ekleme menusu ve ayar paneli bu
 * kayittan besleniyor. Yeni tur eklemek = buraya bir kayit.
 *
 * DUZENLENEBILIR ALANLAR (alanlar) arayuzu de buradan cikiyor: hangi
 * alan, ne tur bir girdi, ne yazacak. Ayri bir form yazilmiyor.
 */

export type AlanTuru = "metin" | "uzunMetin" | "gorsel" | "secim" | "anahtar";

export type Alan = {
  ad: string;
  etiket: string;
  tur: AlanTuru;
  ipucu?: string;
  /* secim alanlari icin */
  secenekler?: { deger: string; etiket: string }[];
};

export type BlokTanimi = {
  t: Blok["t"];
  ad: string;
  /* Ekleme menusunde gorunsun mu. Bazi turler yalnizca goc sirasinda
     olusuyor ve elle eklenmesi anlamsiz. */
  eklenebilir: boolean;
  /* Yeni eklendiginde nasil dogar. */
  yeni?: () => Blok;
  /* Ayar panelinde gosterilecek alanlar. */
  alanlar: Alan[];
  /* Govdesi yerinde (sayfa uzerinde) yazilabilir mi. */
  yerindeYazilir: boolean;
};

/* Tipografi: font ADI degil ROL secilyor.
   Serbest font secici bu tasarima zarar verirdi — ilk yazida Georgia,
   ucuncude Arial gorursunuz ve dergi hissi biter. Roller tasarimin
   kendi tipografi sistemine bagli, yani her yazida ayni duruyor. */
export const PARAGRAF_ROLLERI = [
  { deger: "", etiket: "Govde metni" },
  { deger: "one-cikan", etiket: "One cikan paragraf" },
  { deger: "kucuk-not", etiket: "Kucuk not" },
];

export const BLOK_TANIMLARI: Record<Blok["t"], BlokTanimi> = {
  paragraf: {
    t: "paragraf",
    ad: "Paragraf",
    eklenebilir: true,
    yeni: () => ({ t: "paragraf", html: "" }),
    yerindeYazilir: true,
    alanlar: [
      {
        ad: "rol",
        etiket: "Bicim",
        tur: "secim",
        secenekler: PARAGRAF_ROLLERI,
        ipucu: "Tasarimin kendi tipografisi; font secilmiyor, rol seciliyor.",
      },
    ],
  },

  baslik: {
    t: "baslik",
    ad: "Baslik",
    eklenebilir: true,
    yeni: () => ({ t: "baslik", seviye: 2, html: "" }),
    yerindeYazilir: true,
    alanlar: [
      {
        ad: "seviye",
        etiket: "Seviye",
        tur: "secim",
        secenekler: [
          { deger: "2", etiket: "H2 — ana bolum" },
          { deger: "3", etiket: "H3 — alt bolum" },
          { deger: "4", etiket: "H4 — kucuk baslik" },
        ],
      },
      {
        ad: "id",
        etiket: "Cipa kimligi",
        tur: "metin",
        ipucu: "Icindekiler baglantilari ve SSS cikarimi bunu kullaniyor; degistirmek eski baglantilari kirar.",
      },
    ],
  },

  liste: {
    t: "liste",
    ad: "Liste",
    eklenebilir: true,
    yeni: () => ({ t: "liste", sirali: false, ogeler: [""] }),
    yerindeYazilir: true,
    alanlar: [{ ad: "sirali", etiket: "Numarali liste", tur: "anahtar" }],
  },

  gorsel: {
    t: "gorsel",
    ad: "Gorsel",
    eklenebilir: true,
    yeni: () => ({ t: "gorsel", src: "" }),
    /* Gorselin uzerine yazi yazilmaz; alanlari panelden duzenleniyor. */
    yerindeYazilir: false,
    alanlar: [
      { ad: "src", etiket: "Gorsel", tur: "gorsel" },
      {
        ad: "alt",
        etiket: "Alternatif metin",
        tur: "metin",
        ipucu: "Ekran okuyucular ve gorsel yuklenmediginde gorunen metin.",
      },
      { ad: "altyazi", etiket: "Altyazi", tur: "uzunMetin" },
      { ad: "baglanti", etiket: "Tiklaninca gidilecek adres", tur: "metin" },
      { ad: "genis", etiket: "Genis goster", tur: "anahtar" },
    ],
  },

  alinti: {
    t: "alinti",
    ad: "Alinti",
    eklenebilir: true,
    yeni: () => ({ t: "alinti", html: "" }),
    yerindeYazilir: true,
    alanlar: [],
  },

  ayrac: {
    t: "ayrac",
    ad: "Ayrac",
    eklenebilir: true,
    yeni: () => ({ t: "ayrac" }),
    yerindeYazilir: false,
    alanlar: [],
  },

  tablo: {
    t: "tablo",
    ad: "Tablo",
    /* Tablo HTML olarak tutuluyor; sifirdan tablo kurma arayuzu yok.
       Var olan tablolar duzenlenebiliyor, yenisi henuz eklenmiyor —
       yalan soylememek icin menude gorunmuyor. */
    eklenebilir: false,
    yerindeYazilir: true,
    alanlar: [],
  },

  urun: {
    t: "urun",
    ad: "Urun karti",
    eklenebilir: true,
    yeni: () => ({ t: "urun", urunId: 0 }),
    yerindeYazilir: false,
    /* ALAN YOK, bilerek. Once burada "urun kimligi" diye bir metin
       kutusu vardi ve icinde 0 yaziyordu: kullaniciya urun listesini
       gostermeden kimlik yazdirmak, bilmedigi bir sayiyi elle
       girmesini beklemek demekti. Urun secimi arac cubugundaki
       "Urun sec" dugmesinden, gercek urun listesiyle yapiliyor. */
    alanlar: [],
  },

  icindekiler: {
    t: "icindekiler",
    ad: "Icindekiler",
    eklenebilir: true,
    yeni: () => ({ t: "icindekiler", seviyeler: [2, 3] }),
    yerindeYazilir: false,
    alanlar: [
      {
        ad: "seviyeler",
        etiket: "Hangi basliklar",
        tur: "secim",
        secenekler: [
          { deger: "2", etiket: "Yalnizca ana bolumler (H2)" },
          { deger: "2,3", etiket: "Ana bolumler ve alt bolumler (H2 + H3)" },
          { deger: "2,3,4", etiket: "Butun basliklar (H2 + H3 + H4)" },
        ],
        ipucu: "Liste yazinin basliklarindan kendiliginden uretiliyor; baslik degisince guncelleniyor.",
      },
    ],
  },

  ham: {
    t: "ham",
    ad: "Ham HTML",
    /* Kacis kapisi. Elle eklenmesi icin bir sebep yok; ayristiricinin
       tanimadigi seyler buraya dusuyor. */
    eklenebilir: false,
    yerindeYazilir: false,
    alanlar: [],
  },
};

/** Ekleme menusunde gosterilecek turler, siralanmis halde. */
export const EKLENEBILIR_TURLER = (
  ["paragraf", "baslik", "gorsel", "liste", "icindekiler", "alinti", "urun", "ayrac"] as const
).map((t) => BLOK_TANIMLARI[t]);

export function blokAdi(t: string): string {
  return BLOK_TANIMLARI[t as Blok["t"]]?.ad ?? t;
}

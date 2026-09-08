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
  { deger: "", etiket: "Body text" },
  { deger: "one-cikan", etiket: "Lead paragraph" },
  { deger: "kucuk-not", etiket: "Small note" },
];

export const BLOK_TANIMLARI: Record<Blok["t"], BlokTanimi> = {
  paragraf: {
    t: "paragraf",
    ad: "Paragraph",
    eklenebilir: true,
    yeni: () => ({ t: "paragraf", html: "" }),
    yerindeYazilir: true,
    alanlar: [
      {
        ad: "rol",
        etiket: "Style",
        tur: "secim",
        secenekler: PARAGRAF_ROLLERI,
        ipucu: "Uses the design\u2019s own typography \u2014 you pick a role, not a font.",
      },
    ],
  },

  baslik: {
    t: "baslik",
    ad: "Heading",
    eklenebilir: true,
    yeni: () => ({ t: "baslik", seviye: 2, html: "" }),
    yerindeYazilir: true,
    alanlar: [
      {
        ad: "seviye",
        etiket: "Level",
        tur: "secim",
        secenekler: [
          { deger: "2", etiket: "H2 — section" },
          { deger: "3", etiket: "H3 — subsection" },
          { deger: "4", etiket: "H4 — minor heading" },
        ],
      },
      {
        ad: "id",
        etiket: "Anchor ID",
        tur: "metin",
        ipucu: "Used by contents links and FAQ extraction \u2014 changing it breaks existing links.",
      },
    ],
  },

  liste: {
    t: "liste",
    ad: "List",
    eklenebilir: true,
    yeni: () => ({ t: "liste", sirali: false, ogeler: [""] }),
    yerindeYazilir: true,
    alanlar: [{ ad: "sirali", etiket: "Numbered list", tur: "anahtar" }],
  },

  gorsel: {
    t: "gorsel",
    ad: "Image",
    eklenebilir: true,
    yeni: () => ({ t: "gorsel", src: "" }),
    /* Gorselin uzerine yazi yazilmaz; alanlari panelden duzenleniyor. */
    yerindeYazilir: false,
    alanlar: [
      { ad: "src", etiket: "Image", tur: "gorsel" },
      {
        ad: "alt",
        etiket: "Alt text",
        tur: "metin",
        ipucu: "Read by screen readers and shown if the image fails to load.",
      },
      { ad: "altyazi", etiket: "Caption", tur: "uzunMetin" },
      { ad: "baglanti", etiket: "Link URL", tur: "metin" },
      { ad: "genis", etiket: "Full width", tur: "anahtar" },
    ],
  },

  alinti: {
    t: "alinti",
    ad: "Quote",
    eklenebilir: true,
    yeni: () => ({ t: "alinti", html: "" }),
    yerindeYazilir: true,
    alanlar: [],
  },

  ayrac: {
    t: "ayrac",
    ad: "Divider",
    eklenebilir: true,
    yeni: () => ({ t: "ayrac" }),
    yerindeYazilir: false,
    alanlar: [],
  },

  tablo: {
    t: "tablo",
    ad: "Table",
    /* Tablo HTML olarak tutuluyor; sifirdan tablo kurma arayuzu yok.
       Var olan tablolar duzenlenebiliyor, yenisi henuz eklenmiyor —
       yalan soylememek icin menude gorunmuyor. */
    eklenebilir: false,
    yerindeYazilir: true,
    alanlar: [],
  },

  urun: {
    t: "urun",
    ad: "Product card",
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
    ad: "Table of contents",
    eklenebilir: true,
    yeni: () => ({ t: "icindekiler", seviyeler: [2, 3] }),
    yerindeYazilir: false,
    alanlar: [
      {
        ad: "seviyeler",
        etiket: "Include headings",
        tur: "secim",
        secenekler: [
          { deger: "2", etiket: "Main sections only (H2)" },
          { deger: "2,3", etiket: "Sections and subsections (H2 + H3)" },
          { deger: "2,3,4", etiket: "All headings (H2 + H3 + H4)" },
        ],
        ipucu: "Built from the article\u2019s own headings and updated whenever they change.",
      },
    ],
  },

  kutu: {
    t: "kutu",
    ad: "Callout",
    eklenebilir: true,
    yeni: () => ({ t: "kutu", tur: "bilgi", baslik: "Info", html: "" }),
    yerindeYazilir: true,
    alanlar: [
      {
        ad: "tur",
        etiket: "Style",
        tur: "secim",
        secenekler: [
          { deger: "bilgi", etiket: "Info" },
          { deger: "uyari", etiket: "Warning" },
          { deger: "ipucu", etiket: "Tip" },
          { deger: "ozet", etiket: "Key takeaway" },
        ],
        ipucu: "A key takeaway box also helps search engines and AI answer tools.",
      },
    ],
  },

  artilar: {
    t: "artilar",
    ad: "Pros & cons",
    eklenebilir: true,
    yeni: () => ({
      t: "artilar",
      artilar: ["First pro"],
      eksiler: ["First con"],
    }),
    yerindeYazilir: true,
    alanlar: [],
  },

  istatistik: {
    t: "istatistik",
    ad: "Key stats",
    eklenebilir: true,
    yeni: () => ({
      t: "istatistik",
      ogeler: [
        { sayi: "42%", etiket: "Label" },
        { sayi: "3x", etiket: "Label" },
      ],
    }),
    yerindeYazilir: true,
    alanlar: [],
  },

  adimlar: {
    t: "adimlar",
    ad: "Steps",
    eklenebilir: true,
    yeni: () => ({
      t: "adimlar",
      ogeler: [{ baslik: "First step", html: "Describe what to do." }],
    }),
    yerindeYazilir: true,
    alanlar: [],
  },

  kaynakca: {
    t: "kaynakca",
    ad: "References",
    eklenebilir: true,
    yeni: () => ({ t: "kaynakca", ogeler: ["Source"] }),
    yerindeYazilir: true,
    alanlar: [],
  },

  cta: {
    t: "cta",
    ad: "Call to action",
    eklenebilir: true,
    yeni: () => ({
      t: "cta",
      baslik: "Heading",
      metin: "Short description.",
      dugmeMetni: "Learn more",
      adres: "",
    }),
    yerindeYazilir: true,
    alanlar: [
      { ad: "adres", etiket: "Button link", tur: "metin" },
    ],
  },

  video: {
    t: "video",
    ad: "Video",
    eklenebilir: true,
    yeni: () => ({ t: "video", saglayici: "youtube", videoId: "" }),
    yerindeYazilir: false,
    alanlar: [
      {
        ad: "adres",
        etiket: "Video URL",
        tur: "metin",
        ipucu: "YouTube or Vimeo URL. Only the video ID is stored in the article.",
      },
    ],
  },

  galeri: {
    t: "galeri",
    ad: "Gallery",
    eklenebilir: true,
    yeni: () => ({ t: "galeri", sutun: 3, gorseller: [] }),
    yerindeYazilir: false,
    alanlar: [
      {
        ad: "sutun",
        etiket: "Columns",
        tur: "secim",
        secenekler: [
          { deger: "2", etiket: "2 columns" },
          { deger: "3", etiket: "3 columns" },
          { deger: "4", etiket: "4 columns" },
        ],
      },
    ],
  },

  ham: {
    t: "ham",
    ad: "Raw HTML",
    /* Kacis kapisi. Elle eklenmesi icin bir sebep yok; ayristiricinin
       tanimadigi seyler buraya dusuyor. */
    eklenebilir: false,
    yerindeYazilir: false,
    alanlar: [],
  },
};

/** Ekleme menusunde gosterilecek turler, siralanmis halde. */
export const EKLENEBILIR_TURLER = (
  [
    "paragraf", "baslik", "gorsel", "galeri", "liste", "icindekiler",
    "kutu", "artilar", "adimlar", "istatistik", "alinti",
    "video", "cta", "urun", "kaynakca", "ayrac",
  ] as const
).map((t) => BLOK_TANIMLARI[t]);

export function blokAdi(t: string): string {
  return BLOK_TANIMLARI[t as Blok["t"]]?.ad ?? t;
}

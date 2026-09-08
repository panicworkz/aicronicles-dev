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
  /* Bir cumlelik aciklama — genisletilmis ekleme menusunde gorunuyor.
     "Kutu" ya da "Sayi vurgusu" adlari tek basina hicbir sey
     anlatmiyor; yazarin ne ise yaradigini tahmin etmesi gerekiyordu. */
  aciklama?: string;
  /* Kucuk onizleme cizimi (SVG govdesi). Metin bir blogun neye
     benzedigini anlatamiyor; sekil aninda anlatiyor. */
  simge?: string;
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
    aciklama: "Plain body text.",
    simge: '<rect x="1" y="3" width="22" height="2" rx="1"/><rect x="1" y="8" width="22" height="2" rx="1"/><rect x="1" y="13" width="16" height="2" rx="1"/>',
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
    aciklama: "Section title. Also feeds the table of contents.",
    simge: '<rect x="1" y="4" width="14" height="4" rx="1"/><rect x="1" y="12" width="22" height="2" rx="1"/><rect x="1" y="17" width="18" height="2" rx="1"/>',
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
    aciklama: "Bulleted or numbered list. Can become a checklist.",
    simge: '<circle cx="3" cy="5" r="1.6"/><rect x="7" y="4" width="16" height="2" rx="1"/><circle cx="3" cy="12" r="1.6"/><rect x="7" y="11" width="16" height="2" rx="1"/><circle cx="3" cy="19" r="1.6"/><rect x="7" y="18" width="12" height="2" rx="1"/>',
    ad: "List",
    eklenebilir: true,
    yeni: () => ({ t: "liste", sirali: false, ogeler: [""] }),
    yerindeYazilir: true,
    alanlar: [{ ad: "sirali", etiket: "Numbered list", tur: "anahtar" }],
  },

  gorsel: {
    t: "gorsel",
    aciklama: "A single image with optional caption and credit.",
    simge: '<rect x="1" y="3" width="22" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="9" r="2"/><path d="M3 16l5-5 5 4 3-2 5 4v1H3z"/><rect x="1" y="20" width="12" height="1.6" rx=".8"/>',
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
    aciklama: "A quote. Can be shown as a large pull quote.",
    simge: '<path d="M4 6h5v6c0 3-2 5-5 6v-2c2-1 3-2 3-4H4z"/><path d="M14 6h5v6c0 3-2 5-5 6v-2c2-1 3-2 3-4h-3z"/>',
    ad: "Quote",
    eklenebilir: true,
    yeni: () => ({ t: "alinti", html: "" }),
    yerindeYazilir: true,
    alanlar: [],
  },

  ayrac: {
    t: "ayrac",
    aciklama: "A horizontal rule between sections.",
    simge: '<rect x="1" y="11" width="22" height="2" rx="1"/>',
    ad: "Divider",
    eklenebilir: true,
    yeni: () => ({ t: "ayrac" }),
    yerindeYazilir: false,
    alanlar: [],
  },

  tablo: {
    t: "tablo",
    aciklama: "Rows and columns. Add or remove them from the toolbar.",
    simge: '<rect x="1" y="4" width="22" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1 9.5h22M9 4v16M16 4v16" stroke="currentColor" stroke-width="1.2"/>',
    ad: "Table",
    /* Artik menude: uc satir uc sutunluk bos bir tablo aciliyor,
       satir/sutun islemleri arac cubugunda. */
    eklenebilir: true,
    yerindeYazilir: true,
    alanlar: [],
  },

  urun: {
    t: "urun",
    aciklama: "A live product card. Price and stock come from the store.",
    simge: '<rect x="1" y="5" width="22" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="4" y="8" width="8" height="8" rx="1"/><rect x="14" y="8" width="6" height="1.8" rx=".9"/><rect x="14" y="12" width="4" height="1.8" rx=".9"/>',
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
    aciklama: "Auto-built from the article headings. Updates itself.",
    simge: '<rect x="1" y="3" width="22" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="4" y="7" width="3" height="1.6" rx=".8"/><rect x="9" y="7" width="11" height="1.6" rx=".8"/><rect x="4" y="11.5" width="3" height="1.6" rx=".8"/><rect x="9" y="11.5" width="9" height="1.6" rx=".8"/><rect x="4" y="16" width="3" height="1.6" rx=".8"/><rect x="9" y="16" width="7" height="1.6" rx=".8"/>',
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
    aciklama: "Info, warning, tip — or a key takeaway for search and AI.",
    simge: '<rect x="1" y="4" width="22" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="1" y="4" width="3" height="16" rx="1.5"/><rect x="7" y="9" width="12" height="1.8" rx=".9"/><rect x="7" y="13.5" width="8" height="1.8" rx=".9"/>',
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
    aciklama: "Two columns: what is good, what is not.",
    simge: '<rect x="1" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="13" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 8v6M3 11h6" stroke="currentColor" stroke-width="1.6"/><path d="M15 11h6" stroke="currentColor" stroke-width="1.6"/>',
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
    aciklama: "Two to four numbers you want the reader to remember.",
    simge: '<rect x="1" y="6" width="8" height="6" rx="1"/><rect x="1" y="14" width="6" height="1.6" rx=".8"/><rect x="14" y="6" width="8" height="6" rx="1"/><rect x="14" y="14" width="6" height="1.6" rx=".8"/>',
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
    aciklama: "Numbered steps with a title and a description each.",
    simge: '<circle cx="4" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="10" y="4" width="13" height="2" rx="1"/><circle cx="4" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="10" y="11" width="13" height="2" rx="1"/><circle cx="4" cy="19" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="10" y="18" width="9" height="2" rx="1"/>',
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
    aciklama: "Numbered sources at the end of the article.",
    simge: '<path d="M1 4h22" stroke="currentColor" stroke-width="1.4"/><rect x="1" y="8" width="3" height="1.6" rx=".8"/><rect x="6" y="8" width="17" height="1.6" rx=".8"/><rect x="1" y="13" width="3" height="1.6" rx=".8"/><rect x="6" y="13" width="14" height="1.6" rx=".8"/><rect x="1" y="18" width="3" height="1.6" rx=".8"/><rect x="6" y="18" width="10" height="1.6" rx=".8"/>',
    ad: "References",
    eklenebilir: true,
    yeni: () => ({ t: "kaynakca", ogeler: ["Source"] }),
    yerindeYazilir: true,
    alanlar: [],
  },

  cta: {
    t: "cta",
    aciklama: "A heading, a line of text and one button.",
    simge: '<rect x="1" y="3" width="22" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="5" y="7" width="14" height="2" rx="1"/><rect x="7" y="11" width="10" height="1.6" rx=".8"/><rect x="7" y="15" width="10" height="4" rx="2"/>',
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
    aciklama: "YouTube or Vimeo. Loads only when the reader clicks.",
    simge: '<rect x="1" y="4" width="22" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10 8.5l6 3.5-6 3.5z"/>',
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
    aciklama: "Several images in a 2, 3 or 4 column grid.",
    simge: '<rect x="1" y="4" width="6" height="6" rx="1"/><rect x="9" y="4" width="6" height="6" rx="1"/><rect x="17" y="4" width="6" height="6" rx="1"/><rect x="1" y="12" width="6" height="6" rx="1"/><rect x="9" y="12" width="6" height="6" rx="1"/><rect x="17" y="12" width="6" height="6" rx="1"/>',
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

  sutunlar: {
    t: "sutunlar",
    aciklama: "Two side-by-side text columns.",
    simge: '<rect x="1" y="4" width="10" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="13" y="4" width="10" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="3" y="8" width="6" height="1.6" rx=".8"/><rect x="3" y="12" width="6" height="1.6" rx=".8"/><rect x="15" y="8" width="6" height="1.6" rx=".8"/><rect x="15" y="12" width="6" height="1.6" rx=".8"/>',
    ad: "Two columns",
    eklenebilir: true,
    yeni: () => ({ t: "sutunlar", sol: "", sag: "" }),
    yerindeYazilir: true,
    alanlar: [],
  },

  grafik: {
    t: "grafik",
    aciklama: "Bar chart from labels and values. No chart library.",
    simge: '<rect x="2" y="14" width="4" height="7" rx="1"/><rect x="8" y="9" width="4" height="12" rx="1"/><rect x="14" y="4" width="4" height="17" rx="1"/><rect x="20" y="11" width="2.5" height="10" rx="1"/>',
    ad: "Bar chart",
    eklenebilir: true,
    yeni: () => ({
      t: "grafik",
      ogeler: [
        { etiket: "First", deger: 62, gosterim: "62%" },
        { etiket: "Second", deger: 38, gosterim: "38%" },
      ],
    }),
    yerindeYazilir: true,
    alanlar: [],
  },

  ham: {
    t: "ham",
    aciklama: "Markup the editor did not recognise.",
    simge: '<path d="M8 6l-5 6 5 6M16 6l5 6-5 6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
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
    "paragraf", "baslik", "gorsel", "galeri", "liste", "tablo",
    "icindekiler", "kutu", "artilar", "adimlar", "istatistik", "grafik",
    "alinti", "sutunlar", "video", "cta", "urun", "kaynakca", "ayrac",
  ] as const
).map((t) => BLOK_TANIMLARI[t]);

export function blokAdi(t: string): string {
  return BLOK_TANIMLARI[t as Blok["t"]]?.ad ?? t;
}

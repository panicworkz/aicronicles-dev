/**
 * Iletisim sekmeleri — YEDEK tanim.
 *
 * Asil kaynak artik VERITABANI (contact_tabs / contact_fields), panelden
 * yonetiliyor. Buradaki liste yalnizca yedek: tablolar bossa ya da
 * veritabani okunamazsa form yine de calissin diye duruyor. Bir iletisim
 * formunun "bugun veritabani dustu" diye kaybolmasi kabul edilemez.
 *
 * Ikisi ayrisirsa dogru olan veritabanidir; bu liste tohumlama
 * betiginin (scripts/panel/form-tohumla.mjs) yazdigi ilk halidir.
 *
 * Her sekme sitedeki BIR sabit sayfanin karsiligi; o sayfadan gelen
 * okur dogru formu acilmis bulsun diye. Eslesme:
 *
 *   /about                  -> general    (#contact, #who-writes-for-fabelo)
 *   /advertise              -> advertising (#advertising-formats)
 *   /sponsor                -> sponsorship (#sponsorship-options)
 *   /terms-and-conditions   -> licensing   (#intellectual-property)
 *   /data-and-privacy       -> privacy     (#your-privacy-rights)
 *
 * Secenekler uydurulmadi: reklam bicimleri /advertise sayfasinin kendi
 * ucusunden (display, sponsored content, newsletter), yerlesim olculeri
 * CMS'teki gercek yuvalardan, konular sitenin uc bolumunden geliyor.
 * Formda okura sitede yazmayan bir sey vaat edilmemeli.
 */

export type Alan =
  | { tur: "metin"; ad: string; etiket: string; ipucu?: string; zorunlu?: boolean }
  | { tur: "secim"; ad: string; etiket: string; secenekler: string[]; zorunlu?: boolean };

export type Sekme = {
  anahtar: string;
  no: string;
  baslik: string;
  ozet: string;
  /** Bu sekmeyi acan sayfa — kunyede ve dogrulamada ise yariyor. */
  sayfa: string;
  alanlar: Alan[];
  mesajEtiketi: string;
};

export const SEKMELER: Sekme[] = [
  {
    anahtar: "general",
    no: "01",
    baslik: "General & corrections",
    ozet:
      "Questions about a story, a correction to something we published, or a note about writing for Fabelo.",
    sayfa: "/about",
    mesajEtiketi: "What would you like to tell us?",
    alanlar: [
      {
        tur: "secim",
        ad: "general_category",
        etiket: "What is this about",
        zorunlu: true,
        secenekler: [
          "A correction to a published story",
          "A question about our reporting",
          "Writing for Fabelo",
          "Partnership or collaboration",
          "Something else",
        ],
      },
      { tur: "metin", ad: "general_subject", etiket: "Story or subject", ipucu: "Headline or URL, if it is about one" },
    ],
  },
  {
    anahtar: "advertising",
    no: "02",
    baslik: "Advertising",
    ozet: "Rates, availability and custom packages across the site and the newsletter.",
    sayfa: "/advertise",
    mesajEtiketi: "What are you trying to reach, and by when?",
    alanlar: [
      {
        tur: "secim",
        ad: "ad_format",
        etiket: "Format",
        zorunlu: true,
        secenekler: [
          "Display banner",
          "Sponsored article",
          "Newsletter sponsorship",
          "A package — help me choose",
        ],
      },
      {
        tur: "secim",
        ad: "ad_placement",
        etiket: "Placement (display only)",
        secenekler: [
          "No preference",
          "Measure — 1440 × 200, full content width",
          "Feature — 940 × 180, in the article body",
          "Panel — 511 × 300, side column",
          "Rail — 387 × 540, tall side unit",
        ],
      },
      {
        tur: "secim",
        ad: "ad_period",
        etiket: "When",
        secenekler: ["As soon as possible", "This quarter", "Next quarter", "Ongoing", "Not decided yet"],
      },
      {
        tur: "secim",
        ad: "ad_budget",
        etiket: "Budget range",
        secenekler: ["Under $1k / month", "$1k – $5k / month", "$5k – $15k / month", "Above $15k / month", "Prefer to discuss"],
      },
    ],
  },
  {
    anahtar: "sponsorship",
    no: "03",
    baslik: "Sponsored content",
    ozet: "In-depth articles written in collaboration with your brand, and longer partnerships.",
    sayfa: "/sponsor",
    mesajEtiketi: "Tell us about your brand and what you want readers to take away",
    alanlar: [
      { tur: "metin", ad: "sp_brand", etiket: "Brand", zorunlu: true },
      { tur: "metin", ad: "sp_title", etiket: "Working title or angle", ipucu: "Optional — a rough idea is enough" },
      {
        tur: "secim",
        ad: "sp_category",
        etiket: "Section",
        zorunlu: true,
        secenekler: ["Personal Finance", "Career", "AI & Tech", "Not sure yet"],
      },
      {
        tur: "secim",
        ad: "sp_scope",
        etiket: "Scope",
        secenekler: ["A single article", "A series", "A season-long partnership", "Open to suggestions"],
      },
    ],
  },
  {
    anahtar: "licensing",
    no: "04",
    baslik: "Rights & licensing",
    ozet: "Permission to republish, translate, quote at length or teach from a Fabelo story.",
    sayfa: "/terms-and-conditions",
    mesajEtiketi: "Anything else we should know about the intended use?",
    alanlar: [
      { tur: "metin", ad: "lic_article", etiket: "Which story", ipucu: "Paste the URL", zorunlu: true },
      {
        tur: "secim",
        ad: "lic_use",
        etiket: "Intended use",
        zorunlu: true,
        secenekler: [
          "Republish in full",
          "Excerpt or quote at length",
          "Translation",
          "Teaching or academic use",
          "Something else",
        ],
      },
      { tur: "metin", ad: "lic_medium", etiket: "Where it will appear", ipucu: "Publication, course, site" },
    ],
  },
  {
    anahtar: "privacy",
    no: "05",
    baslik: "Privacy & data",
    ozet: "Exercise your rights over the data we hold — access, correction, deletion or export.",
    sayfa: "/data-and-privacy",
    mesajEtiketi: "Anything that helps us find your record",
    alanlar: [
      {
        tur: "secim",
        ad: "pr_request",
        etiket: "Request",
        zorunlu: true,
        secenekler: [
          "Access the data you hold about me",
          "Correct my data",
          "Delete my data",
          "Export my data",
          "Object to processing",
        ],
      },
      {
        tur: "metin",
        ad: "pr_identifier",
        etiket: "Email on record",
        ipucu: "If it differs from the address above",
      },
    ],
  },
];

/** Adresteki ?type= degerini gecerli bir sekmeye cevirir. */
export function sekmeBul(deger?: string | null): Sekme {
  const b = SEKMELER.find((s) => s.anahtar === (deger || "").toLowerCase());
  return b ?? SEKMELER[0];
}

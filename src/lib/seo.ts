/**
 * Yayin tarafinin adres ve yapilandirilmis veri kaynagi.
 *
 * Adres tek yerden geliyor. Onceden her dosya kendi sabitini tasiyordu
 * (yazi sayfasi, sitemap.xml, sitemap-news.xml, llms.txt, api/llm...) ve
 * cogunda ortam degiskeni bile okunmuyordu — alan adi koda gomuluydu.
 * fabelo.io'ya tasinirken bunlarin biri atlanirsa arama motoruna
 * "asil adres burasi degil" demis oluruz, yani tasinmanin tam tersi.
 */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://fabelo.testworkz.com")
  .replace(/\/+$/, "");

/**
 * Yalnizca alan adi — "fabelo.testworkz.com".
 *
 * CMS ekranlari adresi metin olarak gosteriyor (slug alaninin onundeki
 * on ek, SERP onizlemesi). Bunlar da SITE'den turetilir; ayri bir
 * NEXT_PUBLIC_SITE_DOMAIN degiskeni ikisinin ayrisabilmesi demek olurdu
 * ve o zaman editor, yayin tarafinin bastigi adresten baskasini
 * gosterirdi.
 */
export const SITE_DOMAIN = SITE.replace(/^https?:\/\//, "");

/** Goreli yolu mutlak adrese cevirir. schema.org mutlak adres ister. */
export function mutlak(yol: string | null | undefined): string | null {
  if (!yol) return null;
  if (/^https?:\/\//i.test(yol)) return yol;
  return `${SITE}${yol.startsWith("/") ? "" : "/"}${yol}`;
}

/** Butun sayfalarin paylastigi yayinci kimligi. */
export const YAYINCI = {
  "@type": "Organization",
  name: "Fabelo",
  url: SITE,
} as const;

/** Listede bir yaziyi anlatmaya yeten en az sey. Sayfalarin kendi kart
    tipleri (CardPost) bunun ustune oturuyor. */
/**
 * Kirinti yolu — BreadcrumbList.
 *
 * Arama sonucunda adres satirini degistirir:
 *   fabelo.io › how-to-budget-money-a-complete-step-by-step-guide
 * yerine
 *   Fabelo › Personal Finance › How To Budget Money
 *
 * Yol her zaman kokten baslar; cagiran yalnizca kokten SONRASINI verir.
 * Son basamak sayfanin kendisidir ve ona da adres yazilir — schema.org
 * son ogenin adresini istege birakiyor ama vermek, listenin kismi bir
 * yol degil tam bir yol oldugunu soyluyor.
 */
export function kirintiSemasi(basamaklar: { ad: string; yol: string }[]) {
  const hepsi = [{ ad: "Fabelo", yol: "/" }, ...basamaklar];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: hepsi.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.ad,
      item: `${SITE}${b.yol === "/" ? "" : b.yol}`,
    })),
  };
}

export type SemaYazi = {
  slug: string;
  title: string;
};

/**
 * Liste sayfasinin yazilari — ItemList.
 *
 * Sirali bir liste (ItemListOrderDescending degil, position ile) cunku
 * sayfadaki sira yayin tarihine gore ve bu sira bilginin kendisi:
 * en ustteki en yeni yazi.
 *
 * Yalnizca ilk 20 yazi yaziliyor. Sayfada altmisa kadar cikabiliyor ama
 * yapilandirilmis veri sayfanin ozeti; altmis satir onu okunur bir ozet
 * olmaktan cikarip yalnizca buyutur.
 */
function yaziListesi(yazilar: SemaYazi[]) {
  return {
    "@type": "ItemList",
    numberOfItems: yazilar.length,
    itemListElement: yazilar.slice(0, 20).map((y, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/${y.slug}`,
      name: y.title,
    })),
  };
}

/**
 * Kategori ve etiket sayfalari — CollectionPage.
 *
 * Bu sayfalar bir yazi degil, bir DERLEME. Article demek yanlis olurdu:
 * ortada tek bir yazar, tek bir yayin tarihi ve tek bir govde yok.
 */
export function koleksiyonSemasi(opts: {
  ad: string;
  aciklama?: string | null;
  yol: string;
  yazilar: SemaYazi[];
}) {
  const veri: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.ad,
    url: `${SITE}${opts.yol}`,
    isPartOf: { "@type": "WebSite", name: "Fabelo", url: SITE },
    publisher: YAYINCI,
  };
  if (opts.aciklama) veri.description = opts.aciklama;
  if (opts.yazilar.length) veri.mainEntity = yaziListesi(opts.yazilar);
  return veri;
}

/**
 * Yazar sayfasi — ProfilePage, icinde Person.
 *
 * CollectionPage degil: sayfanin konusu yazilarin kendisi degil, o
 * yazilari yazan KISI. Yanit motoru "bunu kim yazdi" diye sordugunda
 * cevap veren sey bu.
 */
export function profilSemasi(opts: {
  ad: string;
  ozgecmis?: string | null;
  gorsel?: string | null;
  yol: string;
  yazilar: SemaYazi[];
}) {
  const kisi: Record<string, unknown> = {
    "@type": "Person",
    name: opts.ad,
    url: `${SITE}${opts.yol}`,
  };
  if (opts.ozgecmis) kisi.description = opts.ozgecmis;
  const gorsel = mutlak(opts.gorsel);
  if (gorsel) kisi.image = gorsel;

  const veri: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE}${opts.yol}`,
    mainEntity: kisi,
    isPartOf: { "@type": "WebSite", name: "Fabelo", url: SITE },
    publisher: YAYINCI,
  };
  if (opts.yazilar.length) veri.hasPart = yaziListesi(opts.yazilar);
  return veri;
}

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

/**
 * Sekme basligina marka adini ekler — zaten varsa eklemez.
 *
 * Bes sabit sayfanin meta_title'i editorde "About Us | Fabelo",
 * kirk yedi yazininki "... - Fabelo" diye yazilmis. Kod bir "| Fabelo"
 * daha ekleyince sekmede "About Us | Fabelo | Fabelo" cikiyordu.
 * Ayrac boru da olabiliyor tire de; ilk denememde yalnizca boruyu
 * aramistim ve butun yazi sayfalari cift markali kalmisti.
 *
 * Basligin KENDISI zaten yalnizca markaysa da eklemiyoruz:
 * /author/fabelo sayfasinda yazarin adi Fabelo ve "Fabelo | Fabelo"
 * cikiyordu.
 */
export function markali(baslik: string): string {
  const t = baslik.trim();
  if (/^fabelo$/i.test(t)) return t;
  return /[|\-–—:·]\s*fabelo\s*$/i.test(t) ? t : `${t} | Fabelo`;
}

/** Goreli yolu mutlak adrese cevirir. schema.org mutlak adres ister. */
export function mutlak(yol: string | null | undefined): string | null {
  if (!yol) return null;
  if (/^https?:\/\//i.test(yol)) return yol;
  return `${SITE}${yol.startsWith("/") ? "" : "/"}${yol}`;
}

/** Bir medya satirindan semaya gereken alanlar. */
export type MedyaKunyesi = {
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  aeoContext?: string | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Gorseli ImageObject olarak yazar.
 *
 * NEDEN DUZ ADRES YETMIYOR: sema `image` alanina duz bir adres de kabul
 * ediyor ve sayfalar oyle basiyordu. Ama duz adres yalnizca "su dosya"
 * diyor; gorselin NE ANLATTIGINI soylemiyor. Yanit motorlari bir
 * gorseli alintilarken aciklamayi metinden tahmin etmek zorunda
 * kaliyordu.
 *
 * Bu yuzden medya satirindaki uc alan buraya bagli:
 *   alt        -> name         (kisa tanim, ekran okuyucunun da okudugu)
 *   caption    -> caption      (okurun gordugu altyazi)
 *   aeoContext -> description  (yalnizca motorlar icin yazilan baglam)
 *
 * aeoContext CMS'te yillardir dolduruluyordu ama yayin tarafinda
 * hicbir yerde kullanilmiyordu: 468 gorselin baglami yazilmis ve tek
 * bir arama motoru gormemisti. Bagladigimiz yer burasi.
 *
 * BOS ALAN YAZILMIYOR (kural: uydurma ya da bos alan konmaz). Elde
 * yalnizca adres varsa geriye duz adres donuyor, ici bos bir
 * ImageObject degil.
 */
export function gorselNesnesi(
  adres: string | null | undefined,
  kunye?: MedyaKunyesi | null,
): string | Record<string, unknown> | null {
  const url = mutlak(adres);
  if (!url) return null;

  const nesne: Record<string, unknown> = {
    "@type": "ImageObject",
    contentUrl: url,
    url,
  };
  let zenginMi = false;

  const ekle = (anahtar: string, deger: unknown) => {
    if (deger === null || deger === undefined || deger === "") return;
    nesne[anahtar] = deger;
    zenginMi = true;
  };

  ekle("name", kunye?.alt?.trim());
  ekle("caption", kunye?.caption?.trim());
  ekle("description", kunye?.aeoContext?.trim());
  // Olculer zenginlik saymiyor: tek baslarina anlam tasimiyorlar.
  if (kunye?.width) nesne.width = kunye.width;
  if (kunye?.height) nesne.height = kunye.height;

  return zenginMi ? nesne : url;
}

/** Butun sayfalarin paylastigi yayinci kimligi. */
/**
 * Yazi, koleksiyon ve profil semalarinin yayincisi.
 *
 * @id ANA SAYFADAKI Organization ile AYNI: yayinSemasi() da
 * `${SITE}/#kurum` kimligini kullaniyor. Ayni kimlik, arama motoru
 * icin "bu iki tanim ayni kurum" demek; farkli kimlikler (ya da hic
 * kimlik olmamasi) her sayfada ayri bir kurum gibi okunuyordu.
 *
 * logo BURADA DA VAR: ana sayfanin Organization'i logoyu tasiyordu
 * ama yazi sayfalarinin publisher'i tasimiyordu ve Article
 * yapilandirilmis verisi yayincinin isaretini bekliyor. Tanim kendi
 * basina eksiksiz olmali, cunku bir yazi sayfasi ana sayfanin
 * @graph'ini basmiyor — yalnizca bu nesneyi basiyor.
 */
export const YAYINCI = {
  "@type": "Organization",
  "@id": `${SITE}/#kurum`,
  name: "Fabelo",
  url: SITE,
  logo: {
    "@type": "ImageObject",
    url: `${SITE}/images/fabelo-logo.png`,
  },
} as const;

/** Yayinin adi ve tanimi — besleme ve sema ayni cumleyi kullansin. */
export const SITE_ADI = "Fabelo";
export const SITE_TANIMI =
  "Personal finance tips, career strategies, and AI tool reviews for ambitious professionals.";

/**
 * Ana sayfanin kimligi — WebSite ve Organization.
 *
 * Butun ic sayfalar isPartOf ile bir WebSite'a isaret ediyordu ama o
 * WebSite'in kendisi hicbir yerde TANIMLI degildi; ana sayfa ne kanonik
 * adres ne de yapilandirilmis veri basiyordu. Yayinin adini, adresini ve
 * isaretini soyleyen tek yer burasi olmali.
 *
 * Iki nesne tek @graph icinde: WebSite'in yayincisi Organization ve
 * ayni kimlige (@id) iki kez isaret ediliyor, yani iki ayri varlik degil
 * birbirine bagli iki tanim.
 */
export function yayinSemasi() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE}/#site`,
        url: `${SITE}/`,
        name: SITE_ADI,
        description: SITE_TANIMI,
        publisher: { "@id": YAYINCI["@id"] },
        inLanguage: "en",
      },
      /* Kurum tanimi BURADA TEKRAR YAZILMIYOR. Once burada YAYINCI'nin
         bir kopyasi duruyordu; ayni kurumun iki ayri tanimi demekti ve
         biri guncellenince oteki geride kaliyordu — logo tam olarak
         boyle ayristi. Tek fark aciklama: ana sayfada kurumun ne
         yaptigini da soyluyoruz, yazi sayfalarinda gereksiz tekrar. */
      { ...YAYINCI, description: SITE_TANIMI },
    ],
  };
}

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

/** Listede bir yaziyi anlatmaya yeten en az sey. Sayfalarin kendi kart
    tipleri (CardPost) bunun ustune oturuyor. */
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

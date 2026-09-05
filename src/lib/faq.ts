import { decodeEntities } from "@/lib/taxonomy";

/**
 * Yazinin icindeki SSS bolumunu bulur.
 *
 * Editordeki AEO hazirlik puani yazida SSS var mi diye bakiyordu ama
 * yayin tarafi onu semaya cevirmiyordu: editor "aferin, SSS koymussun"
 * diyor, disariya hicbir sey soylenmiyordu.
 *
 * SSS'in ayri bir alani YOK. Yazinin govdesinde duruyor ve yapisi
 * butun yazilarda ayni:
 *
 *   <h2 id="frequently-...">Frequently Asked Questions ...</h2>
 *   <h3 id="...">Soru?</h3>
 *   <p>Cevap</p>
 *   <h3 ...>Soru?</h3>
 *   <p>Cevap</p>
 *   <h2>Sonraki bolum</h2>      <- burada biter
 *
 * Bu yuzden yazara yeni bir alan doldurtmuyoruz; halihazirda yazdigi
 * sey okunuyor. Sema sayfada GORUNEN metni anlatiyor, kendi basina bir
 * iddiada bulunmuyor.
 */

export type SoruCevap = { soru: string; cevap: string };

/** Etiketleri atip duz metne indirger. */
function duzMetin(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|li|div)>/gi, " ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function sssCikar(contentHtml?: string | null): SoruCevap[] {
  if (!contentHtml) return [];

  /* SSS baslangici: metni "frequently asked question" gecen bir h2.
     Yalnizca kimlige (id) bakmak yetmez — eski yazilarda id yok. */
  const h2ler = [...contentHtml.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const bas = h2ler.find((m) => /frequently\s+asked\s+question/i.test(duzMetin(m[1])));
  if (!bas || bas.index === undefined) return [];

  const govdeBas = bas.index + bas[0].length;
  // Bolum bir sonraki h2'de biter; yoksa yazinin sonuna kadar surer.
  const sonraki = contentHtml.slice(govdeBas).search(/<h2\b/i);
  const bolum = contentHtml.slice(govdeBas, sonraki === -1 ? undefined : govdeBas + sonraki);

  const cevaplar: SoruCevap[] = [];
  const sorular = [...bolum.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)];
  for (let i = 0; i < sorular.length; i++) {
    const soru = duzMetin(sorular[i][1]);
    const cevapBas = (sorular[i].index ?? 0) + sorular[i][0].length;
    const cevapBit = i + 1 < sorular.length ? sorular[i + 1].index : bolum.length;
    /* Cevap bir sonraki soruya kadar olan HER SEY — bazi cevaplar iki
       paragraf ya da bir liste. Yalnizca ilk <p>'yi almak cevabi
       ortasindan keser ve yarim bir cevap, yanlis bir cevaptir. */
    const cevap = duzMetin(bolum.slice(cevapBas, cevapBit));
    if (soru && cevap) cevaplar.push({ soru, cevap });
  }
  return cevaplar;
}

/**
 * FAQPage semasi.
 *
 * Not: Google 2023'ten beri FAQ zengin sonucunu yalnizca saglik ve devlet
 * sitelerinde gosteriyor, yani bu sema arama sonucunun gorunusunu buyuk
 * ihtimalle degistirmeyecek. Yazilma sebebi yanit motorlari: bir soruya
 * cevap ararken sayfadaki soru-cevap ciftlerini metinden tahmin etmek
 * yerine dogrudan okuyabilsinler.
 *
 * Tek soruluk bolumler yaziliyor ama hic soru yoksa sema hic basilmaz —
 * bos bir FAQPage, olmayan bir sey hakkinda iddiada bulunmak olurdu.
 */
export function sssSemasi(cevaplar: SoruCevap[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cevaplar.map((c) => ({
      "@type": "Question",
      name: c.soru,
      acceptedAnswer: { "@type": "Answer", text: c.cevap },
    })),
  };
}

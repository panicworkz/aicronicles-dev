import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { magazaAcik } from "@/lib/magaza-durumu";

/**
 * robots.txt.
 *
 * Uygulamada hic yoktu. Staging'de nginx kendi robots.txt'sini basiyor
 * (`location = /robots.txt`, "Disallow: /") cunku fabelo.testworkz.com
 * fabelo.io'nun kopyasi ve iki alan adinda ayni icerik indekslenirse
 * yinelenen icerik sorunu dogar. O koruma nginx'te dogru yerde: koda
 * konsaydi uretime de tasinirdi.
 *
 * Ama uretimde de robots.txt YOKTU. Bu dosya olmadan fabelo.io'ya
 * gectigimizde site harita adresini hicbir yerde bildirmemis olurduk;
 * iki harita da yalnizca tahmin edilerek bulunabilirdi. nginx'in
 * bloklamasi bu yaniti golgeledigi icin staging'de degisen bir sey yok
 * — dosya yalnizca uretimde gorunur hale gelir.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  /* Magaza kapaliyken /store disariniyor, acilinca kendiliginden
     kalkiyor. Once elle yazilmisti ve acarken silmeyi unutmak
     magazayi acik ama Google'a kapali birakirdi. */
  const acik = await magazaAcik();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Panel ve uclar arama sonuclarinda isi yok.
        disallow: [
          "/panic",
          "/panic/",
          "/api/",
          "/unsubscribe",
          /* Sepet ve siparis sayfalari magaza ACIKKEN de disarida:
             ikisi de kisiye ozel ekran. */
          "/store/cart",
          "/store/order",
          ...(acik ? [] : ["/store"]),
        ],
      },
    ],
    /* Yalnizca ana harita duyuruluyor. sitemap-news.xml da var ama o
       Google News icin ve yalnizca son 48 saati tasiyor; sitenin
       Publisher Center kaydi olmadan bir ise yaramaz, duyurulunca da
       cogu zaman bos bir dosya olarak taranir. */
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

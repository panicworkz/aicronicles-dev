import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

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
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Panel ve uclar arama sonuclarinda isi yok.
        disallow: ["/panic", "/panic/", "/api/", "/unsubscribe"],
      },
    ],
    sitemap: [`${SITE}/sitemap.xml`, `${SITE}/sitemap-news.xml`],
    host: SITE,
  };
}

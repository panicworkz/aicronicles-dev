import { SITE, mutlak, YAYINCI } from "@/lib/seo";

/**
 * Magazanin ortak dili.
 *
 * Once bu bilgiler bilesenlerin icine dagilmisti: fiyat bicimi bir
 * yerde, urun turu etiketi baska yerde, yapisal veri hic yoktu. Uc
 * ayri sayfa ayni seyi uc ayri sekilde soyluyordu.
 */

/** Veritabanindaki product_type degerleri. */
export type UrunTuru = "physical" | "digital" | "service";

/**
 * Turun okura gorunen adi.
 *
 * Onemli cunku her tur farkli bir soz veriyor: fizikselde kargo,
 * dijitalde aninda erisim, hizmette randevu. Sepet ve odeme adimlari
 * da buna gore degisiyor.
 */
export const TUR_ADI: Record<UrunTuru, string> = {
  physical: "Physical",
  digital: "Digital",
  service: "Service",
};

/** Turun kisa vaadi — kartin altinda tek satir. */
export const TUR_VAADI: Record<UrunTuru, string> = {
  physical: "Shipped to you",
  digital: "Instant download",
  service: "Booked with you",
};

export function turu(deger: unknown): UrunTuru {
  return deger === "digital" || deger === "service" ? deger : "physical";
}

/**
 * Fiyat, URUNUN KENDI para biriminde yaziliyor — cevrilmeden.
 *
 * Magazada bir para birimi cevirici vardi ve fiyatlari guncel kurla
 * baska bir birimde gosteriyordu. Gercek satista bu sorun olur:
 * mesafeli satista fiyatin KESIN olmasi gerekiyor, oysa kur her
 * dakika degisiyor — okura gosterilen tutarla tahsil edilen tutar
 * ayrisirdi. Urun hangi birimde satiliyorsa o birimde yaziliyor.
 */
export function fiyat(tutar: unknown, birim: string = "USD"): string {
  const sayi = Number(tutar ?? 0);
  if (!Number.isFinite(sayi)) return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: birim || "USD",
      minimumFractionDigits: sayi % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(sayi);
  } catch {
    // Taninmayan birim kodu: sayiyi kaybetmektense kodu yaninda yaz.
    return `${sayi} ${birim}`;
  }
}

/** Urun stokta mi — sinirsiz stok isaretliyse her zaman evet. */
export function stokta(urun: {
  unlimitedStock?: boolean | null;
  inventory?: number | null;
  productType?: string | null;
}): boolean {
  // Hizmet ve dijital urunde stok kavrami yok.
  const t = turu(urun.productType);
  if (t !== "physical") return true;
  if (urun.unlimitedStock) return true;
  return (urun.inventory ?? 0) > 0;
}

/**
 * Urun yapisal verisi (schema.org/Product).
 *
 * Yoktu. Arama sonucunda fiyat ve stok durumunun gorunmesi buna bagli;
 * ayrica yapay zeka araclari urunu buradan okuyor.
 *
 * availability ve price GERCEK degerlerden uretiliyor — uydurma bir
 * "InStock" yazmiyoruz.
 */
export function urunSemasi(urun: {
  title: string;
  slug: string;
  description?: string | null;
  featuredImageUrl?: string | null;
  price?: unknown;
  currency?: string | null;
  sku?: string | null;
  productType?: string | null;
  unlimitedStock?: boolean | null;
  inventory?: number | null;
}) {
  const adres = `${SITE}/store/${urun.slug}`;
  const gorsel = mutlak(urun.featuredImageUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: urun.title,
    url: adres,
    ...(urun.description ? { description: urun.description } : {}),
    ...(gorsel ? { image: [gorsel] } : {}),
    ...(urun.sku ? { sku: urun.sku } : {}),
    brand: { "@type": "Brand", name: YAYINCI.name },
    offers: {
      "@type": "Offer",
      url: adres,
      price: String(Number(urun.price ?? 0)),
      priceCurrency: urun.currency || "USD",
      availability: stokta(urun)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: YAYINCI.name },
    },
  };
}

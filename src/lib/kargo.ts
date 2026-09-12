/**
 * KARGO BOLGELERI VE UCRETLERI — SAF HESAP.
 *
 * Bu dosyada veritabani cagrisi YOK, bilerek: hem sepet (tarayici)
 * hem odeme ucu (sunucu) ayni kurali kullaniyor. Icine bir db
 * okumasi koysaydik sunucu kodu tarayici paketine sizardi. Kayitli
 * tarifeyi okuyan taraf lib/kargo-ayar.ts.
 *
 * NEDEN VAR: siparis kaydinda kargo ucreti "0.00" yaziliyordu ve
 * gercek tutar siparisten SONRA konusuluyordu. Yurt ici satista bu
 * idare eder; uluslararasi satista etmiyor. AB'de 2011/83/EU ve
 * Birlesik Krallik'ta Consumer Contracts Regulations 2013, teslimat
 * bedelinin SIPARIS VERILMEDEN ONCE gosterilmesini istiyor — "sonra
 * bildirecegiz" bu sartı karsilamiyor.
 *
 * NEDEN UC BOLGE, NEDEN ULKE ULKE DEGIL: iki yuz kirk dokuz ulkeye
 * tek tek fiyat girmek kimsenin yapmayacagi bir is; girilse bile
 * bakimi imkansiz. Uc bolge, kuryenin gercekten farkli fiyat
 * uyguladigi uc gruba karsilik geliyor ve panelde UC SAYI ile
 * yonetiliyor.
 *
 * NEDEN UCRET UYDURULMUYOR: tarife girilmediginde bu dosya null
 * donuyor ve sepet "dispatch'ten once bildirilecek" diyor — yani
 * bugunku davranis. Ortalama bir rakam yazmak, musteriye yanlis
 * fiyat gostermek olurdu. Panelde bunun uyarisi duruyor.
 */

export type BolgeKodu = "tr" | "avrupa" | "dunya";

/** Panelde girilen ucretler. null = girilmemis. */
export type KargoTarifesi = Record<BolgeKodu, number | null>;

export const BOS_TARIFE: KargoTarifesi = { tr: null, avrupa: null, dunya: null };

/* AB + AEA + Birlesik Krallik + Isvicre. "Avrupa" burada cografi
   degil TASIMA bolgesi: kuryenin ayni tarifeyi uyguladigi alan. */
const AVRUPA = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "CH", "GB",
]);

export const BOLGELER: { kod: BolgeKodu; ad: string; aciklama: string }[] = [
  { kod: "tr", ad: "Türkiye", aciklama: "Domestic shipments." },
  { kod: "avrupa", ad: "Europe", aciklama: "EU, EEA, United Kingdom and Switzerland." },
  { kod: "dunya", ad: "Rest of world", aciklama: "Everywhere else — this is the fallback." },
];

/** Ulke kodundan bolge. Bilinmeyen her yer "dunya". */
export function bolgesi(ulkeKodu?: string | null): BolgeKodu {
  const k = String(ulkeKodu ?? "").trim().toUpperCase();
  if (k === "TR") return "tr";
  if (AVRUPA.has(k)) return "avrupa";
  return "dunya";
}

/**
 * Bu siparisin kargo ucreti.
 *
 * @returns Ucret; tarife girilmemisse null — "bilmiyoruz" ile
 *   "bedava" ayni sey degil ve sifir yazmak ikincisini soylerdi.
 */
export function kargoUcreti(
  tarife: KargoTarifesi,
  ulkeKodu?: string | null,
  fizikselVarMi = true
): number | null {
  /* Yalnizca dijital urun varsa tasinacak bir sey yok: ucret sifir
     ve bu bir tahmin degil, kesin bilgi. */
  if (!fizikselVarMi) return 0;
  const u = tarife[bolgesi(ulkeKodu)];
  return typeof u === "number" && Number.isFinite(u) && u >= 0 ? u : null;
}

/** Serbest bir degeri tarifeye cevirir — panelden de buradan geciyor. */
export function tarifeyiOku(deger: unknown): KargoTarifesi {
  const g = (deger ?? {}) as Record<string, unknown>;
  const sayi = (x: unknown): number | null => {
    if (x === null || x === undefined || x === "") return null;
    const n = typeof x === "number" ? x : Number(String(x).replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  return { tr: sayi(g.tr), avrupa: sayi(g.avrupa), dunya: sayi(g.dunya) };
}

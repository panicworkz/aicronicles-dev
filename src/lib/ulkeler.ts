/**
 * ULKE LISTESI.
 *
 * NEDEN GEREKTI: sepetteki ulke alani SERBEST METINDI. "Germany",
 * "Deutschland", "DE", "almanya" — hepsi kabul ediliyordu ve hicbiri
 * kargo bolgesiyle eslesemiyordu. Ucreti siparisten once gostermek
 * icin once "burasi neresi" sorusunun makinece cevaplanabilir olmasi
 * gerekiyor.
 *
 * NEDEN ADLAR YAZILI DEGIL: iki yuz kirk dokuz ulke adini elle
 * yazmak, hem uzun bir liste hem de bakim yuku (ad degisiklikleri,
 * yazim tercihleri). Adlar Intl.DisplayNames'ten geliyor — tarayici
 * ve Node ikisinde de var, ceviri de bedava geliyor: ileride dil
 * destegi gelince ayni kodlar Turkce adlarla cikacak.
 */

/* ISO 3166-1 alpha-2. Sirasi onemsiz: adlarina gore siralaniyor. */
const KODLAR =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ " +
  "BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR " +
  "CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU " +
  "ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ " +
  "LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ " +
  "MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF " +
  "PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI " +
  "SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR " +
  "TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW";

export type Ulke = { kod: string; ad: string };

let onbellek: Ulke[] | null = null;

/** Ada gore sirali ulke listesi. */
export function ulkeler(): Ulke[] {
  if (onbellek) return onbellek;

  /* Intl her ortamda tam ICU ile gelmeyebiliyor; gelmezse kodun
     kendisi gosteriliyor. Bos bir liste gostermekten iyi. */
  let adlar: Intl.DisplayNames | null = null;
  try {
    adlar = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    adlar = null;
  }

  onbellek = KODLAR.split(" ")
    .map((kod) => ({ kod, ad: adlar?.of(kod) ?? kod }))
    .sort((a, b) => a.ad.localeCompare(b.ad, "en"));

  return onbellek;
}

/** Kod gecerli mi — sunucuda gelen degeri dogrulamak icin. */
export function ulkeGecerli(kod: unknown): boolean {
  const k = String(kod ?? "").trim().toUpperCase();
  return k.length === 2 && KODLAR.includes(k);
}

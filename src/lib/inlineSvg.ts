import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Reklam afislerini sayfaya gomer.
 *
 * NEDEN: afisler <img src="...svg"> olarak basiliyordu. Bir <img>
 * icindeki SVG'de bilesik katman (compositing layer) yoktur — tarayici
 * her karede goruntunun TAMAMINI islemcide yeniden tarar, animasyonun
 * transform mu opacity mi oldugu fark etmez. Dort afis ekrandayken bu
 * saniyede ~49 milyon piksel demekti.
 *
 * Gomulu SVG'de her animasyonlu oge kendi katmanina alinabiliyor ve
 * transform/opacity animasyonlari GPU'da yurutuluyor; islemci yeniden
 * tarama yapmiyor.
 *
 * GUVENLIK: burada sayfaya HAM ISARETLEME giriyor, dolayisiyla:
 *   - Yalnizca kendi medya dizinimizdeki dosyalar okunuyor; adres
 *     disaridan geliyor ama dosya yolu normalize edilip dizin disina
 *     cikilamadigi dogrulaniyor.
 *   - Betik, olay isleyicisi ve disariya cikan basvurular temizleniyor.
 * Yonetici panelinden herhangi bir adres girilebildigi icin bu iki
 * onlem de gerekli; biri olmazsa panele erisen biri sayfaya kod
 * sokabilir.
 */

const MEDYA = process.env.MEDIA_DIR || "/opt/panic/media";


/** Dosya adindan kisa, kararli bir ek uret */
function ek(adres: string): string {
  let h = 2166136261;
  for (let i = 0; i < adres.length; i++) {
    h ^= adres.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "a" + (h >>> 0).toString(36);
}

/**
 * Afisin id'lerini benzersiz yapar.
 *
 * Gomulu afisler ayni belgede duruyor ve hepsi ayni id'leri kullaniyor
 * (kagit, isik, marka). url(#kagit) ilk buldugu tanima baglanir, yani
 * bir afisin degradesi digerine uygulanir.
 *
 * SINIF ve KEYFRAME adlari icin burada bir sey yapmiyoruz: onlar zaten
 * uretecte markaya ozel yaziliyor (scripts/banners/ortak.py). Daha once
 * stil kurallarini duzenli ifadeyle kapsamlamayi denemistik; o yol
 * "@keyframes h0" kuralinin da onune secici koyuyor, kural gecersiz
 * oluyor ve tarayici animasyonlarin TAMAMINI atiyordu.
 */
function kimlikleriBenzersizle(svg: string, adres: string): string {
  const e = ek(adres);
  const idler = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

  for (const kimlik of new Set(idler)) {
    const kacir = kimlik.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    svg = svg
      .replace(new RegExp(`(\\sid=")${kacir}(")`, "g"), `$1${kimlik}-${e}$2`)
      .replace(new RegExp(`url\\(#${kacir}\\)`, "g"), `url(#${kimlik}-${e})`)
      .replace(new RegExp(`((?:xlink:)?href=")#${kacir}(")`, "g"), `$1#${kimlik}-${e}$2`);
  }
  return svg;
}

/** Sayfaya girmeden once tehlikeli her seyi cikar */
function temizle(svg: string): string {
  return (
    svg
      // Betikler
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
      // on* olay isleyicileri
      .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      /* javascript: ve data: basvurulari.
         TEK istisna: base64 kodlu RASTER gorseller (png/jpeg/gif/webp).
         Afisler markalarin logosunu bu bicimde iceride tasiyor; kural
         once hepsini siliyordu ve logolar sayfada hic gorunmuyordu.
         Raster bir gorsel betik calistiramaz. data:image/svg+xml
         BILEREK disarida: SVG betik tasiyabilir. */
      .replace(
        /(href|xlink:href)\s*=\s*(["'])\s*(?!data:image\/(?:png|jpeg|jpg|gif|webp);base64,)(?:javascript|data):[^"']*\2/gi,
        ""
      )
      // Disariya giden yuklemeler
      .replace(/<(?:image|use)\b[^>]*(?:href|xlink:href)\s*=\s*["']https?:[^"']*["'][^>]*>/gi, "")
      .trim()
  );
}

/**
 * /media/... adresindeki SVG'yi okur ve gomulmeye hazir halde dondurur.
 * Dosya yoksa, SVG degilse ya da dizin disina cikiyorsa null doner —
 * cagiran taraf o zaman <img>'e duser.
 */
export const gomulecekSvg = cache(async (adres: string): Promise<string | null> => {
  if (!adres.startsWith("/media/") || !adres.toLowerCase().endsWith(".svg")) return null;

  const dosya = path.normalize(path.join(MEDYA, adres.slice("/media/".length)));
  // Dizin disina cikma denemesi (../) burada yakalaniyor
  if (!dosya.startsWith(path.normalize(MEDYA) + path.sep)) return null;

  try {
    const ham = await readFile(dosya, "utf8");
    if (!/^\s*<svg[\s>]/i.test(ham)) return null;
    return kimlikleriBenzersizle(temizle(ham), adres);
  } catch {
    return null;
  }
});

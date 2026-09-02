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
 * Afisi kendi kapsamina alir.
 *
 * Gomulu SVG'ler artik AYNI belgede duruyor ve hepsi ayni sinif
 * adlarini (.o0, .k0, .disp) ve ayni id'leri (kagit, marka) kullaniyor.
 * Kapsamlanmazsa bir afisin stili digerine uyguluyor, url(#kagit) ilk
 * bulduguna baglaniyor ve afisler birbirini bozuyor.
 *
 * Iki islem yapiyoruz:
 *   1. Butun id'lere afise ozel bir ek getiriyoruz ve onlara yapilan
 *      basvurulari (url(#..), href="#..") ayni sekilde guncelliyoruz.
 *   2. Stil kurallarini koke konan data-ad niteligiyle sinirliyoruz,
 *      boylece sinif adlari carpismiyor.
 */
function kapsamla(svg: string, adres: string): string {
  const e = ek(adres);

  // 1) id'ler ve onlara yapilan basvurular
  const idler = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const kimlik of new Set(idler)) {
    const kacir = kimlik.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    svg = svg
      .replace(new RegExp(`(\\sid=")${kacir}(")`, "g"), `$1${kimlik}-${e}$2`)
      .replace(new RegExp(`url\\(#${kacir}\\)`, "g"), `url(#${kimlik}-${e})`)
      .replace(new RegExp(`((?:xlink:)?href=")#${kacir}(")`, "g"), `$1#${kimlik}-${e}$2`);
  }

  // 2) Stil kurallarini bu afise sinirla
  svg = svg.replace(/<style>([\s\S]*?)<\/style>/i, (_tam, govde: string) => {
    const sinirli = govde.replace(
      // Bir kural blogunun secici kismi — @keyframes ve @media govdeleri disinda
      /(^|\}|\*\/)\s*([^@{}\/][^{}]*?)\s*\{/g,
      (esles: string, onek: string, secici: string) => {
        // Yuzde adimlari (0%, 50%) ve keyframe adlari secici degildir
        if (/^[\d.%,\s]+$/.test(secici) || /^(from|to)$/i.test(secici.trim())) return esles;
        const yeniSecici = secici
          .split(",")
          .map((x: string) => `[data-ad="${e}"] ${x.trim()}`)
          .join(", ");
        return `${onek} ${yeniSecici} {`;
      }
    );
    return `<style>${sinirli}</style>`;
  });

  // 3) Koke isaret koy
  return svg.replace(/^(\s*<svg\b)/i, `$1 data-ad="${e}"`);
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
      // javascript: ve data: basvurulari
      .replace(/(href|xlink:href)\s*=\s*(["'])\s*(?:javascript|data):[^"']*\2/gi, "")
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
    return kapsamla(temizle(ham), adres);
  } catch {
    return null;
  }
});

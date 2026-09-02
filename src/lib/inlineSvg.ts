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
    return temizle(ham);
  } catch {
    return null;
  }
});

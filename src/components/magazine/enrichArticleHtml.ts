/**
 * Yazi govdesindeki <img> etiketlerine genislik/yukseklik basar.
 *
 * Neden gerekli: Ghost'tan gelen icerikte gorseller boyutsuz ve lazy geliyor.
 * Tarayici yer ayiramadigi icin gorseller yuklendikce sayfa uzuyor; icindekiler
 * listesinden asagidaki bir basliga atlayinca hedef kayiyor ve okuyucu once
 * yanlis yere gidip sonra sicrama goruyor.
 *
 * Medya tablosunda 509 kaydin tamaminda olcu var; dosya adindan eslestirip
 * width/height basiyoruz. Boylece tarayici daha ilk boyamada dogru yuksekligi
 * ayiriyor: hem cipa kaymasi hem de gorsel yuklendikce olusan zipzip biter.
 */

export type MediaBoyut = { width: number | null; height: number | null };

/**
 * URL'nin kendisinde olcu ipucu var mi?
 *   quickchart.io/chart?w=1400&h=700   -> 1400x700
 *   .../size/w1200/...                 -> genislik 1200
 *   ...?w=1200                         -> genislik 1200
 * Yalniz genislik bulunursa 3:2 varsayilan oraniyla yukseklik uretiyoruz;
 * amac piksel dogrulugu degil, tarayicinin YER AYIRMASI.
 */
function urldenOlcu(src: string): MediaBoyut | null {
  const w = Number(src.match(/[?&]w=(\d{2,5})/)?.[1] ?? src.match(/\/size\/w(\d{2,5})\//)?.[1]);
  const h = Number(src.match(/[?&]h=(\d{2,5})/)?.[1]);
  if (w && h) return { width: w, height: h };
  if (w) return { width: w, height: Math.round((w * 2) / 3) };
  return null;
}

/** URL'den dosya adini cikar: /media/foo-123.webp -> foo-123.webp */
function dosyaAdi(src: string): string {
  try {
    const temiz = src.split("?")[0].split("#")[0];
    return decodeURIComponent(temiz.substring(temiz.lastIndexOf("/") + 1));
  } catch {
    return "";
  }
}

export function enrichArticleHtml(
  html: string | null | undefined,
  boyutlar: Map<string, MediaBoyut>
): string {
  if (!html) return "<p></p>";

  return html.replace(/<img\b[^>]*>/gi, (etiket) => {
    // Zaten olculendirilmisse dokunma
    if (/\bwidth\s*=/i.test(etiket) && /\bheight\s*=/i.test(etiket)) return etiket;

    const src = etiket.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) return etiket;

    // Once yerel medya kaydi, sonra URL ipucu
    const olcu = boyutlar.get(dosyaAdi(src)) ?? urldenOlcu(src);
    const govde = etiket.replace(/\s*\/?>$/, "");

    if (olcu?.width && olcu?.height) {
      return `${govde} width="${olcu.width}" height="${olcu.height}">`;
    }

    // Olcusu hic bilinemeyen gorsel: tembel birakirsak okuyucu asagi
    // atladiginda yuklenip sayfayi uzatiyor ve cipa kayiyor. Bunlari sayfa
    // aciilirken yukle; oncelikligi dusuk tutup manseti yavaslatmiyoruz.
    const eager = govde
      .replace(/\s*loading\s*=\s*["'][^"']*["']/i, "")
      .replace(/\s*fetchpriority\s*=\s*["'][^"']*["']/i, "");
    return `${eager} loading="eager" fetchpriority="low">`;
  });
}

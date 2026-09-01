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
  if (boyutlar.size === 0) return html;

  return html.replace(/<img\b[^>]*>/gi, (etiket) => {
    // Zaten olculendirilmisse dokunma
    if (/\bwidth\s*=/i.test(etiket) && /\bheight\s*=/i.test(etiket)) return etiket;

    const src = etiket.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) return etiket;

    const olcu = boyutlar.get(dosyaAdi(src));
    if (!olcu?.width || !olcu?.height) return etiket;

    // Kendi kendine kapanan etiketi bozmadan nitelikleri ekle
    const govde = etiket.replace(/\s*\/?>$/, "");
    return `${govde} width="${olcu.width}" height="${olcu.height}">`;
  });
}

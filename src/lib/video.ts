import { isaretleriDoldurSenkron } from "./blok-doldur.ts";

/**
 * VIDEO BLOGUNU OKUMA ANINDA BASAR.
 *
 * Govdede duran sey yalnizca bir kimlik:
 *   <div data-blok="video" data-saglayici="youtube" data-video="ABC"></div>
 *
 * NEDEN IFRAME KAYDEDILMIYOR: blok semasi iframe'i yasakliyor ve bu
 * dogru — kaydedilen icerik calistirilabilir bir sey icermemeli.
 * Kimligi saklamak hem guvenli hem de saglayiciyi sonradan
 * degistirmeyi mumkun kiliyor.
 *
 * TIKLAYINCA YUKLENIYOR (facade). Gomulu oynatici sayfa acilir
 * acilmaz yuklenseydi her yazi birkac yuz kilobayt ucuncu taraf kod
 * ve izleyici cerezi tasirdi — okumaya baslamadan once. Once yalnizca
 * kapak gorseli basiliyor; oynatici ancak tiklanınca geliyor.
 */

function kacir(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Kimlikte yalnizca saglayicilarin kullandigi karakterler kabul
   ediliyor. Bu bir guvenlik siniri: kimlik dogrudan bir adrese
   giriyor. */
const GECERLI = /^[A-Za-z0-9_-]{5,20}$/;

/** Adresten video kimligi cikarir; taninmazsa null. */
export function videoKimligi(
  adres: string
): { saglayici: "youtube" | "vimeo"; videoId: string } | null {
  const a = adres.trim();
  const yt =
    a.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/);
  if (yt) return { saglayici: "youtube", videoId: yt[1] };
  const vm = a.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
  if (vm) return { saglayici: "vimeo", videoId: vm[1] };
  /* Ciplak kimlik de kabul: yazar adresi degil kimligi yapistirmis
     olabilir. */
  if (GECERLI.test(a)) return { saglayici: "youtube", videoId: a };
  return null;
}

export function videoBloklariniDoldur(html?: string | null): string {
  if (!html) return "";

  return isaretleriDoldurSenkron(html, "video", (isaretOge) => {
    const saglayici =
      isaretOge.getAttribute("data-saglayici") === "vimeo" ? "vimeo" : "youtube";
    const kimlik = isaretOge.getAttribute("data-video") ?? "";
    const baslik = isaretOge.getAttribute("data-baslik") ?? "";

    /* Gecersiz kimlikte isaret OLDUGU GIBI birakiliyor: silseydik
       yazarin koydugu blok sessizce kaybolur ve kimse fark etmezdi. */
    if (!GECERLI.test(kimlik)) return isaretOge.outerHTML;

    const kapak =
      saglayici === "youtube"
        ? `https://i.ytimg.com/vi/${kimlik}/hqdefault.jpg`
        : "";
    const gomme =
      saglayici === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${kimlik}?autoplay=1`
        : `https://player.vimeo.com/video/${kimlik}?autoplay=1`;

    const ad = baslik ? kacir(baslik) : "Play video";

    return (
      `<div class="video" data-blok="video" data-saglayici="${saglayici}" data-video="${kacir(kimlik)}"` +
      (baslik ? ` data-baslik="${kacir(baslik)}"` : "") +
      `>` +
      `<button type="button" class="video-kapak" data-gomme="${kacir(gomme)}" aria-label="${ad}">` +
      (kapak
        ? `<img src="${kapak}" alt="" loading="lazy">`
        : `<span class="video-bos"></span>`) +
      `<span class="video-oynat" aria-hidden="true"></span>` +
      `</button>` +
      (baslik ? `<div class="video-baslik">${kacir(baslik)}</div>` : "") +
      `</div>`
    );
  });
}

import { parse, HTMLElement, NodeType } from "node-html-parser";
import {
  TEHLIKELI,
  SEFFAF,
  etiketGecerli,
  oznitelikGecerli,
  icBaglantiMi,
  stiliTemizle,
} from "./blok-sema.ts";
/* Goreli yol bilerek: bu dosyayi goc ve olcum betikleri de dogrudan
   Node ile calistiriyor ve orada "@/" takma adi cozulmuyor. */

/**
 * BLOK MODELI.
 *
 * Yazi govdesi tek parca HTML yerine bir blok dizisi olarak tutuluyor.
 * Boylece bir paragrafi tasimak, cogaltmak, silmek ya da araya yeni bir
 * TUR blok koymak mumkun oluyor — sayfanin uzerinde, yerinde.
 *
 * ---------------------------------------------------------------
 * EN ONEMLI KARAR: contentHtml SILINMIYOR, TURETILIYOR.
 *
 * Bloklar dogruluk kaynagi; content_html ise her kayitta bloklardan
 * yeniden uretilen bir kopya. Sebebi somut: content_html'e bagli 22
 * dosya var — RSS, llms.txt, SSS cikarimi (lib/faq.ts), AEO puani,
 * surum gecmisi, kopilot, magaza urunleri, sabit sayfalar. Bloklari
 * dogruluk kaynagi yapip HTML'i uretmek, o 22 dosyanin HICBIRINE
 * dokunmadan blok duzenlemeyi mumkun kiliyor.
 *
 * Alternatifi — HTML'i tamamen kaldirmak — her birini yeniden yazmak
 * ve 47 yayindaki yaziyi riske atmak olurdu.
 * ---------------------------------------------------------------
 *
 * KAYIP OLMAMASI: taninmayan her sey "ham" bloguna dusuyor ve oldugu
 * gibi basiliyor. Yani ayristirici bir seyi anlamasa bile icerik
 * kaybolmuyor, yalnizca duzenlenebilir olmuyor. Gocun guvenli olmasini
 * saglayan sey bu.
 */

/**
 * Modellemedigimiz oznitelikler.
 *
 * Olcum sirasinda uc sey kayboluyordu: bir baslikta satir ici style,
 * bir gorselde title ve data-caption. Bunlari tek tek alanlara
 * cevirmek her yeni oznitelikte ayni isi tekrar yaptirirdi. Torba
 * yaklasimi kalici: tanimadigimiz ne varsa duruyor ve geri yaziliyor.
 */
export type BlokOz = Record<string, string>;

export type Blok =
  | { t: "paragraf"; html: string; oz?: BlokOz }
  | { t: "baslik"; seviye: 2 | 3 | 4; html: string; id?: string; sinif?: string; oz?: BlokOz }
  | {
      t: "liste";
      sirali: boolean;
      ogeler: string[];
      /* KONTROL LISTESI. Isaretler ayri bir dizide tutuluyor cunku
         "ogeler" yalnizca maddenin ICERIGINI saklıyor; kutunun dolu
         mu bos mu oldugu madde metninin parcasi degil. Ayni dizide
         tutsaydik metni her degistirdigimizde isaret de bozulurdu. */
      isaretler?: boolean[];
      oz?: BlokOz;
    }
  | {
      t: "gorsel";
      src: string;
      alt?: string;
      altyazi?: string;
      genis?: boolean;
      /* Gorseli saran baglanti. Ghost'ta gorsele tiklayinca gidilen
         adres boyle tutuluyor; bir yazida video baglantisi yalnizca
         burada duruyordu. */
      baglanti?: string;
      /* figure'suz, dogrudan govdeye konmus gorsel. Isaretlenmezse
         cikista figure'e sariliyor ve sayfa duzeni degisiyor. */
      ciplak?: boolean;
      /* figure'un kendi sinifi — yeniden uretmek yerine oldugu gibi
         saklaniyor: Ghost'un sinif dizilimi surumden surume degisiyor. */
      sinif?: string;
      /* img uzerindeki modellenmemis oznitelikler (title, data-caption,
         width, height...). */
      oz?: BlokOz;
    }
  | { t: "tablo"; html: string }
  | { t: "ayrac" }
  /* Alinti — "vurgulu" hali one cikan alinti (pull quote). Ayri bir
     tur acmadik: ayni sey, farkli agirlikta. */
  | { t: "alinti"; html: string; vurgulu?: boolean; oz?: BlokOz }
  /* URUN KARTI — blok modelinin asil gerekcesi.
     HTML'in ifade edemedigi bir sey: govdede duran sey bir isaret,
     icerigi (ad, fiyat, stok, gorsel) okuma aninda veritabanindan
     geliyor. Yazinin icine fiyat yazsaydik urun degistiginde yazi
     yalan soylerdi. Yazar yalnizca "su urun burada dursun" diyor. */
  | { t: "urun"; urunId: number }
  /* ICINDEKILER — urun karti gibi, icerigi okuma aninda uretiliyor.
     Elle yazilmis bir baglanti listesi olsaydi baslik degistiginde
     ya da yeni bolum eklendiginde liste yalan soylemeye baslardi ve
     kimse fark etmezdi. Yazar yalnizca "burada icindekiler dursun"
     ve hangi seviyeler diyor. */
  | { t: "icindekiler"; seviyeler: number[] }

  /* ---- ICERIGI KENDI ICINDE OLAN TURLER ----
     Bunlarin metni blogun icinde duruyor, yani sayfanin uzerinde
     dogrudan yazilabiliyorlar. Veriye bagli olanlardan (urun,
     icindekiler, video) farki bu. */

  /* Kutu — bilgi, uyari, ipucu ve OZET. Dordu ayri tur olabilirdi;
     tek tur + bicim alani yapildi cunku aralarindaki fark yalnizca
     gorunum. Dort ayri tur, dort ayri ayristirma ve dort ayri basim
     kurali demekti. */
  | {
      t: "kutu";
      tur: "bilgi" | "uyari" | "ipucu" | "ozet";
      baslik?: string;
      html: string;
    }
  /* Artilar ve eksiler — iki sutun. */
  | { t: "artilar"; artilar: string[]; eksiler: string[]; artiBaslik?: string; eksiBaslik?: string }
  /* Sayi vurgusu. */
  | { t: "istatistik"; ogeler: { sayi: string; etiket: string }[] }
  /* Adim adim. */
  | { t: "adimlar"; ogeler: { baslik: string; html: string }[] }
  /* Kaynakca. */
  | { t: "kaynakca"; ogeler: string[] }
  /* Cagri kutusu. */
  | { t: "cta"; baslik: string; metin?: string; dugmeMetni: string; adres: string }
  /* Video — govdede yalnizca kimlik duruyor, oynatici okuma aninda
     basiliyor. Sema iframe'i yasakliyor ve bu DOGRU: kaydedilen sey
     bir kimlik, calistirilabilir bir sey degil. */
  | { t: "video"; saglayici: "youtube" | "vimeo"; videoId: string; baslik?: string }
  /* Galeri. */
  | { t: "galeri"; sutun: 2 | 3 | 4; gorseller: { src: string; alt?: string }[] }
  /* Iki sutun — yan yana iki metin alani. */
  | { t: "sutunlar"; sol: string; sag: string }
  /* Cubuk grafik. Bir grafik kitapligi YOK: degerler dogrudan
     CSS genisligine cevriliyor. Kitaplik okura yuzlerce kilobayt
     JavaScript indirtirdi, ustelik yazdirmada ve ekran okuyucuda
     bos bir tuval kalirdi. Boyle basildiginda sayilar metin olarak
     duruyor. */
  | {
      t: "grafik";
      baslik?: string;
      ogeler: { etiket: string; deger: number; gosterim?: string }[];
    }
  /* Kacis kapisi: ayristiricinin tanimadigi her sey. Oldugu gibi
     basiliyor, yani icerik asla kaybolmuyor. */
  | { t: "ham"; html: string };

/**
 * Baslik metninden cipa kimligi.
 *
 * Var olan kimliklerle ayni bicimde uretiliyor (kucuk harf, tireli),
 * yoksa ayni yazi icinde iki farkli kimlik uslubu olurdu.
 */
export function baslikKimligi(metin: string): string {
  const harita: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return metin
    .trim()
    .toLowerCase()
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (k) => harita[k] ?? k)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Ozniteliklerin HTML'e geri yazilmasi icin. */
function oznitelik(ad: string, deger?: string | null): string {
  if (!deger) return "";
  const kacisli = deger
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return ` ${ad}="${kacisli}"`;
}

/** Ozniteliklerin tamamini geri yazar. */
function ozYaz(oz?: BlokOz): string {
  if (!oz) return "";
  return Object.entries(oz)
    .map(([k, v]) => oznitelik(k, v))
    .join("");
}

/**
 * Modellenmis olanlarin DISINDA kalan oznitelikler.
 * Bos deger tasiyanlar atiliyor: id="" gibi seyler HTML'de hicbir sey
 * yapmiyor, saklamak blogu gereksiz sisirirdi.
 */
function ozEk(oge: HTMLElement, modellenen: string[]) {
  const oz = kalanOz(oge, modellenen);
  return oz ? { oz } : {};
}

function kalanOz(oge: HTMLElement, modellenen: string[]): BlokOz | undefined {
  const kalan: BlokOz = {};
  for (const [k, v] of Object.entries(oge.attributes)) {
    if (modellenen.includes(k) || !v) continue;
    kalan[k] = v;
  }
  return Object.keys(kalan).length ? kalan : undefined;
}

/**
 * SEMAYI UYGULAR — kayit noktasindaki guvence.
 *
 * Payload'in editorunde sema zorlamasi var: gecersiz isaretleme
 * uretmek mumkun degil. Bizde o zorlama BURADA, yani yazmadan
 * hemen once. Istemcideki suzgec (blok-metin.ts) yalnizca deneyim
 * icin; panele baska yollardan gelen icerik — kopilot, toplu islem,
 * elle API cagrisi — o suzgecten gecmiyor, buradan geciyor.
 *
 * Uc ayri islem yapiyor ve ucu de farkli bir seyi koruyor:
 *   · TEHLIKELI etiketler icerigiyle SILINIYOR (script, iframe...):
 *     bunlarin icerigi metin degil, sayfaya kod sokma yolu.
 *   · SEFFAF ve taninmayan etiketler ACILIYOR (span, font...):
 *     silseydik metnin kendisi kaybolurdu; anlam tasimadiklari icin
 *     yalnizca kabuklari atiliyor.
 *   · Izinsiz oznitelikler siliniyor: onclick gibi olaylar,
 *     javascript: adresleri ve metin bloklarindaki satir ici stiller.
 */
function semayiUygula(kok: HTMLElement) {
  const gez = (dugum: HTMLElement) => {
    for (const cocuk of [...dugum.childNodes]) {
      if (cocuk.nodeType !== NodeType.ELEMENT_NODE) continue;
      const oge = cocuk as HTMLElement;
      const etiket = (oge.tagName ?? "").toLowerCase();

      if (TEHLIKELI.has(etiket)) {
        oge.remove();
        continue;
      }

      gez(oge);

      if (SEFFAF.has(etiket) || !etiketGecerli(etiket)) {
        /* Icerigi yerine geciyor: kabuk gidiyor, metin kaliyor. */
        oge.replaceWith(...oge.childNodes);
        continue;
      }

      for (const [ad, deger] of Object.entries(oge.attributes)) {
        if (!oznitelikGecerli(etiket, ad, deger ?? "")) {
          oge.removeAttribute(ad);
          continue;
        }
        /* Izinli style'in ICI de suzuluyor: duzenleme izleri
           (outline, opacity, cursor) icerigin parcasi degil. */
        if (ad.toLowerCase() === "style") {
          const temiz = stiliTemizle(deger ?? "");
          if (temiz) oge.setAttribute("style", temiz);
          else oge.removeAttribute("style");
        }
      }

      /* IC BAGLANTIDA target ve rel YOK.
         Icindekiler listesindeki "#baslik" baglantilari target="_blank"
         ile kaydedilmisti; okur icindekilere tiklayinca AYNI SAYFA yeni
         sekmede aciliyordu. Ayrica sayfa ici bir cipaya nofollow
         yazmak anlamsiz. Dis baglantilarda ikisi de anlamli, onlara
         dokunulmuyor. */
      if (etiket === "a" && icBaglantiMi(oge.getAttribute("href") ?? "")) {
        oge.removeAttribute("target");
        oge.removeAttribute("rel");
      }
    }
  };
  gez(kok);
}

/* ==================================================================
   HTML  →  BLOKLAR
   ================================================================== */

export function htmlBloklara(html?: string | null): Blok[] {
  if (!html || !html.trim()) return [];

  const kok = parse(html, {
    /* Bosluklar korunuyor: aralarindaki bosluklari yutmak, ayni
       satirda duran ogelerin birlesmesine yol aciyor. */
    blockTextElements: { script: true, style: true, pre: true },
  });

  /* Sema HER SEYDEN ONCE: blok cikarimi artik yalnizca gecerli bir
     agac uzerinde calisiyor, her blok turu icin ayri ayri
     temizlemek gerekmiyor. */
  semayiUygula(kok as HTMLElement);

  const bloklar: Blok[] = [];

  for (const dugum of kok.childNodes) {
    /* CIPLAK METIN. Veride 152 tane var; yalnizca ogelere baksaydik
       hepsi sessizce kaybolurdu. Paragrafa sariliyorlar. */
    if (dugum.nodeType === NodeType.TEXT_NODE) {
      const metin = dugum.rawText.trim();
      if (metin) bloklar.push({ t: "paragraf", html: metin });
      continue;
    }
    if (dugum.nodeType !== NodeType.ELEMENT_NODE) continue;

    const oge = dugum as HTMLElement;
    const etiket = oge.tagName?.toLowerCase();

    /* ISARETLER TEMIZLENIYOR.
       data-blok-i / data-blok-t sunucunun basim sirasinda ekledigi
       kolaylik isaretleri, icerigin parcasi degil. Onizlemede
       duzenlenen govde panele isaretleriyle birlikte gidiyor; burada
       silinmezlerse once "modellenmemis oznitelik" torbasina, oradan
       da veritabanina yazilirlar ve her kayitta birikirlerdi. */
    oge.removeAttribute("data-blok-i");
    oge.removeAttribute("data-blok-t");
    /* Duzenleme artiklari da temizleniyor: onizlemede her blok kendi
       duzenlenebilir alani oldugu icin govde panele contenteditable
       ve spellcheck ile birlikte gidiyor. Silinmezlerse veritabanina
       yazilir ve okurun sayfasinda da duzenlenebilir bloklar olurdu. */
    oge.removeAttribute("contenteditable");
    oge.removeAttribute("spellcheck");
    /* Duzenleme yuzeyinin kendi isaretleri (secim, surukleme). */
    for (const ad of Object.keys(oge.attributes)) {
      if (ad.startsWith("data-panic-")) oge.removeAttribute(ad);
    }

    /* ISARET ETIKETTEN ONCE GELIYOR.
       Bu turlerin bir kismi taninan etiketler kullaniyor: "adimlar"
       bir ol, "kutu" bir aside. Etikete gore dagitim yapsaydik
       adimlar siradan bir numarali liste, kutu ise "ham HTML" olurdu
       — ikisi de duzenlenemez hale gelirdi. */
    const isaret = oge.getAttribute("data-blok");
    if (isaret && isaret !== "urun" && isaret !== "icindekiler") {
      const ozelBlok = isaretliBlok(isaret, oge);
      if (ozelBlok) {
        bloklar.push(ozelBlok);
        continue;
      }
    }

    switch (etiket) {
      case "p":
        bloklar.push({ t: "paragraf", html: oge.innerHTML, ...ozEk(oge, []) });
        break;

      case "h2":
      case "h3":
      case "h4":
        bloklar.push({
          t: "baslik",
          seviye: Number(etiket[1]) as 2 | 3 | 4,
          html: oge.innerHTML,
          /* Kimligi OLMAYAN basliga uretiliyor, olanınki asla
             degistirilmiyor: kimlik degistirmek disaridan verilmis
             baglantilari ve icindekiler cipalarini kirar. Kimliksiz
             baslik ise icindekilerde hedefsiz kalirdi. */
          ...(oge.getAttribute("id")
            ? {}
            : { id: baslikKimligi(oge.textContent ?? "") }),
          /* Kimlik KORUNUYOR: icindekiler baglantilari ve SSS cikarimi
             (lib/faq.ts) bu kimlikleri kullaniyor. Atsaydik sayfa ici
             baglantilar ve arama sonucundaki SSS kirilirdi. */
          ...(oge.getAttribute("id") ? { id: oge.getAttribute("id")! } : {}),
          /* Sinif OLDUGU GIBI korunuyor, dayatilmiyor. Olcum gosterdi:
             basliklarin bir kismi "scroll-mt-24 font-serif" tasiyor,
             bir kismi ciplak. Hepsine ev stilini yazsaydik ciplak
             olanlar birden serif olur ve cipa boslugu kazanirdi —
             yani goc, kimsenin istemedigi bir tasarim degisikligi
             yapardi. Yeni baslik ekleyen editor sinifi kendisi verir. */
          ...(oge.getAttribute("class") ? { sinif: oge.getAttribute("class")! } : {}),
          ...ozEk(oge, ["id", "class"]),
        });
        break;

      case "ul":
      case "ol":
      {
        /* Yalnizca DOGRUDAN cocuklar: ic ice listelerde alttaki
           ogeler iki kez sayilirdi. */
        const maddeler = oge
          .querySelectorAll("li")
          .filter((li) => li.parentNode === oge);
        const kontrolMu = oge.getAttribute("class")?.includes("kontrol-listesi");

        bloklar.push({
          t: "liste",
          sirali: etiket === "ol",
          /* TipTap madde icerigini <p> ile sariyor: <li><p>metin</p></li>.
             Yayinda bu fazladan bir blok boslugu uretiyor ve maddeler
             birbirinden kopuyor. Tek basina duran p aciliyor. */
          ogeler: maddeler.map((li) => {
            const cocuklar = li.childNodes.filter(
              (c) => c.nodeType !== NodeType.TEXT_NODE || c.rawText.trim()
            );
            const tekP =
              cocuklar.length === 1 &&
              (cocuklar[0] as HTMLElement).tagName?.toLowerCase() === "p";
            return tekP ? (cocuklar[0] as HTMLElement).innerHTML : li.innerHTML;
          }),
          ...(kontrolMu
            ? { isaretler: maddeler.map((li) => li.getAttribute("data-isaret") === "1") }
            : {}),
          ...ozEk(oge, []),
        });
        break;
      }

      case "figure": {
        const img = oge.querySelector("img");
        const alt = oge.querySelector("figcaption");
        if (img) {
          /* Gorseli SARAN baglanti — altyazinin icindeki baglanti
             degil. Ayrimi yapmazsak altyazidaki bir kaynak baglantisi
             gorselin adresi sanilir. */
          const saran = img.closest("a");
          bloklar.push({
            t: "gorsel",
            src: img.getAttribute("src") ?? "",
            ...(img.getAttribute("alt") ? { alt: img.getAttribute("alt")! } : {}),
            ...(alt ? { altyazi: alt.innerHTML } : {}),
            ...(saran?.getAttribute("href")
              ? { baglanti: saran.getAttribute("href")! }
              : {}),
            /* Ghost'tan gelen genis gorseller: kg-width-wide. Sinifi
               atsaydik gorseller dar kolona sikisirdi. */
            ...(oge.getAttribute("class")?.includes("kg-width-wide")
              ? { genis: true }
              : {}),
            ...(oge.getAttribute("class") ? { sinif: oge.getAttribute("class")! } : {}),
            ...ozEk(img, ["src", "alt"]),
          });
        } else {
          bloklar.push({ t: "ham", html: oge.outerHTML });
        }
        break;
      }

      case "img":
        bloklar.push({
          t: "gorsel",
          src: oge.getAttribute("src") ?? "",
          ...(oge.getAttribute("alt") ? { alt: oge.getAttribute("alt")! } : {}),
          ...ozEk(oge, ["src", "alt"]),
          ciplak: true,
        });
        break;

      case "table":
        /* Tablo icerigi HTML olarak tutuluyor: satir/sutun modeline
           cevirmek birlestirilmis hucrelerde bilgi kaybettirir. */
        bloklar.push({ t: "tablo", html: oge.outerHTML });
        break;

      case "hr":
        bloklar.push({ t: "ayrac" });
        break;

      case "blockquote":
        bloklar.push({ t: "alinti", html: oge.innerHTML, ...ozEk(oge, []) });
        break;

      default:
        /* Kaydirma sarmali icine alinmis tablo. Veride bes tane var ve
           hepsi ayni bicimde: dar ekranda tasmasin diye tablo bir
           div'in icine konmus. Tanimasaydik "ham" kalir, yani
           editorde duzenlenemezdi. Sarmal HTML'in icinde duruyor,
           yani yatay kaydirma da bozulmuyor. */
        /* Urun karti isareti. Turetilen HTML'de yalnizca bos bir
           yer tutucu duruyor; kart okuma aninda dolduruluyor
           (lib/urun-blogu.ts). Boylece gidis-donus de kayipsiz. */
        if (
          oge.getAttribute("data-blok") === "icindekiler" ||
          (etiket === "nav" && oge.getAttribute("class")?.includes("icindekiler"))
        ) {
          const ham = oge.getAttribute("data-seviye") || "2,3";
          const seviyeler = ham
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((x) => x >= 2 && x <= 4);
          bloklar.push({
            t: "icindekiler",
            seviyeler: seviyeler.length ? seviyeler : [2, 3],
          });
        } else if (oge.getAttribute("data-blok") === "urun") {
          const kimlik = Number(oge.getAttribute("data-urun-id"));
          if (Number.isFinite(kimlik) && kimlik > 0) {
            bloklar.push({ t: "urun", urunId: kimlik });
          } else {
            /* Kimliksiz isaret ise: atmak yerine ham birakiliyor,
               yoksa yazarin koydugu sey sessizce yok olurdu. */
            bloklar.push({ t: "ham", html: oge.outerHTML });
          }
        } else if (etiket === "div" && oge.querySelector("table")) {
          bloklar.push({ t: "tablo", html: oge.outerHTML });
        } else {
          bloklar.push({ t: "ham", html: oge.outerHTML });
        }
    }
  }

  return bloklar;
}

/**
 * Isaretli (data-blok) ogeleri bloga cevirir.
 *
 * HEPSI TOLERANSLI: kullanici blogun uzerinde yazi yazarken ic
 * yapiyi bozabilir — bir basligi silebilir, bir sutunu bosaltabilir.
 * O yuzden her alan "varsa oradan, yoksa makul bir yerden" okunuyor.
 * Kati okusaydik, bozulan blok sessizce bos donerdi.
 */
function isaretliBlok(isaret: string, o: HTMLElement): Blok | null {
  const metin = (sec: string) => o.querySelector(sec)?.textContent?.trim() ?? "";
  const ic = (sec: string) => o.querySelector(sec)?.innerHTML ?? "";
  const maddeler = (sec: string) =>
    o.querySelectorAll(sec).map((li) => li.innerHTML.trim()).filter(Boolean);

  switch (isaret) {
    case "kutu": {
      const tur = (o.getAttribute("data-tur") ?? "bilgi") as
        | "bilgi" | "uyari" | "ipucu" | "ozet";
      return {
        t: "kutu",
        tur: ["bilgi", "uyari", "ipucu", "ozet"].includes(tur) ? tur : "bilgi",
        ...(metin(".kutu-baslik") ? { baslik: metin(".kutu-baslik") } : {}),
        /* Govde bulunamazsa blogun tamami: yapiyi bozan bir duzenleme
           metni kaybettirmesin. */
        html: ic(".kutu-govde") || o.innerHTML,
      };
    }

    case "artilar":
      return {
        t: "artilar",
        artilar: maddeler(".ae-arti li"),
        eksiler: maddeler(".ae-eksi li"),
        ...(metin(".ae-arti .ae-baslik") ? { artiBaslik: metin(".ae-arti .ae-baslik") } : {}),
        ...(metin(".ae-eksi .ae-baslik") ? { eksiBaslik: metin(".ae-eksi .ae-baslik") } : {}),
      };

    case "istatistik":
      return {
        t: "istatistik",
        ogeler: o.querySelectorAll(".istatistik-oge").map((k) => ({
          sayi: k.querySelector(".istatistik-sayi")?.textContent?.trim() ?? "",
          etiket: k.querySelector(".istatistik-etiket")?.textContent?.trim() ?? "",
        })),
      };

    case "adimlar":
      return {
        t: "adimlar",
        ogeler: o.querySelectorAll("li").map((li) => ({
          baslik: li.querySelector(".adim-baslik")?.textContent?.trim() ?? "",
          html: li.querySelector(".adim-govde")?.innerHTML ?? li.innerHTML,
        })),
      };

    case "kaynakca":
      return { t: "kaynakca", ogeler: maddeler("li") };

    case "cta":
      return {
        t: "cta",
        baslik: metin(".cta-baslik"),
        ...(metin(".cta-metin") ? { metin: metin(".cta-metin") } : {}),
        dugmeMetni: metin(".cta-dugme") || "Incele",
        adres: o.querySelector(".cta-dugme a")?.getAttribute("href") ?? "",
      };

    case "video": {
      const kimlik = o.getAttribute("data-video") ?? "";
      /* Kimlik yoksa blok kurulmuyor: bos bir oynatici cercevesi
         okura bozuk bir sayfa gosterirdi. */
      if (!kimlik) return null;
      const s = o.getAttribute("data-saglayici") === "vimeo" ? "vimeo" : "youtube";
      return {
        t: "video",
        saglayici: s,
        videoId: kimlik,
        ...(o.getAttribute("data-baslik") ? { baslik: o.getAttribute("data-baslik")! } : {}),
      };
    }

    case "sutunlar": {
      const sutunlar = o.querySelectorAll(".sutun").filter((k) => k.parentNode === o);
      return {
        t: "sutunlar",
        sol: sutunlar[0]?.innerHTML ?? "",
        sag: sutunlar[1]?.innerHTML ?? "",
      };
    }

    case "grafik": {
      const ogeler = o.querySelectorAll(".grafik-satir").map((k) => {
        const gosterim = k.querySelector(".grafik-deger")?.textContent?.trim() ?? "";
        /* Deger, gosterilen metinden okunuyor: yazar "62%" ya da
           "1.240 TL" yazabilsin diye. Sayi kismi cubugun boyunu,
           metnin tamami ise ekranda gorunen sey oluyor. */
        const sayi = Number(String(gosterim).replace(/[^0-9.,-]/g, "").replace(",", "."));
        return {
          etiket: k.querySelector(".grafik-etiket")?.textContent?.trim() ?? "",
          deger: Number.isFinite(sayi) ? sayi : 0,
          ...(gosterim ? { gosterim } : {}),
        };
      });
      return {
        t: "grafik",
        ...(metin(".grafik-baslik") ? { baslik: metin(".grafik-baslik") } : {}),
        ogeler,
      };
    }

    case "galeri": {
      const sutun = Number(o.getAttribute("data-sutun") ?? 3);
      return {
        t: "galeri",
        sutun: ([2, 3, 4].includes(sutun) ? sutun : 3) as 2 | 3 | 4,
        gorseller: o.querySelectorAll("img").map((i) => ({
          src: i.getAttribute("src") ?? "",
          ...(i.getAttribute("alt") ? { alt: i.getAttribute("alt")! } : {}),
        })),
      };
    }

    default:
      return null;
  }
}

/* ==================================================================
   BLOKLAR  →  HTML
   ================================================================== */

/**
 * @param isaretle Her blogun KOK ETIKETINE data-blok-i (sira) ve
 *   data-blok-t (tur) yaziyor. Duzenleme katmani turu buradan okuyor;
 *   yoksa gorsel mi paragraf mi oldugunu DOM'u koklayarak tahmin etmek
 *   gerekirdi ve her yeni tur yeni bir ozel durum olurdu.
 *
 *   SARMALAYICI DIV EKLENMIYOR, bilerek. Yayin CSS'i dogrudan cocuk
 *   seciciye dayaniyor (.article-body > * + *); araya bir katman
 *   koysaydik yazinin butun dikey bosluklari cokerdi. Isaretler
 *   bloklarin kendi etiketine giriyor, DOM yapisi degismiyor.
 */
export function bloklarHtmle(
  bloklar?: Blok[] | null,
  { isaretle = false }: { isaretle?: boolean } = {}
): string {
  if (!Array.isArray(bloklar) || bloklar.length === 0) return "";

  const govde = bloklar
    .map((b) => {
      switch (b.t) {
        case "paragraf":
          return `<p${ozYaz(b.oz)}>${b.html}</p>`;

        case "baslik":
          return `<h${b.seviye}${oznitelik("id", b.id)}${oznitelik("class", b.sinif)}${ozYaz(b.oz)}>${b.html}</h${b.seviye}>`;

        case "liste": {
          const e = b.sirali ? "ol" : "ul";
          const maddeler = b.ogeler
            .map((o, i) => {
              /* Isaret data-isaret'te duruyor, gorunumu CSS veriyor.
                 Gercek bir <input type=checkbox> koymak okurun
                 sayfasinda tiklanabilir ama hicbir sey yapmayan bir
                 kutu birakirdi; ayrica sema girdi alanlarini kabul
                 etmiyor. */
              const isaret = b.isaretler?.[i];
              return isaret === undefined
                ? `<li>${o}</li>`
                : `<li data-isaret="${isaret ? "1" : "0"}">${o}</li>`;
            })
            .join("");
          return `<${e}${ozYaz(b.oz)}>${maddeler}</${e}>`;
        }

        case "gorsel": {
          const img = `<img${oznitelik("src", b.src)}${oznitelik("alt", b.alt)}${ozYaz(b.oz)}>`;
          /* Cerceve olmadan konmus gorsel oldugu gibi kaliyor: figure'e
             sarmak bosluk ve hizalama getirir, yazinin duzenini
             degistirirdi.
             ALTYAZISI VARSA istisna: figcaption ancak figure icinde
             basilir, yoksa altyazi sessizce yok olurdu. */
          if (b.ciplak && !b.altyazi) return img;

          const sarili = b.baglanti
            ? `<a${oznitelik("href", b.baglanti)}>${img}</a>`
            : img;
          const altyazi = b.altyazi ? `<figcaption>${b.altyazi}</figcaption>` : "";
          /* Ozgun sinif varsa OLDUGU GIBI kullaniliyor. Yeniden
             uretmek Ghost'un sinif dizilimini tahmin etmek demek;
             bir surumde degisirse gorseller sessizce dar kolona
             duserdi. Yalnizca yeni eklenen gorseller icin uretiliyor. */
          const uretilen = b.genis
            ? "kg-card kg-image-card kg-width-wide"
            : "kg-card kg-image-card";
          const tamSinif =
            b.sinif ?? (b.altyazi ? `${uretilen} kg-card-hascaption` : uretilen);
          return `<figure class="${tamSinif}">${sarili}${altyazi}</figure>`;
        }

        case "tablo":
          return b.html;

        case "ayrac":
          return "<hr>";

        case "alinti":
          return `<blockquote${b.vurgulu ? ' class="vurgulu"' : ""}${ozYaz(b.oz)}>${b.html}</blockquote>`;

        case "kutu":
          return (
            `<aside class="kutu kutu-${b.tur}" data-blok="kutu" data-tur="${b.tur}">` +
            (b.baslik ? `<div class="kutu-baslik">${b.baslik}</div>` : "") +
            `<div class="kutu-govde">${b.html}</div></aside>`
          );

        case "artilar": {
          const sutun = (sinif: string, baslik: string, ogeler: string[]) =>
            `<div class="ae-sutun ${sinif}"><div class="ae-baslik">${baslik}</div>` +
            `<ul>${ogeler.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
          return (
            `<div class="artilar-eksiler" data-blok="artilar">` +
            sutun("ae-arti", b.artiBaslik ?? "Artilari", b.artilar) +
            sutun("ae-eksi", b.eksiBaslik ?? "Eksileri", b.eksiler) +
            `</div>`
          );
        }

        case "istatistik":
          return (
            `<div class="istatistik" data-blok="istatistik">` +
            b.ogeler
              .map(
                (k) =>
                  `<div class="istatistik-oge"><div class="istatistik-sayi">${k.sayi}</div>` +
                  `<div class="istatistik-etiket">${k.etiket}</div></div>`
              )
              .join("") +
            `</div>`
          );

        case "adimlar":
          return (
            `<ol class="adimlar" data-blok="adimlar">` +
            b.ogeler
              .map(
                (k) =>
                  `<li><div class="adim-baslik">${k.baslik}</div>` +
                  `<div class="adim-govde">${k.html}</div></li>`
              )
              .join("") +
            `</ol>`
          );

        case "kaynakca":
          return (
            `<ol class="kaynakca" data-blok="kaynakca">` +
            b.ogeler.map((x) => `<li>${x}</li>`).join("") +
            `</ol>`
          );

        case "cta":
          return (
            `<div class="cta" data-blok="cta">` +
            `<div class="cta-baslik">${b.baslik}</div>` +
            (b.metin ? `<div class="cta-metin">${b.metin}</div>` : "") +
            `<div class="cta-dugme"><a${oznitelik("href", b.adres)}>${b.dugmeMetni}</a></div>` +
            `</div>`
          );

        case "video":
          /* Yalnizca isaret. Oynatici okuma aninda basiliyor
             (lib/video.ts); kaydedilen sey bir kimlik, calistirilabilir
             bir sey degil. */
          return (
            `<div data-blok="video" data-saglayici="${b.saglayici}"` +
            ` data-video="${b.videoId}"` +
            (b.baslik ? oznitelik("data-baslik", b.baslik) : "") +
            `></div>`
          );

        case "sutunlar":
          return (
            `<div class="sutunlar" data-blok="sutunlar">` +
            `<div class="sutun">${b.sol}</div><div class="sutun">${b.sag}</div>` +
            `</div>`
          );

        case "grafik": {
          /* Cubuk boylari EN BUYUK DEGERE gore olceklenyor: sabit bir
             ust sinir kullansaydik butun degerler kucukse grafik bos
             gorunurdu. */
          const enBuyuk = Math.max(1, ...b.ogeler.map((k) => Math.abs(k.deger) || 0));
          return (
            `<div class="grafik" data-blok="grafik">` +
            (b.baslik ? `<div class="grafik-baslik">${b.baslik}</div>` : "") +
            b.ogeler
              .map((k) => {
                const oran = Math.round((Math.abs(k.deger) / enBuyuk) * 100);
                return (
                  `<div class="grafik-satir">` +
                  `<div class="grafik-etiket">${k.etiket}</div>` +
                  `<div class="grafik-yol"><div class="grafik-cubuk" style="width:${oran}%"></div></div>` +
                  `<div class="grafik-deger">${k.gosterim ?? k.deger}</div>` +
                  `</div>`
                );
              })
              .join("") +
            `</div>`
          );
        }

        case "galeri":
          return (
            `<div class="galeri" data-blok="galeri" data-sutun="${b.sutun}">` +
            b.gorseller
              .map(
                (g) =>
                  `<figure class="galeri-oge"><img${oznitelik("src", g.src)}${oznitelik("alt", g.alt)}></figure>`
              )
              .join("") +
            `</div>`
          );

        case "icindekiler":
          /* Yalnizca isaret; liste okuma aninda basiliyor
             (lib/icindekiler.ts). RSS ve llms.txt gibi ham HTML okuyan
             yerlerde bos bir div kaliyor — orada icindekiler zaten
             anlamsiz. */
          return `<div data-blok="icindekiler" data-seviye="${b.seviyeler.join(",")}"></div>`;

        case "urun":
          /* Yalnizca isaret. Kartin kendisi okuma aninda basiliyor;
             RSS ve llms.txt gibi ham HTML okuyan yerlerde de bos bir
             div kaliyor, yani hicbir yerde bozuk fiyat gorunmuyor. */
          return `<div data-blok="urun" data-urun-id="${b.urunId}"></div>`;

        case "ham":
          return b.html;

        default:
          return "";
      }
    });

  if (!isaretle) return govde.join("\n");

  /* Isaret ilk etiketin icine, etiket adindan hemen sonra giriyor.
     Kok etiketi bulmak icin dizgeyi yeniden ayristirmiyoruz: her blok
     kendi HTML'ini burada uretti, yani ilk "<ad" her zaman kok. */
  return govde
    .map((h, i) => {
      const t = bloklar[i].t;
      return h.replace(/^<([a-zA-Z][a-zA-Z0-9]*)/, `<$1 data-blok-i="${i}" data-blok-t="${t}"`);
    })
    .join("\n");
}

/**
 * Bir yazinin bloklari — kayitli blok yoksa HTML'den uretiliyor.
 *
 * Gocun yapilmadigi ya da bir yazinin henuz cevrilmedigi durumda da
 * blok duzenleme calissin diye: eski yazilar okunurken cevriliyor,
 * ilk kayitta blok olarak yaziliyor.
 */
export function yazininBloklari(yazi: {
  blocksJson?: unknown;
  contentHtml?: string | null;
}): Blok[] {
  const kayitli = yazi.blocksJson;
  if (Array.isArray(kayitli) && kayitli.length > 0) return kayitli as Blok[];
  return htmlBloklara(yazi.contentHtml);
}

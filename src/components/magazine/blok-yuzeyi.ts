import { BLOK_TANIMLARI, EKLENEBILIR_TURLER, PARAGRAF_ROLLERI, TABLO_SETLERI, type Alan } from "@/lib/blok-turleri";
import { metinYuzeyiKur } from "@/components/magazine/blok-metin";

/**
 * BLOK DUZENLEME YUZEYI — sayfanin uzerinde, gercek tasarimin icinde.
 *
 * ETKILESIM MODELI: TIKLAYINCA SECILIR, SECIM DURUR.
 *
 * Ilk hali fareyle uzerine gelince seciyordu ve arac cubugu blogun 36
 * piksel ustunde duruyordu. Iki sonucu vardi: cubuga uzanirken imlec
 * govdeden cikiyor ve cubuk kayboluyordu; ayrica fare her kimildadiginda
 * secim degisip cubuk ziplıyordu. Yani dugmeye basmak neredeyse mumkun
 * degildi.
 *
 * Simdi Gutenberg/Payload ile ayni: uzerine gelmek yalnizca ince bir
 * cerceve gosterir, TIKLAMAK secer, secim baska bir yere tiklayana ya
 * da Esc'e basana kadar DURUR. Cubuk kaybolmuyor, kovalanmiyor.
 *
 * TUR FARKINDALIGI: her blogun denetimleri BLOK_TANIMLARI kaydindan
 * geliyor; ayar panelindeki alanlar da oradan. Yeni tur eklemek kayda
 * bir satir.
 *
 * AYRISTIRICI ITHAL EDILMIYOR: bu modul yayin duzenine giriyor, yani
 * her okurun paketine dusuyor. lib/bloklar.ts'i cagirsaydik
 * node-html-parser da okurun tarayicisina inerdi.
 */

/**
 * Bir ogenin blok turu.
 *
 * NEDEN ISARETE GUVENMIYORUZ: govde sunucuda basilirken her blogun kok
 * etiketine turu yaziliyor (data-blok-t). Ama panel bagladiginda
 * cerceveye veritabanindaki HAM content_html'i basiyor ve orada isaret
 * yok — panel acilir acilmaz isaretler siliniyordu. Etiket zaten turun
 * kendisi; isaret yalnizca kolaylik.
 */
export function turuBul(o: Element): string {
  /* Once sunucunun bastigi tur isareti. */
  const turIsareti = o.getAttribute("data-blok-t");
  if (turIsareti) return turIsareti;

  /* Sonra blogun kendi isareti. Bu ETIKETTEN once geliyor: "adimlar"
     bir ol, "kutu" bir aside — etikete gore baksaydik siradan bir
     liste ya da ham HTML sanilirlardi. */
  const blokIsareti = o.getAttribute("data-blok");
  if (blokIsareti) return blokIsareti;

  /* Sunucunun bastigi icindekiler listesi isaret tasiyor; yine de
     sinifa bakiliyor: cok eski bir icerikte isaret olmayabilir. */
  if (o.tagName === "NAV" && o.classList.contains("icindekiler")) return "icindekiler";
  switch (o.tagName) {
    case "P": return "paragraf";
    case "H2": case "H3": case "H4": return "baslik";
    case "UL": case "OL": return "liste";
    case "FIGURE": return o.querySelector("img") ? "gorsel" : "ham";
    case "IMG": return "gorsel";
    case "TABLE": return "tablo";
    case "HR": return "ayrac";
    case "BLOCKQUOTE": return "alinti";
    case "ASIDE": return o.classList.contains("urun-blogu") ? "urun" : "ham";
    case "DIV": return o.querySelector("table") ? "tablo" : "ham";
    default: return "ham";
  }
}

/**
 * HER BLOK KENDI DUZENLENEBILIR ALANI.
 *
 * Onceden contentEditable govdenin TAMAMINA veriliyordu. Sonucu:
 * tiklayinca butun yazi odaklaniyor, cerceve yazinin tamamini
 * sariyordu — "blok blok, paragraf paragraf secemiyorum" denmesinin
 * sebebi buydu. Tek bir dev metin kutusu, blok editoru degil.
 *
 * Artik yalnizca yazi tutan bloklar (paragraf, baslik, liste, alinti)
 * kendi basina duzenlenebilir; gorsel, ayrac ve urun karti degil —
 * onlarin icine yazi yazilmaz, alanlari ayar panelinden degisir.
 *
 * Govdeye yazilan input olaylari cocuklardan kabararak geliyor, yani
 * panele bildirim yolu bozulmuyor.
 */
export function duzenlenebilirlikUygula(govde: HTMLElement) {
  for (const cocuk of Array.from(govde.children) as HTMLElement[]) {
    const t = turuBul(cocuk);
    const yazilir = BLOK_TANIMLARI[t as keyof typeof BLOK_TANIMLARI]?.yerindeYazilir;
    if (yazilir) {
      cocuk.setAttribute("contenteditable", "true");
      cocuk.spellcheck = false;
    } else {
      cocuk.removeAttribute("contenteditable");
    }
  }
}

type Ayarlar = {
  govde: HTMLElement;
  yolla: () => void;
  /* Gorsel duzenleme penceresini panelde acar. */
  gorselAc: (img: HTMLImageElement) => void;
  /* Urun secici penceresini panelde acar. */
  urunAc: (blok: HTMLElement) => void;
  /* Geri alma yigini degisince panele bildirir: dugmeler ne zaman
     kullanilabilir oldugunu bilsin. */
  gecmisDegisti?: (geri: number, ileri: number) => void;
};

/* Renkler LITERAL yaziliyor. Arac cubugu document.body'ye takiliyor,
   yani .mag kapsayicisinin DISINDA; oradaki --accent gibi degiskenler
   burada cozulmuyor (ayni tuzaga NavProgress'te dusulmustu). Ayrica
   siyah kutu, acik zeminli dergi tasarimin uzerinde yabanci duruyordu:
   yuzey artik kagit beyazi, ince cizgili. */
const R = {
  yuzey: "#ffffff",
  yuzeyUst: "#f2f0ec",
  cizgi: "#e2dfd9",
  ink: "#1b1a18",
  soluk: "#7c7770",
  vurgu: "#0fb5ce",
  tehlike: "#b4453f",
};

const GOLGE = "0 1px 2px rgba(20,18,16,.06), 0 10px 28px rgba(20,18,16,.14)";

export type BlokYuzeyi = {
  kaldir: () => void;
  geriAl: () => void;
  ileriAl: () => void;
};

export function blokYuzeyiKur({
  govde,
  yolla,
  gorselAc,
  urunAc,
  gecmisDegisti,
}: Ayarlar): BlokYuzeyi {
  let secili: HTMLElement | null = null;

  /* Bicim dugmelerinin durdugu grup. Blok cubugunun ICINDE yasiyor;
     metin secilince aciliyor (bkz. blok-metin.ts). display:contents —
     kendi bir kutu kurmuyor, dugmeler cubugun kendi hizasinda kaliyor. */
  const metinGrubu = document.createElement("span");
  metinGrubu.hidden = true;
  metinGrubu.style.cssText = "display:none";

  /* ---------------- GERI AL / ILERI AL ----------------
     Tarayicinin kendi geri alma yigini her duzenlenebilir alan icin
     AYRI calisiyor ve blok islemlerini (tasi, sil, cogalt) hic
     gormuyor. Yani bir blogu yanlislikla silen kisinin geri donusu
     yoktu. Kendi yigininizi tutmak bu isin sartı.

     Durum olarak govdenin HTML'i saklaniyor: blok dizisi zaten
     govdenin ta kendisi (denkligi 47 yazida olculdu), ayri bir model
     tutmak senkronu bozulacak ikinci bir dogruluk kaynagi olurdu. */
  const AZAMI_ADIM = 80;
  const gecmis: string[] = [];
  const ileri: string[] = [];
  let sonKayit = 0;

  const gecmisiBildir = () => gecmisDegisti?.(gecmis.length, ileri.length);

  const kaydet = () => {
    const simdi = govde.innerHTML;
    if (gecmis[gecmis.length - 1] === simdi) return;
    gecmis.push(simdi);
    if (gecmis.length > AZAMI_ADIM) gecmis.shift();
    /* Yeni bir is yapilinca ileri gecmisi anlamini yitiriyor. */
    ileri.length = 0;
    sonKayit = Date.now();
    gecmisiBildir();
  };

  /**
   * YAZARKEN GECMIS KAYDI — harf harf degil, KELIME kelime.
   *
   * Her tus vurusunu ayri adim yapmak yanlis olurdu: bir cumleyi geri
   * almak icin otuz kez Cmd+Z gerekirdi. Butun editorler yazmayi
   * gruplar; buradaki gruplama iki yerde kesiliyor — yazmaya ara
   * verilince ve KELIME BITINCE (bosluk, satir sonu, noktalama).
   *
   * OLAY "beforeinput", "input" DEGIL. Bu bir duzeltme: input olayi
   * degisiklikten SONRA calisiyor, yani alinan anlik goruntu yazilan
   * harfi zaten iceriyordu ve bir dizinin ILK harfi geri alinamiyordu.
   * Kullanici bunu "tek harf icin duyarli degil" diye tarif etti;
   * dogru tarifti. beforeinput degisiklikten once calisiyor, yani
   * kaydedilen sey yazmaya baslamadan onceki hal.
   */
  const KELIME_SONU = /^[\s.,;:!?)\]}"'—–-]$/;

  const yazarkenKaydet = (e: Event) => {
    const olay = e as InputEvent;
    const veri = olay.data ?? "";

    const kelimeBitti =
      veri.length === 1 && KELIME_SONU.test(veri);
    /* Satir sonu ve yapistirma da sinir sayiliyor: ikisi de
       "buraya kadar bir sey bitti" demek. */
    const buyukDegisiklik =
      olay.inputType === "insertParagraph" ||
      olay.inputType === "insertLineBreak" ||
      olay.inputType?.startsWith("insertFromPaste") === true ||
      olay.inputType?.startsWith("delete") === true;

    if (kelimeBitti || buyukDegisiklik || Date.now() - sonKayit > 700) {
      kaydet();
    }
  };

  const geriAl = () => {
    if (!gecmis.length) return;
    ileri.push(govde.innerHTML);
    govde.innerHTML = gecmis.pop()!;
    duzenlenebilirlikUygula(govde);
    sec(null);
    yolla();
    gecmisiBildir();
  };

  const ileriAl = () => {
    if (!ileri.length) return;
    gecmis.push(govde.innerHTML);
    govde.innerHTML = ileri.pop()!;
    duzenlenebilirlikUygula(govde);
    sec(null);
    yolla();
    gecmisiBildir();
  };
  let ustunde: HTMLElement | null = null;
  let menuAcik = false;
  let ayarAcik = false;
  let surukleniyor = false;

  /* ---------------- katmanlar ---------------- */

  const kat = (zIndex: number) => {
    const e = document.createElement("div");
    /* EDITORUN KENDI YUZEYI OLARAK ISARETLENIYOR.
       Onizlemede icerik disi alanlarin tiklanmasi engelleniyor
       (CanliOnizleme). O engel arac cubugunu da yutuyordu: cubuk
       govdenin disinda yasiyor ve dugmeleri birer <button>. Menu ve
       ayar paneli hic acilmiyordu. */
    e.setAttribute("data-panic-yuzey", "1");
    e.style.cssText = [
      "position:fixed",
      `z-index:${zIndex}`,
      "display:none",
      `background:${R.yuzey}`,
      `border:1px solid ${R.cizgi}`,
      "border-radius:10px",
      `box-shadow:${GOLGE}`,
      "font:500 12px/1 ui-sans-serif,system-ui,-apple-system,sans-serif",
      `color:${R.ink}`,
    ].join(";");
    document.body.appendChild(e);
    return e;
  };

  const cubuk = kat(2147483000);
  cubuk.style.alignItems = "center";
  cubuk.style.gap = "1px";
  cubuk.style.padding = "3px";
  cubuk.style.whiteSpace = "nowrap";

  const menu = kat(2147483002);
  menu.style.flexDirection = "column";
  menu.style.minWidth = "168px";
  menu.style.padding = "4px";

  const ayarlar = kat(2147483002);
  ayarlar.style.flexDirection = "column";
  ayarlar.style.width = "268px";
  ayarlar.style.padding = "10px 11px 11px";
  ayarlar.style.gap = "9px";

  /* Uzerine gelinen blogu gosteren ince cerceve. Ogenin kendi
     style'ini kirletmemek icin ayri bir katman: outline yazsaydik
     kaydedilen HTML'e style="outline:..." olarak sizardi. */
  /* Duzenleme gorunumunun stilleri. Ogelerin style ozniteligine
     yazmak yerine burada: satir ici stil kaydedilen HTML'e sizabiliyor
     (tabloda style semaca izinli). */
  const yuzeyStili = document.createElement("style");
  yuzeyStili.textContent = `
    [data-canli="govde"] > [data-panic-secili] {
      outline: 2px solid ${R.vurgu};
      outline-offset: 6px;
      border-radius: 2px;
    }
    [data-canli="govde"] > [data-panic-suruklenen] { opacity: .55; }
  `;
  document.head.appendChild(yuzeyStili);

  const isaretci = document.createElement("div");
  isaretci.setAttribute("data-panic-yuzey", "1");
  isaretci.style.cssText = [
    "position:fixed",
    "z-index:2147482999",
    "display:none",
    "pointer-events:none",
    "border-radius:3px",
    "transition:opacity 120ms",
  ].join(";");
  document.body.appendChild(isaretci);

  /* ---------------- kucuk yapicilar ---------------- */

  const dugme = (yazi: string, ipucu: string, is: () => void, renk = R.ink) => {
    const d = document.createElement("button");
    d.type = "button";
    d.textContent = yazi;
    d.title = ipucu;
    d.style.cssText = `all:unset;box-sizing:border-box;cursor:pointer;padding:6px 8px;border-radius:6px;color:${renk};text-align:center;min-width:26px`;
    d.addEventListener("mouseenter", () => (d.style.background = R.yuzeyUst));
    d.addEventListener("mouseleave", () => (d.style.background = "transparent"));
    /* mousedown durduruluyor: yoksa odak cubuga gecer ve govdedeki
       imlec kaybolur. */
    d.addEventListener("mousedown", (e) => e.preventDefault());
    d.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      /* Her arac cubugu islemi geri alinabilir olsun diye islemden
         ONCE durum saklaniyor. */
      kaydet();
      is();
    });
    return d;
  };

  const ayirici = () => {
    const a = document.createElement("span");
    a.style.cssText = `width:1px;height:17px;background:${R.cizgi};margin:0 3px`;
    return a;
  };

  const turEtiketi = (metin: string) => {
    const e = document.createElement("span");
    e.textContent = metin;
    e.style.cssText = `color:${R.soluk};padding:0 7px 0 5px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase`;
    return e;
  };

  /* ---------------- konumlama ---------------- */

  const konumla = () => {
    if (!secili || !secili.isConnected) return sec(null);
    const k = secili.getBoundingClientRect();
    cubuk.style.display = "flex";
    /* OLU BOSLUK YOK: cubuk blogun ust kenarina YAPISIK duruyor
       (onceden 36px yukarida durdugu icin uzerine gitmek imkansizdi).
       Sayfa basindaysa blogun icine kayiyor. */
    const ust = k.top - cubuk.offsetHeight - 1;
    cubuk.style.top = `${ust < 8 ? k.top + 6 : ust}px`;
    cubuk.style.left = `${Math.max(8, Math.min(window.innerWidth - cubuk.offsetWidth - 8, k.right - cubuk.offsetWidth))}px`;
    if (ayarAcik) ayarKonumla();
  };

  const ayarKonumla = () => {
    const k = cubuk.getBoundingClientRect();
    ayarlar.style.top = `${Math.min(window.innerHeight - ayarlar.offsetHeight - 8, k.bottom + 6)}px`;
    ayarlar.style.left = `${Math.max(8, k.right - ayarlar.offsetWidth)}px`;
  };

  const isaretciKonumla = () => {
    if (!ustunde || ustunde === secili || !ustunde.isConnected) {
      isaretci.style.display = "none";
      return;
    }
    const k = ustunde.getBoundingClientRect();
    isaretci.style.display = "block";
    isaretci.style.top = `${k.top - 5}px`;
    isaretci.style.left = `${k.left - 7}px`;
    isaretci.style.width = `${k.width + 14}px`;
    isaretci.style.height = `${k.height + 10}px`;
    isaretci.style.boxShadow = `0 0 0 1px ${R.cizgi}`;
  };

  /* SECIM CERCEVESI SATIR ICI STIL DEGIL, ISARET.
     Once ogenin style'ina yaziliyordu ve tabloda style semaca izinli
     oldugu icin secim cercevesi KAYDEDILEN HTML'E sizdi:
     <table style="outline: rgb(15,181,206) solid 2px; ...">.
     Duzenleme izi icerige karismamali; isaret ayristiricida
     temizleniyor, gorunumu de asagidaki stil sayfasi veriyor. */
  const seciliCerceve = () => {
    if (!secili) return;
    secili.setAttribute("data-panic-secili", "1");
  };

  /* ---------------- secim ---------------- */

  function sec(oge: HTMLElement | null) {
    if (secili && secili.isConnected) {
      secili.removeAttribute("data-panic-secili");
    }
    menuKapat();
    ayarKapat();
    secili = oge;
    if (!secili) {
      cubuk.style.display = "none";
      return;
    }
    seciliCerceve();
    cubuguKur(secili);
    konumla();
  }

  const bitir = () => {
    /* Yeni gelen ya da etiketi degisen blok da duzenlenebilir olmali;
       yoksa eklenen paragrafa yazi yazilamiyor. */
    duzenlenebilirlikUygula(govde);
    yolla();
    konumla();
  };

  /* ---------------- oge islemleri ---------------- */

  const etiketDegistir = (o: HTMLElement, yeniEtiket: string) => {
    const y = document.createElement(yeniEtiket);
    for (const oz of Array.from(o.attributes)) y.setAttribute(oz.name, oz.value);
    y.innerHTML = o.innerHTML;
    o.replaceWith(y);
    return y;
  };

  const yeniBlokOgesi = (t: string): HTMLElement => {
    let o: HTMLElement;
    switch (t) {
      case "baslik":
        o = document.createElement("h2");
        o.textContent = "New heading";
        break;
      case "liste": {
        o = document.createElement("ul");
        const li = document.createElement("li");
        li.innerHTML = "<br>";
        o.appendChild(li);
        break;
      }
      case "alinti":
        o = document.createElement("blockquote");
        o.innerHTML = "<br>";
        break;
      case "ayrac":
        o = document.createElement("hr");
        break;
      case "gorsel":
        o = document.createElement("figure");
        o.className = "kg-card kg-image-card";
        o.innerHTML = '<img src="" alt="">';
        break;
      case "urun":
        o = document.createElement("div");
        o.setAttribute("data-blok", "urun");
        o.setAttribute("data-urun-id", "0");
        break;
      case "icindekiler":
        o = document.createElement("div");
        o.setAttribute("data-blok", "icindekiler");
        o.setAttribute("data-seviye", "2,3");
        break;

      case "kutu":
        o = document.createElement("aside");
        o.className = "kutu kutu-bilgi";
        o.setAttribute("data-blok", "kutu");
        o.setAttribute("data-tur", "bilgi");
        o.innerHTML =
          '<div class="kutu-baslik">Info</div><div class="kutu-govde"><br></div>';
        break;

      case "artilar":
        o = document.createElement("div");
        o.className = "artilar-eksiler";
        o.setAttribute("data-blok", "artilar");
        o.innerHTML =
          '<div class="ae-sutun ae-arti"><div class="ae-baslik">Pros</div><ul><li><br></li></ul></div>' +
          '<div class="ae-sutun ae-eksi"><div class="ae-baslik">Cons</div><ul><li><br></li></ul></div>';
        break;

      case "istatistik":
        o = document.createElement("div");
        o.className = "istatistik";
        o.setAttribute("data-blok", "istatistik");
        o.innerHTML =
          '<div class="istatistik-oge"><div class="istatistik-sayi">42%</div><div class="istatistik-etiket">Label</div></div>' +
          '<div class="istatistik-oge"><div class="istatistik-sayi">3x</div><div class="istatistik-etiket">Label</div></div>';
        break;

      case "adimlar":
        o = document.createElement("ol");
        o.className = "adimlar";
        o.setAttribute("data-blok", "adimlar");
        o.innerHTML =
          '<li><div class="adim-baslik">First step</div><div class="adim-govde">Describe what to do.</div></li>';
        break;

      case "kartlar":
        o = document.createElement("div");
        o.className = "kartlar";
        o.setAttribute("data-blok", "kartlar");
        o.setAttribute("data-sutun", "3");
        o.innerHTML = [1, 2, 3]
          .map(
            (n) =>
              `<div class="kart"><div class="kart-baslik">Card ${n}</div>` +
              `<div class="kart-govde">What it is.</div></div>`
          )
          .join("");
        break;

      case "bant":
        o = document.createElement("div");
        o.className = "bant";
        o.setAttribute("data-blok", "bant");
        o.innerHTML =
          '<div class="bant-baslik">Get in touch</div><div class="bant-govde">How to reach us.</div>';
        break;

      case "yazarlar":
        /* BOS DOGUYOR: hangi kisiler olacagi ayar panelinden
           seciliyor. Rastgele bir yazar kimligi uydurmak, sayfada
           yanlis birini gostermek olurdu. */
        o = document.createElement("div");
        o.className = "yazarlar";
        o.setAttribute("data-blok", "yazarlar");
        break;

      case "kaynakca":
        o = document.createElement("ol");
        o.className = "kaynakca";
        o.setAttribute("data-blok", "kaynakca");
        o.innerHTML = "<li>Source</li>";
        break;

      case "cta":
        o = document.createElement("div");
        o.className = "cta";
        o.setAttribute("data-blok", "cta");
        o.innerHTML =
          '<div class="cta-baslik">Heading</div><div class="cta-metin">Short description.</div>' +
          '<div class="cta-dugme"><a href="#">Learn more</a></div>';
        break;

      case "video":
        o = document.createElement("div");
        o.setAttribute("data-blok", "video");
        o.setAttribute("data-saglayici", "youtube");
        o.setAttribute("data-video", "");
        break;

      case "galeri":
        o = document.createElement("div");
        o.className = "galeri";
        o.setAttribute("data-blok", "galeri");
        o.setAttribute("data-sutun", "3");
        break;

      case "tablo": {
        /* Uc satir uc sutun, ilk satir baslik. Bos bir tablo
           vermek yerine kullanilabilir bir iskelet: yazar hucreleri
           doldurup gecmeli, once satir eklemek zorunda kalmamali. */
        o = document.createElement("table");
        const bas = document.createElement("thead");
        const basSatir = document.createElement("tr");
        for (let i = 0; i < 3; i++) {
          const th = document.createElement("th");
          th.setAttribute("scope", "col");
          th.textContent = `Column ${i + 1}`;
          basSatir.appendChild(th);
        }
        bas.appendChild(basSatir);
        o.appendChild(bas);
        const govdeBol = document.createElement("tbody");
        for (let r = 0; r < 2; r++) {
          const tr = document.createElement("tr");
          for (let c = 0; c < 3; c++) {
            const td = document.createElement("td");
            td.innerHTML = "<br>";
            tr.appendChild(td);
          }
          govdeBol.appendChild(tr);
        }
        o.appendChild(govdeBol);
        break;
      }

      case "kod":
        o = document.createElement("pre");
        o.className = "kod";
        o.setAttribute("data-blok", "kod");
        o.innerHTML = "<code>code here</code>";
        break;

      case "sutunlar":
        o = document.createElement("div");
        o.className = "sutunlar";
        o.setAttribute("data-blok", "sutunlar");
        o.innerHTML =
          '<div class="sutun"><p>Left column.</p></div>' +
          '<div class="sutun"><p>Right column.</p></div>';
        break;

      case "grafik":
        o = document.createElement("div");
        o.className = "grafik";
        o.setAttribute("data-blok", "grafik");
        o.innerHTML =
          '<div class="grafik-baslik">Chart title</div>' +
          '<div class="grafik-satir"><div class="grafik-etiket">First</div>' +
          '<div class="grafik-yol"><div class="grafik-cubuk" style="width:100%"></div></div>' +
          '<div class="grafik-deger">62%</div></div>' +
          '<div class="grafik-satir"><div class="grafik-etiket">Second</div>' +
          '<div class="grafik-yol"><div class="grafik-cubuk" style="width:61%"></div></div>' +
          '<div class="grafik-deger">38%</div></div>';
        break;
      default:
        o = document.createElement("p");
        o.innerHTML = "<br>";
    }
    return o;
  };

  const imleciKoy = (o: HTMLElement) => {
    const a = document.createRange();
    a.selectNodeContents(o);
    a.collapse(true);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(a);
  };

  /**
   * ICINDEKILER TASLAGI.
   *
   * Gercek liste sunucuda basiliyor (lib/icindekiler.ts), ama yazar
   * kaydedene kadar bos bir kutu gormemeli — ustelik hangi
   * basliklarin listeye girdigini ANINDA gormesi gerekiyor, seviye
   * secimi ancak boyle anlasilir. Taslak kaydedilmiyor: ayristirici
   * data-blok="icindekiler" goren ogeyi blok olarak alip icerigini
   * atiyor.
   */
  const icindekileriCiz = (blok: HTMLElement) => {
    const seviyeler = (blok.getAttribute("data-seviye") || "2,3")
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => x >= 2 && x <= 4);
    const secici = seviyeler.map((s) => `h${s}`).join(",");
    const basliklar = secici
      ? ([...govde.querySelectorAll(secici)] as HTMLElement[])
      : [];

    blok.className = "icindekiler";
    blok.innerHTML =
      `<div class="icindekiler-baslik">Contents</div>` +
      `<ol class="icindekiler-liste"></ol>`;
    const liste = blok.querySelector(".icindekiler-liste")!;

    if (basliklar.length < 2) {
      /* Sunucu da bu durumda hicbir sey basmiyor; yazar bunu
         kaydetmeden once bilmeli. */
      liste.innerHTML =
        `<li class="icindekiler-madde" data-derinlik="0">` +
        `<em>Needs at least two headings \u2014 nothing will be shown yet.</em></li>`;
      return;
    }

    const enUst = Math.min(...basliklar.map((b) => Number(b.tagName[1])));
    for (const b of basliklar) {
      const li = document.createElement("li");
      li.className = "icindekiler-madde";
      li.setAttribute("data-derinlik", String(Number(b.tagName[1]) - enUst));
      /* Metin olarak yaziliyor: baslikta gecen bir isaret listeyi
         bozmasin. */
      li.textContent = b.textContent?.trim() ?? "";
      liste.appendChild(li);
    }
  };

  /* ---------------- ekleme menusu ---------------- */

  const menuKapat = () => {
    menuAcik = false;
    menu.style.display = "none";
  };

  /* Menu iki bicimde aciliyor: DAR LISTE ve ANLATIMLI hali.
     Dar liste hizli ekleme icin; anlatimli hali her blogun ne
     oldugunu kucuk bir cizim ve tek cumleyle gosteriyor. "Kutu" ya da
     "Sayi vurgusu" adlari tek basina hicbir sey soylemiyordu — yazarin
     ekleyip gormesi gerekiyordu. */
  let menuGenis = false;

  const blokEkle = (tanim: (typeof EKLENEBILIR_TURLER)[number]) => {
    const yeni = yeniBlokOgesi(tanim.t);
    secili!.after(yeni);
    menuKapat();
    sec(yeni);
    if (BLOK_TANIMLARI[tanim.t].yerindeYazilir) imleciKoy(yeni);
    if (tanim.t === "icindekiler") icindekileriCiz(yeni);
    /* Gorsel ve urun bloklari BOS dogmuyor: secici hemen aciliyor.
       Gonderim ONCE yapiliyor — panel secim penceresini acmadan once
       yeni blogun varligini bilmeli. */
    bitir();
    if (tanim.t === "gorsel") gorselAc(yeni.querySelector("img")!);
    if (tanim.t === "urun") urunAc(yeni);
  };

  const simgeCiz = (tanim: (typeof EKLENEBILIR_TURLER)[number]) => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    c.setAttribute("viewBox", "0 0 24 24");
    c.setAttribute("width", "34");
    c.setAttribute("height", "34");
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = `flex:0 0 auto;color:${R.soluk};fill:currentColor`;
    c.innerHTML = tanim.simge ?? "";
    return c;
  };

  const menuyuDoldur = () => {
    menu.innerHTML = "";
    menu.style.minWidth = menuGenis ? "420px" : "168px";
    menu.style.maxHeight = "min(62vh, 520px)";
    menu.style.overflowY = "auto";

    const serit = document.createElement("div");
    serit.style.cssText = `display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 4px 6px;border-bottom:1px solid ${R.cizgi};margin-bottom:4px`;
    const ust = document.createElement("span");
    ust.textContent = "Insert block";
    ust.style.cssText = `color:${R.soluk};font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;padding-left:6px`;
    serit.appendChild(ust);
    const anahtar = dugme(
      menuGenis ? "Compact" : "What are these?",
      "Show what each block does",
      () => {
        menuGenis = !menuGenis;
        menuyuDoldur();
        menuyuKonumla();
      }
    );
    anahtar.style.fontSize = "11.5px";
    anahtar.style.color = R.vurgu;
    serit.appendChild(anahtar);
    menu.appendChild(serit);

    for (const tanim of EKLENEBILIR_TURLER) {
      if (!menuGenis) {
        const d = dugme(tanim.ad, `Insert ${tanim.ad.toLowerCase()}`, () => blokEkle(tanim));
        d.style.textAlign = "left";
        d.style.padding = "8px 10px";
        d.style.fontSize = "13px";
        menu.appendChild(d);
        continue;
      }

      const kart = document.createElement("button");
      kart.type = "button";
      kart.title = `Insert ${tanim.ad.toLowerCase()}`;
      kart.style.cssText =
        "all:unset;box-sizing:border-box;display:flex;gap:11px;align-items:flex-start;width:100%;cursor:pointer;padding:9px 10px;border-radius:8px";
      kart.addEventListener("mouseenter", () => (kart.style.background = R.yuzeyUst));
      kart.addEventListener("mouseleave", () => (kart.style.background = "transparent"));
      kart.addEventListener("mousedown", (e) => e.preventDefault());
      kart.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        kaydet();
        blokEkle(tanim);
      });

      kart.appendChild(simgeCiz(tanim));

      const metinKap = document.createElement("span");
      metinKap.style.cssText = "display:flex;flex-direction:column;gap:2px;min-width:0";
      const ad = document.createElement("span");
      ad.textContent = tanim.ad;
      ad.style.cssText = `color:${R.ink};font-size:13px;font-weight:600`;
      const acik = document.createElement("span");
      acik.textContent = tanim.aciklama ?? "";
      acik.style.cssText = `color:${R.soluk};font-size:11.5px;font-weight:400;line-height:1.4`;
      metinKap.appendChild(ad);
      metinKap.appendChild(acik);
      kart.appendChild(metinKap);

      menu.appendChild(kart);
    }
  };

  const menuyuKonumla = () => {
    const k = cubuk.getBoundingClientRect();
    menu.style.display = "flex";
    menu.style.top = `${Math.max(8, Math.min(window.innerHeight - menu.offsetHeight - 8, k.bottom + 6))}px`;
    menu.style.left = `${Math.max(8, Math.min(window.innerWidth - menu.offsetWidth - 8, k.right - menu.offsetWidth))}px`;
  };

  const menuyuAc = () => {
    if (!secili) return;
    if (menuAcik) return menuKapat();
    ayarKapat();
    menuAcik = true;
    menuyuDoldur();
    menuyuKonumla();
  };

  /* ---------------- ayar paneli ----------------
     BLOK_TANIMLARI'ndaki alanlar burada ekrana ciyor. Kayitta
     tanimliydilar ama hicbir yerde gosterilmiyorlardi: alt metin,
     altyazi, cipa kimligi gibi seyler duzenlenemez kaliyordu. */

  /* Yazar listesi BIR KEZ cekiliyor: ayar paneli her acildiginda
     yeniden istemek, ag uzerinde ayni cevabi tekrar tekrar
     beklemekti. */
  let yazarOnbellek: Promise<{ id: number; name: string }[]> | null = null;
  const yazarlariGetir = () => {
    yazarOnbellek ??= fetch("/api/authors", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => (Array.isArray(d?.authors) ? d.authors : []))
      /* Istek basarisiz olursa bos liste: panelin acilmamasindansa
         "kayit yok" demek daha dogru bir yalan degil — asagida
         ayrica soyleniyor. */
      .catch(() => []);
    return yazarOnbellek;
  };

  /** Kunye blogunda bir kisiyi ekler ya da cikarir. */
  const yazarKartiDegistir = (blok: HTMLElement, kimlik: number, ekle: boolean) => {
    const varOlan = blok.querySelector(`.yazar-kart[data-yazar="${kimlik}"]`);
    if (!ekle) {
      varOlan?.remove();
      return;
    }
    if (varOlan) return;
    const kart = document.createElement("div");
    kart.className = "yazar-kart";
    kart.setAttribute("data-yazar", String(kimlik));
    kart.innerHTML = '<div class="yazar-govde">What they cover here.</div>';
    blok.appendChild(kart);
  };

  const ayarKapat = () => {
    ayarAcik = false;
    ayarlar.style.display = "none";
  };

  /** Alan degerini DOM'dan okur. */
  const alanOku = (o: HTMLElement, t: string, alan: Alan): string | boolean => {
    const img = o.tagName === "IMG" ? (o as HTMLImageElement) : o.querySelector("img");
    switch (`${t}.${alan.ad}`) {
      case "baslik.id": return o.id || "";
      case "paragraf.rol":
        return PARAGRAF_ROLLERI.map((r) => r.deger).find((d) => d && o.classList.contains(d)) ?? "";
      case "gorsel.alt": return img?.getAttribute("alt") ?? "";
      case "gorsel.altyazi": return o.querySelector("figcaption")?.textContent ?? "";
      case "gorsel.baglanti": return img?.closest("a")?.getAttribute("href") ?? "";
      case "gorsel.genis": return o.classList.contains("kg-width-wide");
      case "liste.sirali": return o.tagName === "OL";
      case "urun.urunId": return o.getAttribute("data-urun-id") ?? "";
      case "kartlar.sutun": return o.getAttribute("data-sutun") ?? "3";
      case "kartlar.numarali": return o.getAttribute("data-numarali") === "1";
      default: return "";
    }
  };

  /** Alan degerini DOM'a yazar. */
  const alanYaz = (o: HTMLElement, t: string, alan: Alan, deger: string | boolean) => {
    const img = o.tagName === "IMG" ? (o as HTMLImageElement) : o.querySelector("img");
    switch (`${t}.${alan.ad}`) {
      case "baslik.id":
        if (deger) o.id = String(deger);
        else o.removeAttribute("id");
        break;
      case "paragraf.rol":
        for (const r of PARAGRAF_ROLLERI) if (r.deger) o.classList.remove(r.deger);
        if (deger) o.classList.add(String(deger));
        break;
      case "gorsel.alt":
        img?.setAttribute("alt", String(deger));
        break;
      case "gorsel.altyazi": {
        let alt = o.querySelector("figcaption");
        if (deger) {
          if (!alt) {
            alt = document.createElement("figcaption");
            o.appendChild(alt);
            o.classList.add("kg-card-hascaption");
          }
          alt.textContent = String(deger);
        } else if (alt) {
          alt.remove();
          o.classList.remove("kg-card-hascaption");
        }
        break;
      }
      case "gorsel.baglanti": {
        if (!img) break;
        const saran = img.closest("a");
        if (deger) {
          if (saran) saran.setAttribute("href", String(deger));
          else {
            const a = document.createElement("a");
            a.setAttribute("href", String(deger));
            img.replaceWith(a);
            a.appendChild(img);
          }
        } else if (saran) {
          saran.replaceWith(img);
        }
        break;
      }
      case "gorsel.genis":
        o.classList.toggle("kg-width-wide", Boolean(deger));
        break;
      case "liste.sirali": {
        const y = etiketDegistir(o, deger ? "ol" : "ul");
        sec(y);
        break;
      }
      case "urun.urunId":
        o.setAttribute("data-urun-id", String(deger));
        break;
      case "kartlar.sutun":
        o.setAttribute("data-sutun", String(deger));
        break;
      case "kartlar.numarali":
        if (deger) o.setAttribute("data-numarali", "1");
        else o.removeAttribute("data-numarali");
        break;
    }
    yolla();
  };

  const ayarlariAc = () => {
    if (!secili) return;
    if (ayarAcik) return ayarKapat();
    menuKapat();

    const t = turuBul(secili);
    const tanim = BLOK_TANIMLARI[t as keyof typeof BLOK_TANIMLARI];
    ayarlar.innerHTML = "";
    ayarAcik = true;

    const baslik = document.createElement("div");
    baslik.textContent = `${tanim?.ad ?? t} settings`;
    baslik.style.cssText = `font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:${R.soluk}`;
    ayarlar.appendChild(baslik);

    if (!tanim?.alanlar.length) {
      const bos = document.createElement("div");
      bos.textContent = "This block has no settings.";
      bos.style.cssText = `color:${R.soluk};font-weight:400;font-size:12.5px`;
      ayarlar.appendChild(bos);
    }

    for (const alan of tanim?.alanlar ?? []) {
      /* Gorselin kendisi buradan degil, gorsel penceresinden
         degisiyor — iki ayri yol yazmak yerine var olani cagiriyoruz. */
      if (alan.tur === "gorsel") continue;

      const sarmal = document.createElement("label");
      sarmal.style.cssText = "display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:11.5px";
      const etiket = document.createElement("span");
      etiket.textContent = alan.etiket;
      sarmal.appendChild(etiket);

      /* KUNYE SECICI. Kutu isaretlendiginde karti dogurup dogru
         yere koyuyor; kaldirildiginda yalnizca o kart gidiyor —
         yanindaki kartlarin sayfaya ozel metni duruyor. */
      if (alan.tur === "yazarlar") {
        const liste = document.createElement("div");
        liste.style.cssText = "display:flex;flex-direction:column;gap:5px;font-weight:400";
        const bekle = document.createElement("span");
        bekle.textContent = "Loading people…";
        bekle.style.cssText = `color:${R.soluk};font-size:11.5px`;
        liste.appendChild(bekle);
        sarmal.appendChild(liste);
        ayarlar.appendChild(sarmal);

        const hedef = secili;
        yazarlariGetir().then((yazarlar) => {
          liste.innerHTML = "";
          if (!yazarlar.length) {
            const bos = document.createElement("span");
            bos.textContent = "No author records yet.";
            bos.style.cssText = `color:${R.soluk};font-size:11.5px`;
            liste.appendChild(bos);
            return;
          }
          for (const y of yazarlar) {
            const satir = document.createElement("label");
            satir.style.cssText =
              "display:flex;align-items:center;gap:7px;font-size:12.5px;cursor:pointer";
            const kutu = document.createElement("input");
            kutu.type = "checkbox";
            kutu.checked = Boolean(
              hedef.querySelector(`.yazar-kart[data-yazar="${y.id}"]`)
            );
            kutu.addEventListener("change", () => {
              yazarKartiDegistir(hedef, y.id, kutu.checked);
              yolla();
            });
            const ad = document.createElement("span");
            ad.textContent = y.name;
            satir.append(kutu, ad);
            liste.appendChild(satir);
          }
        });
        continue;
      }

      const mevcut = alanOku(secili, t, alan);
      let girdi: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

      if (alan.tur === "secim") {
        girdi = document.createElement("select");
        for (const s of alan.secenekler ?? []) {
          const o = document.createElement("option");
          o.value = s.deger;
          o.textContent = s.etiket;
          girdi.appendChild(o);
        }
        girdi.value = String(mevcut);
      } else if (alan.tur === "anahtar") {
        girdi = document.createElement("input");
        girdi.type = "checkbox";
        (girdi as HTMLInputElement).checked = Boolean(mevcut);
        sarmal.style.flexDirection = "row-reverse";
        sarmal.style.alignItems = "center";
        sarmal.style.justifyContent = "flex-end";
        sarmal.style.gap = "7px";
      } else if (alan.tur === "uzunMetin") {
        girdi = document.createElement("textarea");
        girdi.value = String(mevcut);
        (girdi as HTMLTextAreaElement).rows = 2;
      } else {
        girdi = document.createElement("input");
        girdi.type = "text";
        girdi.value = String(mevcut);
      }

      if (alan.tur !== "anahtar") {
        girdi.style.cssText = `all:unset;box-sizing:border-box;width:100%;padding:6px 8px;border:1px solid ${R.cizgi};border-radius:6px;font:400 12.5px ui-sans-serif,system-ui;background:${R.yuzey};color:${R.ink}`;
      }

      const uygula = () => {
        const d = alan.tur === "anahtar" ? (girdi as HTMLInputElement).checked : girdi.value;
        alanYaz(secili!, t, alan, d);
      };
      girdi.addEventListener("change", uygula);
      /* Metin alanlarinda yazdikca uygulaniyor: kaydet dugmesi
         beklemek yerinde duzenlemenin butun anlamini kaybettirirdi. */
      if (alan.tur === "metin" || alan.tur === "uzunMetin") {
        girdi.addEventListener("input", uygula);
      }

      sarmal.appendChild(girdi);

      if (alan.ipucu) {
        const ip = document.createElement("span");
        ip.textContent = alan.ipucu;
        ip.style.cssText = `color:${R.soluk};font-weight:400;font-size:11px;line-height:1.45`;
        sarmal.appendChild(ip);
      }
      ayarlar.appendChild(sarmal);
    }

    ayarlar.style.display = "flex";
    ayarKonumla();
  };

  /* ---------------- surukleyerek tasima ---------------- */

  const surukleBasla = (e: MouseEvent) => {
    if (!secili) return;
    e.preventDefault();
    kaydet();
    surukleniyor = true;
    document.body.style.cursor = "grabbing";
    cubuk.style.opacity = "0.35";
    secili.setAttribute("data-panic-suruklenen", "1");
  };

  const surukleHareket = (e: MouseEvent) => {
    if (!surukleniyor || !secili) return;
    const altindaki = document.elementFromPoint(e.clientX, e.clientY);
    if (!altindaki) return;
    let hedef: HTMLElement | null = altindaki as HTMLElement;
    while (hedef && hedef.parentElement !== govde) hedef = hedef.parentElement;
    if (!hedef || hedef === secili) return;

    /* Hedefin ortasini gecince yer degistiriyor: kenardan tetiklemek
       titremeye yol aciyordu. */
    const k = hedef.getBoundingClientRect();
    const ustYari = e.clientY < k.top + k.height / 2;
    if (ustYari) hedef.before(secili);
    else hedef.after(secili);
    konumla();
  };

  const surukleBitir = () => {
    if (!surukleniyor) return;
    surukleniyor = false;
    document.body.style.cursor = "";
    cubuk.style.opacity = "1";
    if (secili) {
      secili.removeAttribute("data-panic-suruklenen");
      seciliCerceve();
    }
    bitir();
  };

  /* ---------------- arac cubugu ---------------- */

  function cubuguKur(o: HTMLElement) {
    const t = turuBul(o);
    const tanim = BLOK_TANIMLARI[t as keyof typeof BLOK_TANIMLARI];
    cubuk.innerHTML = "";

    /* BICIM GRUBU EN BASTA. Ayri bir yuzer cubuk degil, ayni cubugun
       icinde bir bolum: metin secilince aciliyor, secim kalkinca
       kapaniyor. Iki ayri yuzey (siyah bicim cubugu + beyaz blok
       cubugu) hem ust uste biniyordu hem de acik zeminli tasarimda
       yan yana yabanci duruyordu. */
    cubuk.appendChild(metinGrubu);
    if (!metinGrubu.hidden) cubuk.appendChild(ayirici());

    /* Surukleme tutamagi — blok editorlerinin isareti. */
    const tutamak = document.createElement("button");
    tutamak.type = "button";
    tutamak.textContent = "⠿";
    tutamak.title = "Drag to reorder";
    tutamak.style.cssText = `all:unset;cursor:grab;padding:6px 7px;border-radius:6px;color:${R.soluk}`;
    tutamak.addEventListener("mouseenter", () => (tutamak.style.background = R.yuzeyUst));
    tutamak.addEventListener("mouseleave", () => (tutamak.style.background = "transparent"));
    tutamak.addEventListener("mousedown", surukleBasla);
    cubuk.appendChild(tutamak);

    cubuk.appendChild(turEtiketi(tanim?.ad ?? t));

    if (t === "baslik") {
      for (const s of [2, 3, 4]) {
        const etkinMi = o.tagName.toLowerCase() === `h${s}`;
        const d = dugme(`H${s}`, `Heading level ${s}`, () => {
          sec(etiketDegistir(o, `h${s}`));
          bitir();
        }, etkinMi ? R.vurgu : R.ink);
        if (etkinMi) d.style.background = R.yuzeyUst;
        cubuk.appendChild(d);
      }
      cubuk.appendChild(ayirici());
    }

    if (t === "paragraf") {
      const s = document.createElement("select");
      s.style.cssText = `all:unset;box-sizing:border-box;cursor:pointer;padding:5px 7px;border-radius:6px;color:${R.ink};background:${R.yuzeyUst};font:500 12px ui-sans-serif,system-ui`;
      for (const r of PARAGRAF_ROLLERI) {
        const se = document.createElement("option");
        se.value = r.deger;
        se.textContent = r.etiket;
        s.appendChild(se);
      }
      s.value = PARAGRAF_ROLLERI.map((r) => r.deger).find((d) => d && o.classList.contains(d)) ?? "";
      s.addEventListener("mousedown", (e) => e.stopPropagation());
      s.addEventListener("change", () => {
        for (const r of PARAGRAF_ROLLERI) if (r.deger) o.classList.remove(r.deger);
        if (s.value) o.classList.add(s.value);
        bitir();
      });
      cubuk.appendChild(s);
      cubuk.appendChild(ayirici());
    }

    if (t === "gorsel") {
      const img = o.tagName === "IMG" ? (o as HTMLImageElement) : o.querySelector("img");
      cubuk.appendChild(dugme("Replace", "Replace image", () => img && gorselAc(img)));
      cubuk.appendChild(ayirici());
    }

    if (t === "icindekiler") {
      const s = document.createElement("select");
      s.style.cssText = `all:unset;box-sizing:border-box;cursor:pointer;padding:5px 7px;border-radius:6px;color:${R.ink};background:${R.yuzeyUst};font:500 12px ui-sans-serif,system-ui`;
      for (const [deger, etiket] of [
        ["2", "Main sections (H2)"],
        ["2,3", "H2 + H3"],
        ["2,3,4", "All headings"],
      ]) {
        const se = document.createElement("option");
        se.value = deger;
        se.textContent = etiket;
        s.appendChild(se);
      }
      s.value = o.getAttribute("data-seviye") || "2,3";
      s.addEventListener("mousedown", (e) => e.stopPropagation());
      s.addEventListener("change", () => {
        o.setAttribute("data-seviye", s.value);
        icindekileriCiz(o);
        bitir();
      });
      cubuk.appendChild(s);
      cubuk.appendChild(ayirici());
    }

    if (t === "urun") {
      /* Urun kimligini elle yazdirmak yerine secici: ayar panelindeki
         sayi alani kimseye urun listesini gostermiyordu. */
      cubuk.appendChild(dugme("Choose product", "Pick a different product", () => urunAc(o)));
      cubuk.appendChild(ayirici());
    }

    /* ---- TABLO DENETIMLERI ----
       Tablolar simdiye kadar yalnizca ham HTML olarak duzenleniyordu:
       satir eklemek icin hucre isaretlemesini elle yazmak gerekiyordu.
       Satir ve sutun islemleri artik burada. */
    if (t === "tablo") {
      const tablo = (o.tagName === "TABLE" ? o : o.querySelector("table")) as HTMLTableElement | null;

      /* Bir satirin hucre sayisi, birlestirilmis hucreler yuzunden
         sutun sayisiyla ayni olmayabilir; colspan toplaniyor. */
      const sutunSayisi = () => {
        const ilk = tablo?.rows[0];
        if (!ilk) return 0;
        return [...ilk.cells].reduce((n, h) => n + (h.colSpan || 1), 0);
      };

      const hangiSutun = () => {
        /* Imlecin bulundugu hucre; yoksa sona ekleniyor. */
        const s = window.getSelection();
        const hucre = (s?.anchorNode as HTMLElement | null)?.parentElement?.closest?.("td,th");
        return hucre ? (hucre as HTMLTableCellElement).cellIndex : -1;
      };

      const hangiSatir = () => {
        const s = window.getSelection();
        const satir = (s?.anchorNode as HTMLElement | null)?.parentElement?.closest?.("tr");
        return satir ? (satir as HTMLTableRowElement).rowIndex : -1;
      };

      cubuk.appendChild(dugme("+↓", "Add row", () => {
        if (!tablo) return;
        const govdeBol = tablo.tBodies[0] ?? tablo;
        const n = sutunSayisi();
        const yeni = (govdeBol as HTMLTableSectionElement).insertRow();
        /* ILK HUCRE ADLANDIRILIYOR: bos bir satir eklemek, kullaniciyi
           once "buraya ne yazacaktim" diye dusundurup sonra yazdiriyor.
           Varsayilan bir ad, uzerine yazilacak bir baslangic veriyor. */
        const sira = (govdeBol as HTMLTableSectionElement).rows.length;
        for (let i = 0; i < n; i++) {
          const h = yeni.insertCell();
          if (i === 0) h.textContent = `Row ${sira}`;
          else h.innerHTML = "<br>";
        }
        bitir();
      }));

      cubuk.appendChild(dugme("+→", "Add column", () => {
        if (!tablo) return;
        const sira = sutunSayisi() + 1;
        for (const satir of [...tablo.rows]) {
          /* Baslik satirinda th, govdede td: yanlis etiket koymak
             tablonun anlamini ve ekran okuyucu davranisini bozar. */
          const basliktaMi = satir.parentElement?.tagName === "THEAD";
          const h = document.createElement(basliktaMi ? "th" : "td");
          if (basliktaMi) {
            h.setAttribute("scope", "col");
            h.textContent = `Column ${sira}`;
          } else {
            h.innerHTML = "<br>";
          }
          satir.appendChild(h);
        }
        bitir();
      }));

      cubuk.appendChild(dugme("−↓", "Delete row", () => {
        if (!tablo || tablo.rows.length <= 1) return;
        const i = hangiSatir();
        tablo.deleteRow(i >= 0 ? i : tablo.rows.length - 1);
        bitir();
      }));

      cubuk.appendChild(dugme("−→", "Delete column", () => {
        if (!tablo || sutunSayisi() <= 1) return;
        const i = hangiSutun();
        for (const satir of [...tablo.rows]) {
          const k = i >= 0 ? i : satir.cells.length - 1;
          if (satir.cells[k]) satir.deleteCell(k);
        }
        bitir();
      }));

      cubuk.appendChild(dugme("⊤", "Toggle header row", () => {
        if (!tablo) return;
        const bas = tablo.tHead;
        if (bas) {
          /* Basligi kaldirirken satir SILINMIYOR, govdeye tasiniyor:
             silseydik bir satirlik veri kaybolurdu. */
          const govdeBol = tablo.tBodies[0] ?? tablo.createTBody();
          for (const satir of [...bas.rows]) {
            for (const h of [...satir.cells]) {
              const td = document.createElement("td");
              td.innerHTML = h.innerHTML;
              h.replaceWith(td);
            }
            govdeBol.insertBefore(satir, govdeBol.firstChild);
          }
          bas.remove();
        } else {
          const ilk = tablo.rows[0];
          if (!ilk) return;
          const yeniBas = tablo.createTHead();
          for (const h of [...ilk.cells]) {
            const th = document.createElement("th");
            th.innerHTML = h.innerHTML;
            th.setAttribute("scope", "col");
            h.replaceWith(th);
          }
          yeniBas.appendChild(ilk);
        }
        bitir();
      }));

      /* HAZIR SETLER — yalnizca tablo HENUZ DOLDURULMAMISKEN.
         Dolu bir tabloyu sifirlayan bir menu, bir yanlis tiklamayla
         yazilmis butun veriyi silerdi. Tablo varsayilan haldeyken
         (basliklar "Column N", govde bos) set secmek guvenli. */
      if (tablo && tabloBos(tablo)) {
        const sec2 = document.createElement("select");
        sec2.style.cssText = `all:unset;box-sizing:border-box;cursor:pointer;padding:5px 7px;border-radius:6px;color:${R.ink};background:${R.yuzeyUst};font:500 12px ui-sans-serif,system-ui`;
        const bosSecenek = document.createElement("option");
        bosSecenek.value = "";
        bosSecenek.textContent = "Start from…";
        sec2.appendChild(bosSecenek);
        for (const set of TABLO_SETLERI) {
          const o = document.createElement("option");
          o.value = set.ad;
          o.textContent = set.ad;
          sec2.appendChild(o);
        }
        sec2.addEventListener("mousedown", (e) => e.stopPropagation());
        sec2.addEventListener("change", () => {
          const set = TABLO_SETLERI.find((x) => x.ad === sec2.value);
          if (!set || !tablo) return;
          kaydet();
          tabloyuKur(tablo, set.basliklar, set.satir);
          bitir();
        });
        cubuk.appendChild(sec2);
      }

      cubuk.appendChild(ayirici());
    }

    if (t === "liste") {
      cubuk.appendChild(
        dugme(o.tagName === "OL" ? "1." : "•", "Numbered / bulleted", () => {
          sec(etiketDegistir(o, o.tagName === "OL" ? "ul" : "ol"));
          bitir();
        })
      );
      cubuk.appendChild(
        dugme("☑", "Checklist", () => {
          /* Kontrol listesi SIRASIZ olmali: numara ile onay kutusunu
             yan yana koymak hem anlamsiz hem de "1. ☑" gibi cift
             isaretli bir satir uretiyor. Numarali listede acilirsa
             once madde isaretlisine ceviriliyor. */
          let hedef = o;
          if (o.tagName === "OL" && !o.classList.contains("kontrol-listesi")) {
            hedef = etiketDegistir(o, "ul");
            sec(hedef);
          }
          const acik = hedef.classList.toggle("kontrol-listesi");
          for (const li of Array.from(hedef.children)) {
            /* Isaret durumu ACILIRKEN veriliyor, kapanirken
               siliniyor: kapali bir listede data-isaret durursa
               tekrar acildiginda eski isaretler geri gelir ve
               kullanici bunu beklemez. */
            if (acik) li.setAttribute("data-isaret", "0");
            else li.removeAttribute("data-isaret");
          }
          bitir();
        })
      );
      cubuk.appendChild(ayirici());
    }

    cubuk.appendChild(dugme("↑", "Move up", () => {
      const k = secili?.previousElementSibling;
      if (k && secili) k.before(secili);
      bitir();
    }));
    cubuk.appendChild(dugme("↓", "Move down", () => {
      const k = secili?.nextElementSibling;
      if (k && secili) k.after(secili);
      bitir();
    }));
    cubuk.appendChild(dugme("⧉", "Duplicate", () => {
      if (!secili) return;
      const kopya = secili.cloneNode(true) as HTMLElement;
      kopya.removeAttribute("style");
      secili.after(kopya);
      bitir();
    }));
    cubuk.appendChild(dugme("+", "Insert block below", menuyuAc));

    /* Ayar paneli yalnizca alani olan turlerde. Bos bir panel acan
       dugme, kullaniciya bir sey vaat edip vermemek olurdu. */
    if (tanim?.alanlar.length) {
      cubuk.appendChild(dugme("⚙", "Settings", ayarlariAc));
    }

    cubuk.appendChild(ayirici());
    cubuk.appendChild(dugme("✕", "Delete", () => {
      /* Son blok silinmiyor: govde bosalinca contenteditable icinde
         imlec koyacak yer kalmiyor ve yazi yazilamaz hale geliyor. */
      if (!secili || govde.children.length <= 1) return;
      const yerine = (secili.nextElementSibling ?? secili.previousElementSibling) as HTMLElement | null;
      secili.remove();
      sec(yerine);
      bitir();
    }, R.tehlike));
  }

  /** Tablo hala varsayilan halde mi (govdesi bos). */
  const tabloBos = (tablo: HTMLTableElement) => {
    for (const satir of [...tablo.rows]) {
      if (satir.parentElement?.tagName === "THEAD") continue;
      for (const h of [...satir.cells]) {
        if ((h.textContent ?? "").trim()) return false;
      }
    }
    return true;
  };

  /** Tabloyu verilen basliklar ve satir sayisiyla yeniden kurar. */
  const tabloyuKur = (tablo: HTMLTableElement, basliklar: string[], satir: number) => {
    tablo.innerHTML = "";
    const bas = tablo.createTHead();
    const basSatir = bas.insertRow();
    for (const b of basliklar) {
      const th = document.createElement("th");
      th.setAttribute("scope", "col");
      th.textContent = b;
      basSatir.appendChild(th);
    }
    const govdeBol = tablo.createTBody();
    for (let r = 0; r < satir; r++) {
      const tr = govdeBol.insertRow();
      for (let c = 0; c < basliklar.length; c++) {
        const td = tr.insertCell();
        td.innerHTML = "<br>";
      }
    }
  };

  /* ---------------- olaylar ---------------- */

  const ustBlok = (hedef: EventTarget | Node | null): HTMLElement | null => {
    /* Metin dugumunden de gelinebiliyor (secim), o yuzden once
       ogeye cikiliyor. */
    let d =
      hedef instanceof Node && hedef.nodeType === Node.TEXT_NODE
        ? hedef.parentElement
        : (hedef as HTMLElement | null);
    while (d && d.parentElement !== govde) d = d.parentElement;
    return d;
  };

  const hareket = (e: MouseEvent) => {
    if (surukleniyor) return surukleHareket(e);
    ustunde = ustBlok(e.target);
    isaretciKonumla();
  };

  const govdedenCik = () => {
    ustunde = null;
    isaretci.style.display = "none";
  };

  /* SECIM TIKLAMAYLA. Fareyle gecerken secmek, cubugu kovalanamaz
     hale getiriyordu. */
  const tikla = (e: MouseEvent) => {
    const blok = ustBlok(e.target);
    if (blok) sec(blok);
  };

  /* Kontrol listesinde kutuya tiklamak isareti degistiriyor.
     Kutu CSS ile ciziliyor (gercek bir input degil); tiklamanin
     maddenin SOL kenarinda olup olmadigina bakiliyor, yoksa metnin
     ortasina tiklamak da isareti degistirirdi. */
  const kutuTikla = (e: MouseEvent) => {
    const li = (e.target as HTMLElement)?.closest?.("li");
    if (!li || !li.parentElement?.classList.contains("kontrol-listesi")) return;
    const k = li.getBoundingClientRect();
    if (e.clientX > k.left) return;
    e.preventDefault();
    kaydet();
    li.setAttribute("data-isaret", li.getAttribute("data-isaret") === "1" ? "0" : "1");
    yolla();
  };

  const gorseleCiftTik = (e: MouseEvent) => {
    const h = e.target as HTMLElement;
    if (h?.tagName === "IMG") {
      e.preventDefault();
      gorselAc(h as HTMLImageElement);
    }
  };

  /* Disari tiklayinca secim kalkiyor — ama cubuk, menu ve ayar
     panelinin uzerine tiklamak "disari" degil. */
  const disariTik = (e: MouseEvent) => {
    const h = e.target as Node;
    if (cubuk.contains(h) || menu.contains(h) || ayarlar.contains(h)) return;
    if (govde.contains(h)) return;
    sec(null);
  };

  /**
   * Enter YENI BLOK acar.
   *
   * Blok basina contentEditable verince tarayici Enter'a karsilik
   * blogun ICINE <div> ya da <br> koyuyor; yani yazi tek blokta
   * sisiyor ve blok yapisi olusmuyordu. Blok editorlerinde Enter
   * sonraki blogu acar.
   *
   * Shift+Enter dokunulmadan birakildi: ayni blok icinde satir
   * atlamak hala gerekli.
   */
  const govdeTus = (e: KeyboardEvent) => {
    const blok = ustBlok(e.target);
    if (!blok) return;

    if (e.key === "Enter" && !e.shiftKey) {
      kaydet();
      const t = turuBul(blok);
      /* Listede Enter yeni MADDE acmali, yeni blok degil. */
      if (t === "liste" || t === "tablo") return;
      e.preventDefault();
      const yeni = yeniBlokOgesi("paragraf");
      blok.after(yeni);
      duzenlenebilirlikUygula(govde);
      yeni.focus();
      imleciKoy(yeni);
      sec(yeni);
      yolla();
      return;
    }

    /* Bos blokta Backspace onu siler ve imleci ustteki bloga tasir —
       yoksa bos paragraflar birikiyor ve elle silmek gerekiyordu. */
    if (e.key === "Backspace" && !blok.textContent?.trim() && govde.children.length > 1) {
      const onceki = blok.previousElementSibling as HTMLElement | null;
      if (!onceki) return;
      e.preventDefault();
      kaydet();
      blok.remove();
      if (onceki.getAttribute("contenteditable")) {
        onceki.focus();
        const a = document.createRange();
        a.selectNodeContents(onceki);
        a.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(a);
      }
      sec(onceki);
      yolla();
    }
  };

  const tusla = (e: KeyboardEvent) => {
    const cmd = e.metaKey || e.ctrlKey;
    if (cmd && e.key.toLowerCase() === "z") {
      /* Tarayicinin kendi geri almasi devre disi: o yalnizca odakli
         blogun metnini biliyor, blok islemlerini bilmiyor. Ikisi ayni
         anda calissa geri alma sirasi ongorulemez olurdu. */
      e.preventDefault();
      if (e.shiftKey) ileriAl();
      else geriAl();
      return;
    }
    if (e.key === "Escape") {
      if (menuAcik) return menuKapat();
      if (ayarAcik) return ayarKapat();
      sec(null);
    }
  };

  const kaydir = () => {
    konumla();
    isaretciKonumla();
  };

  duzenlenebilirlikUygula(govde);

  /* Satir ici bicimlendirme, yapistirma temizligi, egik cizgi komutu
     ve markdown kisayollari — TipTap'in yerini alacak parcalar.
     Dugmeleri blok cubugunun icindeki bu gruba basiyor. */
  const metniKaldir = metinYuzeyiKur({
    govde,
    yolla,
    kaydet,
    menuAc: menuyuAc,
    etiketeCevir: (blok, etiket) => etiketDegistir(blok, etiket),
    blokSec: sec,
    kap: metinGrubu,
    degisti: () => {
      /* Grup acilip kapaninca cubugun genisligi degisiyor; hem
         yeniden kurulmasi hem yeniden olculmesi gerekiyor. */
      if (secili) cubuguKur(secili);
      konumla();
    },
    seciminBlogunuSec: (dugum) => {
      const blok = ustBlok(dugum);
      if (blok && blok !== secili) sec(blok);
    },
  });

  govde.addEventListener("beforeinput", yazarkenKaydet);
  govde.addEventListener("keydown", govdeTus);
  govde.addEventListener("mousemove", hareket);
  govde.addEventListener("mouseleave", govdedenCik);
  govde.addEventListener("click", tikla);
  govde.addEventListener("click", kutuTikla);
  govde.addEventListener("dblclick", gorseleCiftTik);
  document.addEventListener("mousedown", disariTik, true);
  document.addEventListener("mousemove", surukleHareket);
  document.addEventListener("mouseup", surukleBitir);
  document.addEventListener("keydown", tusla);
  window.addEventListener("scroll", kaydir, true);
  window.addEventListener("resize", kaydir);

  gecmisiBildir();

  return {
    geriAl,
    ileriAl,
    kaldir: () => {
    metniKaldir();
    govde.removeEventListener("beforeinput", yazarkenKaydet);
    govde.removeEventListener("keydown", govdeTus);
    govde.removeEventListener("mousemove", hareket);
    govde.removeEventListener("mouseleave", govdedenCik);
    govde.removeEventListener("click", tikla);
    govde.removeEventListener("click", kutuTikla);
    govde.removeEventListener("dblclick", gorseleCiftTik);
    document.removeEventListener("mousedown", disariTik, true);
    document.removeEventListener("mousemove", surukleHareket);
    document.removeEventListener("mouseup", surukleBitir);
    document.removeEventListener("keydown", tusla);
    window.removeEventListener("scroll", kaydir, true);
    window.removeEventListener("resize", kaydir);
    cubuk.remove();
    menu.remove();
    ayarlar.remove();
    isaretci.remove();
    yuzeyStili.remove();
    },
  };
}

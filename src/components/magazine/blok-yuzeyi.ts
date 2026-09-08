import { BLOK_TANIMLARI, EKLENEBILIR_TURLER, PARAGRAF_ROLLERI, type Alan } from "@/lib/blok-turleri";
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
  const isaret = o.getAttribute("data-blok-t");
  if (isaret) return isaret;
  if (o.getAttribute("data-blok") === "urun") return "urun";
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
  gorselAc: (img: HTMLImageElement) => void;
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

export function blokYuzeyiKur({ govde, yolla, gorselAc }: Ayarlar): () => void {
  let secili: HTMLElement | null = null;

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

  const kaydet = () => {
    const simdi = govde.innerHTML;
    if (gecmis[gecmis.length - 1] === simdi) return;
    gecmis.push(simdi);
    if (gecmis.length > AZAMI_ADIM) gecmis.shift();
    /* Yeni bir is yapilinca ileri gecmisi anlamini yitiriyor. */
    ileri.length = 0;
    sonKayit = Date.now();
  };

  /* Yazarken her harf ayri adim olmasin: yazmaya ara verilince tek
     adim kaydediliyor. Yoksa Cmd+Z bir kelimeyi harf harf geri alirdi. */
  const yazarkenKaydet = () => {
    if (Date.now() - sonKayit > 900) kaydet();
  };

  const geriAl = () => {
    if (!gecmis.length) return;
    ileri.push(govde.innerHTML);
    govde.innerHTML = gecmis.pop()!;
    duzenlenebilirlikUygula(govde);
    sec(null);
    yolla();
  };

  const ileriAl = () => {
    if (!ileri.length) return;
    gecmis.push(govde.innerHTML);
    govde.innerHTML = ileri.pop()!;
    duzenlenebilirlikUygula(govde);
    sec(null);
    yolla();
  };
  let ustunde: HTMLElement | null = null;
  let menuAcik = false;
  let ayarAcik = false;
  let surukleniyor = false;

  /* ---------------- katmanlar ---------------- */

  const kat = (zIndex: number) => {
    const e = document.createElement("div");
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
  const isaretci = document.createElement("div");
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

  const seciliCerceve = () => {
    if (!secili) return;
    secili.style.outline = `2px solid ${R.vurgu}`;
    secili.style.outlineOffset = "6px";
    secili.style.borderRadius = "2px";
  };

  /* ---------------- secim ---------------- */

  function sec(oge: HTMLElement | null) {
    if (secili && secili.isConnected) {
      secili.style.outline = "";
      secili.style.outlineOffset = "";
      secili.style.borderRadius = "";
      /* Bos style ozniteligi HTML'e sizmasin: kaydedilen govdede
         style="" birikirdi. */
      if (!secili.getAttribute("style")) secili.removeAttribute("style");
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
        o.textContent = "Yeni baslik";
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

  /* ---------------- ekleme menusu ---------------- */

  const menuKapat = () => {
    menuAcik = false;
    menu.style.display = "none";
  };

  const menuyuAc = () => {
    if (!secili) return;
    if (menuAcik) return menuKapat();
    ayarKapat();
    menu.innerHTML = "";
    menuAcik = true;

    for (const tanim of EKLENEBILIR_TURLER) {
      const d = dugme(tanim.ad, `${tanim.ad} ekle`, () => {
        const yeni = yeniBlokOgesi(tanim.t);
        secili!.after(yeni);
        menuKapat();
        sec(yeni);
        if (BLOK_TANIMLARI[tanim.t].yerindeYazilir) imleciKoy(yeni);
        if (tanim.t === "gorsel") gorselAc(yeni.querySelector("img")!);
        bitir();
      });
      d.style.textAlign = "left";
      d.style.padding = "8px 10px";
      d.style.fontSize = "13px";
      menu.appendChild(d);
    }

    const k = cubuk.getBoundingClientRect();
    menu.style.display = "flex";
    menu.style.top = `${Math.min(window.innerHeight - menu.offsetHeight - 8, k.bottom + 6)}px`;
    menu.style.left = `${Math.max(8, k.right - menu.offsetWidth)}px`;
  };

  /* ---------------- ayar paneli ----------------
     BLOK_TANIMLARI'ndaki alanlar burada ekrana ciyor. Kayitta
     tanimliydilar ama hicbir yerde gosterilmiyorlardi: alt metin,
     altyazi, cipa kimligi gibi seyler duzenlenemez kaliyordu. */

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
    baslik.textContent = `${tanim?.ad ?? t} ayarlari`;
    baslik.style.cssText = `font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:${R.soluk}`;
    ayarlar.appendChild(baslik);

    if (!tanim?.alanlar.length) {
      const bos = document.createElement("div");
      bos.textContent = "Bu blogun ayari yok.";
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
    secili.style.opacity = "0.55";
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
      secili.style.opacity = "";
      seciliCerceve();
    }
    bitir();
  };

  /* ---------------- arac cubugu ---------------- */

  function cubuguKur(o: HTMLElement) {
    const t = turuBul(o);
    const tanim = BLOK_TANIMLARI[t as keyof typeof BLOK_TANIMLARI];
    cubuk.innerHTML = "";

    /* Surukleme tutamagi — blok editorlerinin isareti. */
    const tutamak = document.createElement("button");
    tutamak.type = "button";
    tutamak.textContent = "⠿";
    tutamak.title = "Surukleyerek tasi";
    tutamak.style.cssText = `all:unset;cursor:grab;padding:6px 7px;border-radius:6px;color:${R.soluk}`;
    tutamak.addEventListener("mouseenter", () => (tutamak.style.background = R.yuzeyUst));
    tutamak.addEventListener("mouseleave", () => (tutamak.style.background = "transparent"));
    tutamak.addEventListener("mousedown", surukleBasla);
    cubuk.appendChild(tutamak);

    cubuk.appendChild(turEtiketi(tanim?.ad ?? t));

    if (t === "baslik") {
      for (const s of [2, 3, 4]) {
        const etkinMi = o.tagName.toLowerCase() === `h${s}`;
        const d = dugme(`H${s}`, `Seviye ${s}`, () => {
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
      cubuk.appendChild(dugme("Degistir", "Gorseli degistir", () => img && gorselAc(img)));
      cubuk.appendChild(ayirici());
    }

    if (t === "liste") {
      cubuk.appendChild(
        dugme(o.tagName === "OL" ? "1." : "•", "Numarali / madde isaretli", () => {
          sec(etiketDegistir(o, o.tagName === "OL" ? "ul" : "ol"));
          bitir();
        })
      );
      cubuk.appendChild(ayirici());
    }

    cubuk.appendChild(dugme("↑", "Yukari tasi", () => {
      const k = secili?.previousElementSibling;
      if (k && secili) k.before(secili);
      bitir();
    }));
    cubuk.appendChild(dugme("↓", "Asagi tasi", () => {
      const k = secili?.nextElementSibling;
      if (k && secili) k.after(secili);
      bitir();
    }));
    cubuk.appendChild(dugme("⧉", "Cogalt", () => {
      if (!secili) return;
      const kopya = secili.cloneNode(true) as HTMLElement;
      kopya.removeAttribute("style");
      secili.after(kopya);
      bitir();
    }));
    cubuk.appendChild(dugme("+", "Altina blok ekle", menuyuAc));

    /* Ayar paneli yalnizca alani olan turlerde. Bos bir panel acan
       dugme, kullaniciya bir sey vaat edip vermemek olurdu. */
    if (tanim?.alanlar.length) {
      cubuk.appendChild(dugme("⚙", "Ayarlar", ayarlariAc));
    }

    cubuk.appendChild(ayirici());
    cubuk.appendChild(dugme("✕", "Sil", () => {
      /* Son blok silinmiyor: govde bosalinca contenteditable icinde
         imlec koyacak yer kalmiyor ve yazi yazilamaz hale geliyor. */
      if (!secili || govde.children.length <= 1) return;
      const yerine = (secili.nextElementSibling ?? secili.previousElementSibling) as HTMLElement | null;
      secili.remove();
      sec(yerine);
      bitir();
    }, R.tehlike));
  }

  /* ---------------- olaylar ---------------- */

  const ustBlok = (hedef: EventTarget | null): HTMLElement | null => {
    let d = hedef as HTMLElement | null;
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
     ve markdown kisayollari — TipTap'in yerini alacak parcalar. */
  const metniKaldir = metinYuzeyiKur({
    govde,
    yolla,
    kaydet,
    menuAc: menuyuAc,
    etiketeCevir: (blok, etiket) => etiketDegistir(blok, etiket),
    blokSec: sec,
  });

  govde.addEventListener("input", yazarkenKaydet);
  govde.addEventListener("keydown", govdeTus);
  govde.addEventListener("mousemove", hareket);
  govde.addEventListener("mouseleave", govdedenCik);
  govde.addEventListener("click", tikla);
  govde.addEventListener("dblclick", gorseleCiftTik);
  document.addEventListener("mousedown", disariTik, true);
  document.addEventListener("mousemove", surukleHareket);
  document.addEventListener("mouseup", surukleBitir);
  document.addEventListener("keydown", tusla);
  window.addEventListener("scroll", kaydir, true);
  window.addEventListener("resize", kaydir);

  return () => {
    metniKaldir();
    govde.removeEventListener("input", yazarkenKaydet);
    govde.removeEventListener("keydown", govdeTus);
    govde.removeEventListener("mousemove", hareket);
    govde.removeEventListener("mouseleave", govdedenCik);
    govde.removeEventListener("click", tikla);
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
  };
}

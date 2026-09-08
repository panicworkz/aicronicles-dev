/**
 * BLOK ICI METIN DAVRANISI — TipTap'in yaptigi isin bizde karsiligi.
 *
 * TipTap'in gorunen yuzu arac cubugu; asil verdigi sey altindaki
 * belge modeli: yapistirma kurallari, girdi kurallari, secim yonetimi.
 * Burasi o isin bizdeki karsiligi. Dordu de gercek bir eksigi
 * kapatiyor:
 *
 *   1. SATIR ICI BICIMLENDIRME — kalin, italik, baglanti, kod.
 *      Blok yuzeyinde hic yoktu; yazar bir kelimeyi kalin yapamiyordu.
 *
 *   2. YAPISTIRMA TEMIZLIGI — Word ve Docs'tan yapistirilan metin
 *      mso- stilleri, bos span'lar ve satir ici renklerle geliyor.
 *      contentEditable bunlari oldugu gibi alir ve veritabanina
 *      yazar; yazi bir daha hicbir tema degisikligine uymaz.
 *
 *   3. EGIK CIZGI KOMUTU — bos bir paragrafta "/" yazinca blok
 *      menusu. Fareye gitmeden blok eklemenin yolu.
 *
 *   4. MARKDOWN KISAYOLLARI — "## " yazinca baslik, "- " liste,
 *      "> " alinti, "---" ayrac. Yazarken elin klavyeden kalkmiyor.
 *
 * NOT: execCommand kullaniyoruz. Standart onu "gecersiz" sayiyor ama
 * yerine gecen bir sey YOK; butun tarayicilar destekliyor ve
 * contentEditable icinde secimi dogru koruyan tek yol bu. Elle Range
 * sarmak, ic ice bicimlerde (kalin icinde italik) hatali sonuc
 * veriyor.
 */

type Ayarlar = {
  govde: HTMLElement;
  yolla: () => void;
  /* Yapisal degisiklikten once cagriliyor: geri alma yigini icin. */
  kaydet: () => void;
  /* Blok ekleme menusunu acar (egik cizgi komutu icin). */
  menuAc: () => void;
  /* Bir blogu baska bir etikete cevirir (markdown kisayollari icin). */
  etiketeCevir: (blok: HTMLElement, etiket: string) => HTMLElement;
  blokSec: (blok: HTMLElement | null) => void;
};

/* Yapistirmada IZIN VERILEN satir ici etiketler. Liste kisa olsun
   diye degil, blok modelimizin tanidigi sey bu kadar oldugu icin:
   tanimadigimiz her sey zaten ayristiricida kaybolur ya da "ham"
   bloguna duser. */
const IZINLI = new Set(["A", "B", "STRONG", "I", "EM", "CODE", "BR", "SUP", "SUB", "U", "S", "DEL"]);
/* Blok duzeyinde izinliler: yapistirilan coklu paragraf korunsun. */
const IZINLI_BLOK = new Set(["P", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE", "FIGURE", "IMG", "FIGCAPTION", "TABLE", "THEAD", "TBODY", "TR", "TD", "TH", "HR"]);

/** Word/Docs artiklarini sokup yalnizca anlamli isaretlemeyi birakir. */
export function yapistirmayiTemizle(ham: string): string {
  const kap = document.createElement("div");
  kap.innerHTML = ham;

  const gez = (dugum: Element) => {
    for (const cocuk of Array.from(dugum.children)) {
      gez(cocuk);

      if (IZINLI.has(cocuk.tagName) || IZINLI_BLOK.has(cocuk.tagName)) {
        /* Etiket kalsin ama SUSU KALMASIN: satir ici renk, punto ve
           font ailesi yapistirmayla gelirse yazi tasarimin disina
           cikar ve tema degisikliginde oldugu gibi kalir. */
        for (const oz of Array.from(cocuk.attributes)) {
          const tut =
            (cocuk.tagName === "A" && oz.name === "href") ||
            (cocuk.tagName === "IMG" && (oz.name === "src" || oz.name === "alt"));
          if (!tut) cocuk.removeAttribute(oz.name);
        }
        if (cocuk.tagName === "A") {
          cocuk.setAttribute("rel", "noopener noreferrer");
        }
      } else {
        /* Taninmayan etiket ICERIGIYLE birlikte yukari aliniyor —
           silseydik yapistirilan metnin bir kismi kaybolurdu. */
        cocuk.replaceWith(...Array.from(cocuk.childNodes));
      }
    }
  };
  gez(kap);

  /* Bos kalan satir ici ogeler: Word her kelimeyi span'a sariyor,
     temizlikten sonra geriye bos kabuklar kaliyor. */
  for (const o of Array.from(kap.querySelectorAll("b,i,em,strong,code,u,s"))) {
    if (!o.textContent?.trim()) o.remove();
  }
  return kap.innerHTML;
}

export function metinYuzeyiKur({
  govde,
  yolla,
  kaydet,
  menuAc,
  etiketeCevir,
  blokSec,
}: Ayarlar): () => void {
  /* ---------------- satir ici arac cubugu ---------------- */

  const cubuk = document.createElement("div");
  cubuk.style.cssText = [
    "position:fixed",
    "z-index:2147483003",
    "display:none",
    "align-items:center",
    "gap:1px",
    "padding:3px",
    "border-radius:9px",
    "background:#1b1a18",
    "box-shadow:0 8px 26px rgba(20,18,16,.28)",
    "font:600 12px/1 ui-sans-serif,system-ui,sans-serif",
    "color:#fff",
  ].join(";");
  document.body.appendChild(cubuk);

  const dugme = (yazi: string, ipucu: string, is: () => void) => {
    const d = document.createElement("button");
    d.type = "button";
    d.innerHTML = yazi;
    d.title = ipucu;
    d.style.cssText =
      "all:unset;cursor:pointer;padding:6px 9px;border-radius:6px;color:#fff;min-width:14px;text-align:center";
    d.addEventListener("mouseenter", () => (d.style.background = "#38352f"));
    d.addEventListener("mouseleave", () => (d.style.background = "transparent"));
    /* mousedown durduruluyor: yoksa tiklama secimi dagitir ve
       bicimlendirilecek metin kalmaz. */
    d.addEventListener("mousedown", (e) => e.preventDefault());
    d.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      is();
    });
    return d;
  };

  const komut = (ad: string, deger?: string) => {
    kaydet();
    document.execCommand(ad, false, deger);
    yolla();
    cubuguKonumla();
  };

  /* BAGLANTI ALANI CUBUGUN ICINDE.
     Tarayicinin prompt penceresi kullanilmiyor: sistem penceresi
     tasarimin disinda duruyor ve sayfayi donduruyor. Alan cubugun
     kendi icinde aciliyor, secim de bozulmuyor — secimi elle
     saklayip geri koyuyoruz, cunku girdiye odaklanmak onu dagitir. */
  let saklananAralik: Range | null = null;

  const baglantiAlani = document.createElement("input");
  baglantiAlani.type = "url";
  baglantiAlani.placeholder = "https://…  (Enter: uygula, Esc: vazgec)";
  baglantiAlani.style.cssText =
    "all:unset;box-sizing:border-box;display:none;width:250px;padding:6px 9px;border-radius:6px;background:#38352f;color:#fff;font:400 12px ui-sans-serif,system-ui";

  const secimiGeriKoy = () => {
    if (!saklananAralik) return;
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(saklananAralik);
  };

  const baglantiUygula = () => {
    const adres = baglantiAlani.value.trim();
    secimiGeriKoy();
    kaydet();
    if (!adres) {
      document.execCommand("unlink");
    } else {
      document.execCommand("createLink", false, adres);
      /* Disariya acilan baglantiya rel: hem guvenlik hem SEO. */
      const s = window.getSelection();
      const a = (s?.anchorNode?.parentElement as HTMLElement | null)?.closest("a");
      a?.setAttribute("rel", "noopener noreferrer");
    }
    baglantiAlaniniKapat();
    yolla();
  };

  const baglantiAlaniniKapat = () => {
    baglantiAlani.style.display = "none";
    for (const d of Array.from(cubuk.children)) {
      if (d !== baglantiAlani) (d as HTMLElement).style.display = "";
    }
    cubuguKonumla();
  };

  baglantiAlani.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      baglantiUygula();
    } else if (e.key === "Escape") {
      e.preventDefault();
      baglantiAlaniniKapat();
    }
  });

  const baglantiVer = () => {
    const s = window.getSelection();
    if (!s || s.rangeCount === 0) return;
    saklananAralik = s.getRangeAt(0).cloneRange();
    const varOlan = (s.anchorNode?.parentElement as HTMLElement | null)?.closest("a");
    baglantiAlani.value = varOlan?.getAttribute("href") ?? "";

    /* Dugmeler gizleniyor, alan onlarin yerini aliyor: cubuk
       genislemesin ve secimin ustunde kalsin. */
    for (const d of Array.from(cubuk.children)) {
      if (d !== baglantiAlani) (d as HTMLElement).style.display = "none";
    }
    baglantiAlani.style.display = "block";
    baglantiAlani.focus();
    baglantiAlani.select();
  };

  const kodYap = () => {
    const s = window.getSelection();
    if (!s || s.isCollapsed) return;
    kaydet();
    const icinde = (s.anchorNode?.parentElement as HTMLElement | null)?.closest("code");
    if (icinde) {
      icinde.replaceWith(...Array.from(icinde.childNodes));
    } else {
      const k = document.createElement("code");
      try {
        k.appendChild(s.getRangeAt(0).extractContents());
        s.getRangeAt(0).insertNode(k);
      } catch {
        /* Secim iki blogu birden kesiyorsa tarayici izin vermiyor;
           sessizce vazgeciyoruz — yarim bir kod etiketi birakmaktansa. */
        return;
      }
    }
    yolla();
  };

  cubuk.appendChild(dugme("<b>B</b>", "Kalin (Cmd/Ctrl+B)", () => komut("bold")));
  cubuk.appendChild(dugme("<i>I</i>", "Italik (Cmd/Ctrl+I)", () => komut("italic")));
  cubuk.appendChild(dugme("&lt;/&gt;", "Kod", kodYap));
  cubuk.appendChild(dugme("🔗", "Baglanti (Cmd/Ctrl+K)", baglantiVer));
  cubuk.appendChild(dugme("⌫", "Bicimi temizle", () => komut("removeFormat")));
  cubuk.appendChild(baglantiAlani);

  const cubuguKonumla = () => {
    const s = window.getSelection();
    if (!s || s.isCollapsed || s.rangeCount === 0) {
      cubuk.style.display = "none";
      return;
    }
    const k = s.getRangeAt(0).getBoundingClientRect();
    if (!k.width && !k.height) {
      cubuk.style.display = "none";
      return;
    }
    /* Secimin USTUNDE duruyor; sayfa basindaysa altina geciyor. */
    cubuk.style.display = "flex";
    const ust = k.top - cubuk.offsetHeight - 8;
    cubuk.style.top = `${ust < 8 ? k.bottom + 8 : ust}px`;
    cubuk.style.left = `${Math.max(8, Math.min(window.innerWidth - cubuk.offsetWidth - 8, k.left + k.width / 2 - cubuk.offsetWidth / 2))}px`;
  };

  const secimDegisti = () => {
    /* Baglanti alani acikken secim degisimi cubugu kapatmamali:
       alana odaklanmak zaten secimi bozuyor. */
    if (baglantiAlani.style.display === "block") return;
    const s = window.getSelection();
    /* Yalnizca govde icindeki secimde cikiyor: panelin baska
       alanlarinda metin secmek bu cubugu acmamali. */
    if (!s || s.rangeCount === 0 || !govde.contains(s.anchorNode)) {
      cubuk.style.display = "none";
      return;
    }
    cubuguKonumla();
  };
  document.addEventListener("selectionchange", secimDegisti);

  /* ---------------- klavye kisayollari ---------------- */

  const tus = (e: KeyboardEvent) => {
    if (!govde.contains(e.target as Node)) return;
    const cmd = e.metaKey || e.ctrlKey;
    if (!cmd) return;
    const t = e.key.toLowerCase();
    if (t === "b") {
      e.preventDefault();
      komut("bold");
    } else if (t === "i") {
      e.preventDefault();
      komut("italic");
    } else if (t === "k") {
      e.preventDefault();
      baglantiVer();
    }
  };

  /* ---------------- yapistirma ---------------- */

  const yapistir = (e: ClipboardEvent) => {
    if (!govde.contains(e.target as Node)) return;
    const veri = e.clipboardData;
    if (!veri) return;
    e.preventDefault();
    kaydet();

    const html = veri.getData("text/html");
    const temiz = html
      ? yapistirmayiTemizle(html)
      : veri
          .getData("text/plain")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/\n/g, "<br>");

    document.execCommand("insertHTML", false, temiz);
    yolla();
  };

  /* ---------------- girdi kurallari ---------------- */

  /* Kalip -> ne yapacagi. Bosluk ya da metin girildikce bakiliyor. */
  const KURALLAR: [RegExp, (blok: HTMLElement) => void][] = [
    [/^#\s/, (b) => degistir(b, "h2")],
    [/^##\s/, (b) => degistir(b, "h2")],
    [/^###\s/, (b) => degistir(b, "h3")],
    [/^####\s/, (b) => degistir(b, "h4")],
    [/^>\s/, (b) => degistir(b, "blockquote")],
    [/^[-*]\s/, (b) => listeyeCevir(b, "ul")],
    [/^1[.)]\s/, (b) => listeyeCevir(b, "ol")],
  ];

  const metniKirp = (b: HTMLElement, kalip: RegExp) => {
    b.textContent = (b.textContent ?? "").replace(kalip, "");
  };

  const degistir = (b: HTMLElement, etiket: string) => {
    const y = etiketeCevir(b, etiket);
    imleciSona(y);
    blokSec(y);
  };

  const listeyeCevir = (b: HTMLElement, etiket: string) => {
    const liste = document.createElement(etiket);
    const li = document.createElement("li");
    li.innerHTML = b.innerHTML || "<br>";
    liste.appendChild(li);
    liste.setAttribute("contenteditable", "true");
    b.replaceWith(liste);
    imleciSona(li);
    blokSec(liste);
  };

  const imleciSona = (o: HTMLElement) => {
    const a = document.createRange();
    a.selectNodeContents(o);
    a.collapse(false);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(a);
    (o.closest("[contenteditable]") as HTMLElement | null)?.focus();
  };

  const girdi = (e: Event) => {
    let blok = e.target as HTMLElement | null;
    while (blok && blok.parentElement !== govde) blok = blok.parentElement;
    if (!blok) return;

    const metin = blok.textContent ?? "";

    /* EGIK CIZGI KOMUTU: bos bir paragrafta "/" blok menusunu aciyor. */
    if (metin === "/" && blok.tagName === "P") {
      blok.textContent = "";
      blokSec(blok);
      menuAc();
      return;
    }

    /* Markdown kisayollari yalnizca PARAGRAFTA: bir baslikta "- "
       yazmak liste yapmamali, orada gercekten tire istenmis olabilir. */
    if (blok.tagName !== "P") return;

    for (const [kalip, is] of KURALLAR) {
      if (kalip.test(metin)) {
        kaydet();
        metniKirp(blok, kalip);
        is(blok);
        yolla();
        return;
      }
    }

    /* Uc tire ayrac yapiyor. */
    if (metin === "---") {
      kaydet();
      const hr = document.createElement("hr");
      const bos = document.createElement("p");
      bos.innerHTML = "<br>";
      bos.setAttribute("contenteditable", "true");
      blok.replaceWith(hr, bos);
      imleciSona(bos);
      blokSec(bos);
      yolla();
    }
  };

  govde.addEventListener("keydown", tus);
  govde.addEventListener("paste", yapistir as EventListener);
  govde.addEventListener("input", girdi);

  return () => {
    document.removeEventListener("selectionchange", secimDegisti);
    govde.removeEventListener("keydown", tus);
    govde.removeEventListener("paste", yapistir as EventListener);
    govde.removeEventListener("input", girdi);
    cubuk.remove();
  };
}

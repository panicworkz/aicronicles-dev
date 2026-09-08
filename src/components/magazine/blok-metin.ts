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

import {
  TEHLIKELI,
  SEFFAF,
  SATIR_ICI,
  etiketGecerli,
  oznitelikGecerli,
} from "@/lib/blok-sema";

type Ayarlar = {
  govde: HTMLElement;
  yolla: () => void;
  /* Yapisal degisiklikten once cagriliyor: geri alma yigini icin. */
  kaydet: () => void;
  /* Blok ekleme menusunu acar (egik cizgi komutu icin). */
  menuAc: () => void;
  /* Bir blogu baska bir etikete cevirir (markdown kisayollari icin). */
  etiketeCevir: (blok: HTMLElement, etiket: string) => HTMLElement;
  /* Bicim dugmelerinin BASILACAGI yer: blok arac cubugunun icindeki
     bir grup. Ayri bir yuzer cubuk degil. */
  kap: HTMLElement;
  /* Grup gorunurlugu degisince cubugun yeniden olculmesi gerekiyor:
     genisligi degisiyor. */
  degisti: () => void;
  /* Secim bir blogun icindeyse o blogu sectirir. */
  seciminBlogunuSec: (dugum: Node | null) => void;
  blokSec: (blok: HTMLElement | null) => void;
};

/* Kurallar SEMADAN geliyor, burada ikinci bir liste tutulmuyor.
   Iki ayri liste tutmak tam olarak yamanin tanimi olurdu: biri
   guncellenir, digeri unutulur ve yapistirma ile kayit farkli
   seyleri gecirmeye baslar. Tek tanim: lib/blok-sema.ts. */

/** Word/Docs artiklarini sokup yalnizca anlamli isaretlemeyi birakir. */
export function yapistirmayiTemizle(ham: string): string {
  const kap = document.createElement("div");
  kap.innerHTML = ham;

  const gez = (dugum: Element) => {
    for (const cocuk of Array.from(dugum.children)) {
      const etiket = cocuk.tagName.toLowerCase();

      /* Tehlikeli olan ICERIGIYLE gidiyor: script'in "metni" zaten
         metin degil. */
      if (TEHLIKELI.has(etiket)) {
        cocuk.remove();
        continue;
      }

      gez(cocuk);

      if (SEFFAF.has(etiket) || !etiketGecerli(etiket)) {
        /* Taninmayan etiket ICERIGIYLE yukari aliniyor — silseydik
           yapistirilan metnin bir kismi kaybolurdu. */
        cocuk.replaceWith(...Array.from(cocuk.childNodes));
        continue;
      }

      for (const oz of Array.from(cocuk.attributes)) {
        if (!oznitelikGecerli(etiket, oz.name, oz.value)) {
          cocuk.removeAttribute(oz.name);
        }
      }
      if (etiket === "a") cocuk.setAttribute("rel", "noopener noreferrer");
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

/**
 * Yapistirmadan SONRA blogun icini temizler.
 *
 * Neden ayrica gerekiyor: girdiyi temizlemek yetmiyor. execCommand
 * ("insertHTML") eklerken tarayici kendi hesapladigi stilleri geri
 * yaziyor — olculdu: temizlenmis bir parca eklendikten sonra icinde
 * style="font-size: 1.06rem" belirdi. O deger veritabanina girseydi
 * metnin puntosu donar, tema ya da font degistiginde o parca eski
 * boyunda kalirdi.
 */
export function blogunIciniTemizle(blok: HTMLElement) {
  for (const o of Array.from(blok.querySelectorAll("*"))) {
    /* span hicbir anlam tasimiyor: icerigiyle yukari aliniyor. */
    const etiket = o.tagName.toLowerCase();
    if (SEFFAF.has(etiket)) {
      o.replaceWith(...Array.from(o.childNodes));
      continue;
    }
    for (const oz of Array.from(o.attributes)) {
      if (!oznitelikGecerli(etiket, oz.name, oz.value)) o.removeAttribute(oz.name);
    }
    /* Satir ici ogede sinif da gereksiz: bicim tasarimdan gelir. */
    if (SATIR_ICI.has(etiket)) o.removeAttribute("class");
  }
}

export function metinYuzeyiKur({
  govde,
  yolla,
  kaydet,
  menuAc,
  etiketeCevir,
  blokSec,
  kap,
  degisti,
  seciminBlogunuSec,
}: Ayarlar): () => void {
  /* ---------------- bicim dugmeleri ----------------
     AYRI BIR CUBUK DEGIL, blok cubugunun icinde bir grup.
     Once ayri bir siyah cubuk vardi ve blogun ust kenarina yerlesen
     beyaz blok cubuguyla ayni noktaya dusuyordu: ust uste biniyor,
     ustelik acik zeminli tasarimin uzerinde iki farkli yuzey rengi
     yan yana duruyordu. Konumlariyla oynamak yamaydi; iki yuzeyi tek
     cubukta birlestirmek sorunu kaynagindan kaldiriyor. */
  const cubuk = kap;

  const dugme = (yazi: string, ipucu: string, is: () => void) => {
    const d = document.createElement("button");
    d.type = "button";
    d.innerHTML = yazi;
    d.title = ipucu;
    d.style.cssText =
      "all:unset;cursor:pointer;padding:6px 8px;border-radius:6px;color:#1b1a18;min-width:14px;text-align:center";
    d.addEventListener("mouseenter", () => (d.style.background = "#f2f0ec"));
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
  baglantiAlani.placeholder = "https://\u2026  (Enter to apply, Esc to cancel)";
  baglantiAlani.style.cssText =
    "all:unset;box-sizing:border-box;display:none;width:230px;padding:6px 9px;border-radius:6px;background:#f2f0ec;color:#1b1a18;font:400 12px ui-sans-serif,system-ui";

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

  cubuk.appendChild(dugme("<b>B</b>", "Bold (Cmd/Ctrl+B)", () => komut("bold")));
  cubuk.appendChild(dugme("<i>I</i>", "Italic (Cmd/Ctrl+I)", () => komut("italic")));
  cubuk.appendChild(dugme("&lt;/&gt;", "Code", kodYap));
  cubuk.appendChild(dugme("🔗", "Link (Cmd/Ctrl+K)", baglantiVer));
  cubuk.appendChild(dugme("x²", "Superscript", () => komut("superscript")));
  cubuk.appendChild(dugme("x₂", "Subscript", () => komut("subscript")));
  cubuk.appendChild(dugme("⌫", "Clear formatting", () => komut("removeFormat")));
  cubuk.appendChild(baglantiAlani);

  /** Secim varsa bicim dugmeleri gorunur, yoksa gizli. */
  const cubuguKonumla = () => {
    const s = window.getSelection();
    const acik =
      !!s && !s.isCollapsed && s.rangeCount > 0 && govde.contains(s.anchorNode);
    if (kap.hidden === !acik) return;
    kap.hidden = !acik;
    /* display DE ayarlaniyor: grubun satir ici "display:contents"
       degeri, [hidden] icin tarayicinin uyguladigi display:none'i
       ezer — yalnizca hidden yazsaydik grup hic gizlenmezdi. */
    kap.style.display = acik ? "contents" : "none";
    degisti();
  };

  const secimDegisti = () => {
    /* Baglanti alani acikken secim degisimi grubu kapatmamali:
       alana odaklanmak zaten secimi bozuyor. */
    if (baglantiAlani.style.display === "block") return;
    const s = window.getSelection();
    /* Metin secilince blogu da seciyoruz: yoksa bicim dugmeleri
       gorunur ama uzerinde durduklari cubuk kapali olurdu. */
    if (s && !s.isCollapsed && govde.contains(s.anchorNode)) {
      seciminBlogunuSec(s.anchorNode);
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

    /* Tarayicinin ekleme sirasinda geri yazdigi stiller burada
       siliniyor — girdiyi temizlemek tek basina yetmiyor. */
    let blok = e.target as HTMLElement | null;
    while (blok && blok.parentElement !== govde) blok = blok.parentElement;
    if (blok) blogunIciniTemizle(blok);

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
    kap.innerHTML = "";
  };
}

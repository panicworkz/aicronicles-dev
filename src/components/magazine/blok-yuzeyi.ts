import { BLOK_TANIMLARI, EKLENEBILIR_TURLER, PARAGRAF_ROLLERI } from "@/lib/blok-turleri";

/**
 * BLOK DUZENLEME YUZEYI — sayfanin uzerinde, gercek tasarimin icinde.
 *
 * Onceki hali TUR KORUYDU: paragrafin da gorselin de ustunde ayni bes
 * dugme cikiyordu. "Gercek blok deneyimi yok" denmesinin sebebi buydu.
 * Simdi her blok kendi turunu soyluyor (data-blok-t) ve arac cubugu o
 * ture ait denetimleri BLOK_TANIMLARI kaydindan okuyor. Yeni tur
 * eklemek kayda bir satir; buraya ozel durum yazilmiyor.
 *
 * DOM DOGRULUK KAYNAGI OLARAK KULLANILIYOR — ve bu bilincli bir karar.
 * Gövde bloklardan basiliyor, bloklar da govdeden geri uretiliyor;
 * ikisinin denkligi 47 yazinin TUM oznitelikleri uzerinde olculdu.
 * Yani burada DOM'u degistirmek blogu degistirmekle ayni sey. Ayri bir
 * blok durumu tutup DOM ile eslesmesini ummak, senkronu bozulacak
 * ikinci bir dogruluk kaynagi yaratirdi.
 *
 * AYRISTIRICI ITHAL EDILMIYOR. Bu modul yayin duzenine giriyor, yani
 * her okurun paketine dusuyor; lib/bloklar.ts'i cagirsaydik
 * node-html-parser da okurun tarayicisina inerdi. Ogeler dogrudan
 * document.createElement ile kuruluyor.
 */

type Ayarlar = {
  govde: HTMLElement;
  /* Degisikligi panele bildirir. */
  yolla: () => void;
  /* Gorsel duzenleme penceresini panelde acar. */
  gorselAc: (img: HTMLImageElement) => void;
};

const RENK = {
  zemin: "#0b1220",
  zeminUst: "#1d2a3d",
  yazi: "#e6edf7",
  soluk: "#8fa3bf",
  tehlike: "#ff9b9b",
};

export function blokYuzeyiKur({ govde, yolla, gorselAc }: Ayarlar): () => void {
  let etkin: HTMLElement | null = null;
  let menuAcik = false;

  /* ---------- arac cubugu iskeleti ---------- */

  const cubuk = document.createElement("div");
  cubuk.style.cssText = [
    "position:fixed",
    "z-index:2147483000",
    "display:none",
    "align-items:center",
    "gap:2px",
    "padding:3px",
    "border-radius:9px",
    `background:${RENK.zemin}`,
    "box-shadow:0 8px 26px rgba(0,0,0,.3)",
    "font:500 12px/1 ui-sans-serif,system-ui,sans-serif",
    "white-space:nowrap",
  ].join(";");
  document.body.appendChild(cubuk);

  const menu = document.createElement("div");
  menu.style.cssText = [
    "position:fixed",
    "z-index:2147483001",
    "display:none",
    "flex-direction:column",
    "min-width:170px",
    "padding:4px",
    "border-radius:10px",
    `background:${RENK.zemin}`,
    "box-shadow:0 10px 34px rgba(0,0,0,.36)",
    "font:500 13px/1 ui-sans-serif,system-ui,sans-serif",
  ].join(";");
  document.body.appendChild(menu);

  /* ---------- kucuk yapicilar ---------- */

  const dugme = (
    yazi: string,
    ipucu: string,
    is: () => void,
    renk = RENK.yazi
  ) => {
    const d = document.createElement("button");
    d.type = "button";
    d.textContent = yazi;
    d.title = ipucu;
    d.style.cssText = `all:unset;cursor:pointer;padding:5px 8px;border-radius:6px;color:${renk};text-align:center`;
    d.addEventListener("mouseenter", () => (d.style.background = RENK.zeminUst));
    d.addEventListener("mouseleave", () => (d.style.background = "transparent"));
    /* mousedown durduruluyor: yoksa odak cubuga gecer, govdedeki imlec
       kaybolur ve yazilan yer secimini yitirir. */
    d.addEventListener("mousedown", (e) => e.preventDefault());
    d.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      is();
    });
    return d;
  };

  const ayrac = () => {
    const a = document.createElement("span");
    a.style.cssText = "width:1px;height:16px;background:#3a4a63;margin:0 3px";
    return a;
  };

  const etiketYaz = (metin: string) => {
    const e = document.createElement("span");
    e.textContent = metin;
    e.style.cssText = `color:${RENK.soluk};padding:0 6px 0 4px;font-size:11px;letter-spacing:.04em;text-transform:uppercase`;
    return e;
  };

  /* ---------- konum ---------- */

  const konumla = () => {
    if (!etkin || !etkin.isConnected) return gizle();
    const k = etkin.getBoundingClientRect();
    cubuk.style.display = "flex";
    cubuk.style.top = `${Math.max(6, k.top - 36)}px`;
    cubuk.style.left = `${Math.max(6, k.right - cubuk.offsetWidth)}px`;
  };

  const gizle = () => {
    if (menuAcik) return;
    cubuk.style.display = "none";
    menu.style.display = "none";
    if (etkin) etkin.style.outline = "";
    etkin = null;
  };

  /* ---------- blok islemleri ---------- */

  const bitir = () => {
    yolla();
    konumla();
  };

  const tur = (o: HTMLElement) => o.getAttribute("data-blok-t") || "";

  const sec = (oge: HTMLElement | null) => {
    if (etkin === oge) return;
    if (etkin) etkin.style.outline = "";
    etkin = oge;
    if (!etkin) return gizle();
    etkin.style.outline = "1px solid color-mix(in srgb, var(--accent,#0fb5ce) 55%, transparent)";
    etkin.style.outlineOffset = "6px";
    cubuguKur(etkin);
    konumla();
  };

  /** Bir ogeyi baska bir etikete cevirir; icerik ve oznitelikler kalir. */
  const etiketDegistir = (o: HTMLElement, yeniEtiket: string) => {
    const y = document.createElement(yeniEtiket);
    for (const oz of Array.from(o.attributes)) y.setAttribute(oz.name, oz.value);
    y.innerHTML = o.innerHTML;
    o.replaceWith(y);
    return y;
  };

  const yeniBlokOgesi = (t: string): HTMLElement => {
    /* Ogeler elle kuruluyor — ayristiriciyi okurun paketine sokmamak
       icin (bkz. dosya basi). */
    let o: HTMLElement;
    switch (t) {
      case "baslik":
        o = document.createElement("h2");
        o.innerHTML = "Yeni baslik";
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
      case "gorsel": {
        /* Kaynaksiz gorsel eklenmiyor: bos bir cerceve birakmak
           yazarin "eksik" bir sey gormesi demek. Once secim penceresi
           aciliyor, gorsel oradan geliyor. */
        o = document.createElement("figure");
        o.className = "kg-card kg-image-card";
        o.innerHTML = '<img src="" alt="">';
        break;
      }
      case "urun":
        o = document.createElement("div");
        o.setAttribute("data-blok", "urun");
        o.setAttribute("data-urun-id", "0");
        break;
      default:
        o = document.createElement("p");
        o.innerHTML = "<br>";
    }
    o.setAttribute("data-blok-t", t);
    return o;
  };

  const imleciKoy = (o: HTMLElement) => {
    const aralik = document.createRange();
    aralik.selectNodeContents(o);
    aralik.collapse(true);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(aralik);
  };

  /* ---------- ekleme menusu ---------- */

  const menuyuAc = () => {
    if (!etkin) return;
    menu.innerHTML = "";
    menuAcik = true;

    for (const tanim of EKLENEBILIR_TURLER) {
      const d = dugme(tanim.ad, `${tanim.ad} ekle`, () => {
        const yeni = yeniBlokOgesi(tanim.t);
        etkin!.after(yeni);
        menuAcik = false;
        menu.style.display = "none";
        sec(yeni);
        if (BLOK_TANIMLARI[tanim.t].yerindeYazilir) imleciKoy(yeni);
        /* Gorsel ve urun kendi secim penceresini aciyor: bos bir blok
           birakmak yazara is cikarirdi. */
        if (tanim.t === "gorsel") gorselAc(yeni.querySelector("img")!);
        bitir();
      });
      d.style.textAlign = "left";
      d.style.padding = "7px 10px";
      menu.appendChild(d);
    }

    const k = etkin.getBoundingClientRect();
    menu.style.display = "flex";
    menu.style.top = `${Math.min(window.innerHeight - menu.offsetHeight - 8, k.bottom + 6)}px`;
    menu.style.left = `${Math.max(6, k.right - menu.offsetWidth)}px`;
  };

  /* ---------- ture gore arac cubugu ---------- */

  function cubuguKur(o: HTMLElement) {
    const t = tur(o);
    const tanim = BLOK_TANIMLARI[t as keyof typeof BLOK_TANIMLARI];
    cubuk.innerHTML = "";
    cubuk.appendChild(etiketYaz(tanim?.ad ?? t));

    /* --- ture ozel denetimler --- */
    if (t === "baslik") {
      for (const s of [2, 3, 4]) {
        const d = dugme(
          `H${s}`,
          `Seviye ${s}`,
          () => {
            const y = etiketDegistir(o, `h${s}`);
            sec(null);
            sec(y);
            bitir();
          },
          o.tagName.toLowerCase() === `h${s}` ? "#7fe3f5" : RENK.yazi
        );
        cubuk.appendChild(d);
      }
      cubuk.appendChild(ayrac());
    }

    if (t === "paragraf") {
      const s = document.createElement("select");
      s.style.cssText = `all:unset;cursor:pointer;padding:4px 6px;border-radius:6px;color:${RENK.yazi};background:${RENK.zeminUst};font:500 12px ui-sans-serif,system-ui`;
      for (const r of PARAGRAF_ROLLERI) {
        const se = document.createElement("option");
        se.value = r.deger;
        se.textContent = r.etiket;
        se.style.color = "#111";
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
      cubuk.appendChild(ayrac());
    }

    if (t === "gorsel") {
      const img = o.tagName === "IMG" ? (o as HTMLImageElement) : o.querySelector("img");
      cubuk.appendChild(
        dugme("Degistir", "Gorseli degistir, alt metin ve altyazi", () => {
          if (img) gorselAc(img);
        })
      );
      cubuk.appendChild(
        dugme("Genis", "Genis goster / dar goster", () => {
          const hedef = o.tagName === "FIGURE" ? o : o.closest("figure") ?? o;
          hedef.classList.toggle("kg-width-wide");
          bitir();
        })
      );
      cubuk.appendChild(ayrac());
    }

    if (t === "liste") {
      cubuk.appendChild(
        dugme("1.", "Numarali / madde isaretli", () => {
          const y = etiketDegistir(o, o.tagName === "OL" ? "ul" : "ol");
          sec(null);
          sec(y);
          bitir();
        })
      );
      cubuk.appendChild(ayrac());
    }

    /* --- her blokta olanlar --- */
    cubuk.appendChild(
      dugme("↑", "Yukari tasi", () => {
        const o2 = etkin?.previousElementSibling;
        if (o2 && etkin) o2.before(etkin);
        bitir();
      })
    );
    cubuk.appendChild(
      dugme("↓", "Asagi tasi", () => {
        const o2 = etkin?.nextElementSibling;
        if (o2 && etkin) o2.after(etkin);
        bitir();
      })
    );
    cubuk.appendChild(
      dugme("⧉", "Cogalt", () => {
        if (!etkin) return;
        const kopya = etkin.cloneNode(true) as HTMLElement;
        kopya.style.outline = "";
        etkin.after(kopya);
        bitir();
      })
    );
    cubuk.appendChild(dugme("+", "Altina blok ekle", menuyuAc));
    cubuk.appendChild(
      dugme(
        "✕",
        "Sil",
        () => {
          /* Son blok silinmiyor: govde bosalinca contenteditable icinde
             imlec koyacak yer kalmiyor ve yazi yazilamaz hale geliyor. */
          if (!etkin || govde.children.length <= 1) return;
          const yerine = (etkin.nextElementSibling ??
            etkin.previousElementSibling) as HTMLElement | null;
          etkin.remove();
          sec(yerine);
          bitir();
        },
        RENK.tehlike
      )
    );
  }

  /* ---------- olaylar ---------- */

  const uzerinde = (e: MouseEvent) => {
    if (menuAcik) return;
    let d = e.target as HTMLElement | null;
    while (d && d.parentElement !== govde) d = d.parentElement;
    if (d) sec(d);
  };

  /* Gorsele cift tiklamak da duzenleme penceresini aciyor: dugmeyi
     bulmadan once oraya tiklamak en dogal davranis. */
  const ciftTik = (e: MouseEvent) => {
    const h = e.target as HTMLElement;
    if (h?.tagName === "IMG") {
      e.preventDefault();
      gorselAc(h as HTMLImageElement);
    }
  };

  const disari = (e: MouseEvent) => {
    const h = e.relatedTarget as Node | null;
    if (h && (govde.contains(h) || cubuk.contains(h) || menu.contains(h))) return;
    gizle();
  };

  const menuKapat = (e: MouseEvent) => {
    if (!menuAcik) return;
    if (menu.contains(e.target as Node) || cubuk.contains(e.target as Node)) return;
    menuAcik = false;
    menu.style.display = "none";
  };

  govde.addEventListener("mousemove", uzerinde);
  govde.addEventListener("dblclick", ciftTik);
  govde.addEventListener("mouseleave", disari);
  cubuk.addEventListener("mouseleave", disari);
  document.addEventListener("mousedown", menuKapat, true);
  window.addEventListener("scroll", konumla, true);
  window.addEventListener("resize", konumla);

  return () => {
    govde.removeEventListener("mousemove", uzerinde);
    govde.removeEventListener("dblclick", ciftTik);
    govde.removeEventListener("mouseleave", disari);
    document.removeEventListener("mousedown", menuKapat, true);
    window.removeEventListener("scroll", konumla, true);
    window.removeEventListener("resize", konumla);
    cubuk.remove();
    menu.remove();
  };
}

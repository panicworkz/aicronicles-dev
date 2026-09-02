/**
 * CMS sayfalarinin (About, Advertise, Sponsor, Terms, Privacy) govde HTML'ini
 * bolumlere ayirir.
 *
 * Neden: bu sayfalar tek bir HTML blogu olarak geliyor ve oldugu gibi
 * basildiginda 1536'lik alanin ortasinda 760'lik ince bir serit olarak
 * kaliyordu. Bolumlere ayirinca bazilarini kart/serit olarak tam genislikte
 * basabiliyoruz; metin ise okunabilir olcusunde kaliyor.
 *
 * Icerik Ghost'tan geldigi icin yapisi duzenli: her bolum <h2 id="...">
 * ile basliyor, icinde <p> ve <ul><li> bulunuyor. Yine de duzensiz girdiye
 * karsi her adim tolansli yazildi; eslesme olmazsa bolum duz metin olarak
 * kalir, sayfa bozulmaz.
 */

export type Madde = { etiket: string | null; metin: string };

/** h3 + takip eden metin — About'taki yazar biyografileri boyle geliyor */
export type AltBolum = { id: string; baslik: string; metin: string };

export type Bolum = {
  id: string;
  baslik: string;
  /** h2'den sonraki ham HTML */
  icerikHtml: string;
  /** Ilk <ul> icindeki maddeler; kart/serit basmak icin */
  maddeler: Madde[];
  /** <h3> alt basliklari */
  altBolumler: AltBolum[];
  /** Liste disindaki paragraflar — kart basarken giris metni olarak kullanilir */
  paragrafHtml: string;
};

export type SayfaIcerigi = {
  /** Ilk h2'den once kalan kisim (About'ta kapak gorseli) */
  girisHtml: string;
  bolumler: Bolum[];
};

const etiketleriAt = (s: string) => s.replace(/<[^>]+>/g, "").trim();

/** &amp; &#160; gibi girisleri coz */
export function varliklariCoz(s: string): string {
  return s
    .replace(/&(amp|#38);/g, "&")
    .replace(/&(lt|#60);/g, "<")
    .replace(/&(gt|#62);/g, ">")
    .replace(/&(quot|#34);/g, '"')
    .replace(/&(#39|apos|rsquo|#8217);/g, "\u2019")
    .replace(/&(nbsp|#160);/g, " ")
    .replace(/&(mdash|#8212);/g, "\u2014")
    .replace(/&(ndash|#8211);/g, "\u2013")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/**
 * Cloudflare'in e-posta gizlemesini cozer.
 *
 * Ghost'tan gelen icerikte adresler /cdn-cgi/l/email-protection ile
 * gizlenmis. O betik bizim sitemizde calismadigi icin sayfada harfiyen
 * "[email protected]" yaziyordu — yani iletisim bolumu iseyaramaz haldeydi.
 * Ilk bayt anahtar, kalanlar onunla XOR'lanmis.
 */
export function cfEpostaCoz(hex: string): string | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length < 4 || hex.length % 2) return null;
  const anahtar = parseInt(hex.slice(0, 2), 16);
  let adres = "";
  for (let i = 2; i < hex.length; i += 2) {
    adres += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ anahtar);
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adres) ? adres : null;
}

/**
 * Sayfa HTML'ini yayina hazirlar: gizlenmis e-postalari acar, fabelo.io'ya
 * giden ic baglantilari goreceli hale getirir.
 */
export function baglantilariDuzelt(html: string): string {
  let s = html;

  // Gizlenmis e-posta -> calisan mailto baglantisi
  s = s.replace(
    /<a[^>]*href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"[^>]*>[\s\S]*?<\/a>/gi,
    (tam, hex) => {
      const adres = cfEpostaCoz(hex);
      return adres ? `<a href="mailto:${adres}">${adres}</a>` : tam;
    }
  );

  // Kendi alan adimiza giden mutlak baglantilar goreceli olsun; yoksa
  // okuyucu bu siteden fabelo.io'ya atiliyor.
  s = s.replace(/href="https?:\/\/(?:www\.)?fabelo\.io(\/[^"]*)?"/gi, (_, yol) => `href="${yol || "/"}"`);

  return s;
}

/** <li> icindeki "<strong>Etiket:</strong> metin" kalibini ayirir */
function maddeAyir(liHtml: string): Madde {
  const guclu = liHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
  if (!guclu) return { etiket: null, metin: varliklariCoz(etiketleriAt(liHtml)) };

  const etiket = varliklariCoz(etiketleriAt(guclu[1])).replace(/[:\u2014-]\s*$/, "").trim();
  const kalan = liHtml.slice((guclu.index ?? 0) + guclu[0].length);
  const metin = varliklariCoz(etiketleriAt(kalan)).replace(/^[\s:\u2014\u2013-]+/, "").trim();

  return { etiket: etiket || null, metin };
}

export function bolumlereAyir(html: string | null | undefined): SayfaIcerigi {
  const kaynak = baglantilariDuzelt(html ?? "");
  if (!kaynak.trim()) return { girisHtml: "", bolumler: [] };

  const baslikDeseni = /<h2([^>]*)>([\s\S]*?)<\/h2>/gi;
  const konumlar: { id: string; baslik: string; bas: number; son: number }[] = [];

  let e: RegExpExecArray | null;
  while ((e = baslikDeseni.exec(kaynak))) {
    const idEs = e[1].match(/id="([^"]+)"/i);
    konumlar.push({
      id: idEs ? idEs[1] : etiketleriAt(e[2]).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      baslik: varliklariCoz(etiketleriAt(e[2])),
      bas: e.index,
      son: baslikDeseni.lastIndex,
    });
  }

  if (!konumlar.length) return { girisHtml: kaynak, bolumler: [] };

  const bolumler: Bolum[] = konumlar.map((k, i) => {
    const icerikHtml = kaynak.slice(k.son, konumlar[i + 1]?.bas ?? kaynak.length);

    const ilkListe = icerikHtml.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
    const maddeler = ilkListe
      ? [...ilkListe[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => maddeAyir(m[1]))
      : [];

    const altBolumler: AltBolum[] = [];
    const altDeseni = /<h3([^>]*)>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|$)/gi;
    let a: RegExpExecArray | null;
    while ((a = altDeseni.exec(icerikHtml))) {
      const idEs = a[1].match(/id="([^"]+)"/i);
      const baslik = varliklariCoz(etiketleriAt(a[2]));
      altBolumler.push({
        id: idEs ? idEs[1] : baslik.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        baslik,
        metin: varliklariCoz(etiketleriAt(a[3])),
      });
    }

    // Liste ve alt basliklar disinda kalan paragraflar
    const paragrafHtml = icerikHtml
      .replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, "")
      .replace(/<h3[\s\S]*$/i, "")
      .trim();

    return { id: k.id, baslik: k.baslik, icerikHtml, maddeler, altBolumler, paragrafHtml };
  });

  return { girisHtml: kaynak.slice(0, konumlar[0].bas), bolumler };
}

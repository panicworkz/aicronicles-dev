import "server-only";

/**
 * UMAMI — SAYFA OLCUMU (okuma tarafi).
 *
 * NEDEN BU: sitede sayfa goruntuleme olcumu vardi ama panel onu
 * okuyamiyordu. Rapordaki "en cok gorulen yazilar" listesi reklam
 * gosterimlerine dayaniyordu — reklam tasimayan sayfalari saymayan,
 * reklam engelleyenleri gormeyen bir vekil olcu.
 *
 * KIMLIK DOGRULAMA: PAYLASIM JETONU, hesap degil.
 *
 * Once bunun icin Umami'de bir kullanici acmistim ve kullanici/parola
 * ile jeton aliyordum. YANLISTI: Umami'nin PAYLASIM (share) yapisi tam
 * olarak bu is icin var. Bir siteye paylasim aciliyor, ortaya cikan
 * kisa kod (slug) o sitenin istatistiklerini okumaya yetiyor — hicbir
 * hesap, hicbir parola gerekmiyor.
 *
 * Akis:
 *   GET /api/share/<slug>          -> { websiteId, token }   (kimliksiz)
 *   GET /api/websites/<id>/stats   -> IKI baslikla:
 *        x-umami-share-token: <token>
 *        x-umami-share-context: 1
 *
 * Ikinci baslik sart: yalnizca jetonla 401 doniyor. Ikisi de Umami'nin
 * kendi arayuzunun gonderdigi basliklar; deneyerek bulundu.
 *
 * GUVENLIK: slug'i bilen o sitenin istatistiklerini OKUYABILIR. Yazma,
 * silme ya da baska siteye erisim yok — paylasim tek siteye bagli ve
 * salt okunur. Slug ortam degiskeninde duruyor, koda yazilmiyor;
 * istenmedigi an Umami arayuzunden paylasim kapatiliyor.
 *
 * HICBIR HATA YUKARI CIKMIYOR: her fonksiyon basarisiz olursa null
 * donuyor. Olcum sunucusu cevap vermedi diye rapor ekrani cokmemeli.
 *
 * YAPILANDIRMA (.env):
 *   UMAMI_URL=https://umami.panic.pw
 *   UMAMI_SHARE_SLUG=<paylasim adresindeki kisa kod>
 *
 * Site kimligi paylasimin kendisinden geliyor, ayrica yazilmiyor: iki
 * yerde tutulsa birbirinden ayrisabilirlerdi.
 */

const KOK = (process.env.UMAMI_URL ?? "").replace(/\/+$/, "");
const SLUG = process.env.UMAMI_SHARE_SLUG ?? "";

export function umamiKurulu(): boolean {
  return Boolean(KOK && SLUG);
}

/** Kurulum eksikse hangi degiskenin eksik oldugunu soyler. */
export function umamiEksikleri(): string[] {
  const eksik: string[] = [];
  if (!KOK) eksik.push("UMAMI_URL");
  if (!SLUG) eksik.push("UMAMI_SHARE_SLUG");
  return eksik;
}

/* Jeton BELLEKTE tutuluyor: her rapor cizimi icin paylasim ucunu
   yeniden cagirmak gereksiz bir gidis-donus. */
let onbellek: { jeton: string; siteId: string; bitis: number } | null = null;

async function paylasim(): Promise<{ jeton: string; siteId: string } | null> {
  if (!umamiKurulu()) return null;
  if (onbellek && onbellek.bitis > Date.now()) return onbellek;

  try {
    const y = await fetch(`${KOK}/api/share/${encodeURIComponent(SLUG)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!y.ok) return null;
    const d = await y.json();
    if (!d?.token || !d?.websiteId) return null;

    onbellek = {
      jeton: d.token,
      siteId: d.websiteId,
      /* Bir saat: jeton daha uzun omurlu ama paylasim kapatilirsa
         saatlerce eski jetonla denemeye devam etmeyelim. */
      bitis: Date.now() + 60 * 60 * 1000,
    };
    return onbellek;
  } catch {
    return null;
  }
}

async function iste<T>(
  yol: string,
  parametre: Record<string, string | number>
): Promise<T | null> {
  const p = await paylasim();
  if (!p) return null;

  const adres = new URL(`${KOK}/api/websites/${p.siteId}${yol}`);
  for (const [k, v] of Object.entries(parametre)) adres.searchParams.set(k, String(v));

  try {
    const y = await fetch(adres, {
      headers: {
        Accept: "application/json",
        /* IKI BASLIK BIRDEN. Yalnizca jetonla 401 doniyor. */
        "x-umami-share-token": p.jeton,
        "x-umami-share-context": "1",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!y.ok) {
      /* Jeton eskimis olabilir: onbellegi bosalt, sonraki cagri
         yenisini alsin. */
      if (y.status === 401) onbellek = null;
      return null;
    }
    return (await y.json()) as T;
  } catch {
    return null;
  }
}

/* Rapor ekranindaki donem seciciden geliyor (lib/donem.ts). Umami
   milisaniye bekliyor; cevrim tek bir yerde yapilsin diye burada. */
export type UmamiAralik = { bas: Date; son: Date; birim: "hour" | "day" | "month" };

function araligi(d: UmamiAralik) {
  return { baslangic: d.bas.getTime(), bitis: d.son.getTime() };
}

export type UmamiOzet = {
  gosterim: number;
  ziyaretci: number;
  ziyaret: number;
  /* Onceki esit uzunluktaki donem — "artti mi azaldi mi" sorusu
     ancak bir oncekiyle karsilastirilarak cevaplaniyor. */
  oncekiGosterim: number | null;
};

/** Donem ozeti. */
export async function umamiOzet(d0: UmamiAralik): Promise<UmamiOzet | null> {
  const { baslangic, bitis } = araligi(d0);

  const d = await iste<any>("/stats", { startAt: baslangic, endAt: bitis });
  if (!d) return null;

  /* SUNUCUYA SORULDU, TAHMIN EDILMEDI.
     Once {pageviews:{value,prev}} bekliyordum. Kurulu surum duz sayi
     donuyor ve onceki donemi ayri bir "comparison" nesnesinde
     veriyor. Ikisi de okunuyor: bicim degisirse ekran cokmek yerine
     o alani bos gosteriyor. */
  const oku = (x: unknown) =>
    typeof x === "number" ? x : Number((x as any)?.value ?? 0) || 0;

  const onceki =
    typeof d?.comparison?.pageviews === "number"
      ? d.comparison.pageviews
      : typeof d?.pageviews?.prev === "number"
        ? d.pageviews.prev
        : null;

  return {
    gosterim: oku(d.pageviews),
    ziyaretci: oku(d.visitors),
    ziyaret: oku(d.visits ?? d.sessions),
    oncekiGosterim: onceki,
  };
}

/** Zaman icinde goruntuleme. Kova genisligi DONEMDEN geliyor. */
export async function umamiSeri(
  d0: UmamiAralik
): Promise<{ etiket: string; deger: number }[] | null> {
  const { baslangic, bitis } = araligi(d0);

  const d = await iste<any>("/pageviews", {
    startAt: baslangic,
    endAt: bitis,
    unit: d0.birim,
    timezone: "Europe/Istanbul",
  });
  if (!d?.pageviews) return null;

  /* Etiket de birime gore: saatlik seride tarih, aylik seride saat
     yazmak okunmaz bir eksen uretir. */
  const etiketle = (x: string) => {
    const t = new Date(x);
    if (d0.birim === "hour") {
      return t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    if (d0.birim === "month") {
      return t.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    }
    return t.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (d.pageviews as { x: string; y: number }[]).map((n) => ({
    etiket: etiketle(n.x),
    deger: Number(n.y) || 0,
  }));
}

/** En cok goruntulenen adresler. */
export async function umamiSayfalar(
  d0: UmamiAralik,
  adet = 10
): Promise<{ yol: string; deger: number }[] | null> {
  const { baslangic, bitis } = araligi(d0);

  /* type=path, type=url DEGIL. "url" yazdigimda sunucu 400 donuyor ve
     hicbir sey gorunmuyordu; kabul edilenler tek tek denendi (path,
     title, query, event gecerli). */
  const d = await iste<{ x: string; y: number }[]>("/metrics", {
    startAt: baslangic,
    endAt: bitis,
    type: "path",
    limit: adet,
  });
  if (!Array.isArray(d)) return null;

  return d.map((n) => ({ yol: n.x, deger: Number(n.y) || 0 }));
}

/** Okurlar nereden geliyor. */
export async function umamiKaynaklar(
  d0: UmamiAralik,
  adet = 8
): Promise<{ ad: string; deger: number }[] | null> {
  const { baslangic, bitis } = araligi(d0);

  const d = await iste<{ x: string | null; y: number }[]>("/metrics", {
    startAt: baslangic,
    endAt: bitis,
    type: "referrer",
    limit: adet,
  });
  if (!Array.isArray(d)) return null;

  return d.map((n) => ({
    /* Bos gonderen = adresi dogrudan yazan ya da yer imi. "unknown"
       demek yaniltici olurdu; bu bilinen bir sey. */
    ad: n.x?.trim() ? n.x.replace(/^https?:\/\//, "") : "direct / bookmark",
    deger: Number(n.y) || 0,
  }));
}

"use client";

import React from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Undo2,
  Redo2,
} from "lucide-react";

/**
 * YERINDE DUZENLEME TUVALI — yazi ve sabit sayfa icin TEK uygulama.
 *
 * NEDEN BURAYA TASINDI: bu tuval yazi editorunun icinde, yedi yuz
 * satirin arasinda duruyordu. Sabit sayfalara da ayni deneyimi
 * getirmek gerekince onunde iki yol vardi: kopyalamak ya da ayirmak.
 * Kopyalasaydik bugun ayni gorunen iki tuval olurdu ve ilk duzeltmede
 * ayrisirlardi — geri alma dugmesi bir tarafta calisip otekinde
 * calismayan bir sistem. Ayni sey iki kez yazilmiyor.
 *
 * SORUMLULUGU: cerceve, denetim seridi (geri/ileri, odak, cihaz,
 * yenileme) ve panel <-> onizleme mesajlasmasi. Kaydetme, alan
 * yonetimi ve kenar cubugu editorlerde kaliyor; onlar birbirinden
 * gercekten farkli.
 */

export type TuvalDegerleri = {
  title: string;
  excerpt: string;
  contentHtml: string;
  featuredImageUrl: string;
};

export type TuvalKolu = {
  /** Cerceveye mesaj yollar — gorsel sonucu, urun sonucu. */
  yolla: (type: string, payload: unknown) => void;
  /** Onizlemeyi bastan yukler. */
  yenile: () => void;
};

export type GorselIstegi = {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  isCover?: boolean;
  /** Onizlemedeki ogenin kimligi; sonuc ona geri yollaniyor. */
  istek?: string;
};

export function CanliTuval({
  kol,
  slug,
  degerler,
  onDegisim,
  onGorsel,
  onUrun,
  onKacis,
}: {
  kol?: React.RefObject<TuvalKolu | null>;
  slug: string;
  degerler: TuvalDegerleri;
  /** Onizlemede yapilan duzenleme panele geri geliyor. */
  onDegisim: (kismi: Partial<TuvalDegerleri>) => void;
  /** Onizlemeden gorsel duzenleme / degistirme istegi. */
  onGorsel?: (istek: GorselIstegi) => void;
  /** Onizlemeden urun karti istegi (yalnizca yazilarda kullaniliyor). */
  onUrun?: (istek: string | null) => void;
  /** Onizleme yanit vermiyorsa acilacak kacis kapisi. Verilmezse
      uyari da gosterilmiyor — kacis kapisi olmayan bir yerde
      "cozum var" demek yaniltici olurdu. */
  onKacis?: () => void;
}) {
  const cerceveRef = React.useRef<HTMLIFrameElement>(null);
  const [cerceveAnahtari, setCerceveAnahtari] = React.useState(0);
  const [cihaz, setCihaz] = React.useState<"desktop" | "tablet" | "mobile">("desktop");
  const [hazir, setHazir] = React.useState(false);
  const [gecikti, setGecikti] = React.useState(false);
  const [gecmis, setGecmis] = React.useState({ geri: 0, ileri: 0 });
  /* Odak kipi: onizlemede yalnizca duzenlenebilir alanlari goster. */
  const [odak, setOdak] = React.useState(false);

  const yolla = React.useCallback((type: string, payload: unknown) => {
    cerceveRef.current?.contentWindow?.postMessage(
      { type, source: "studio_parent", payload },
      /* "*" degil kendi kaynagimiz: mesaj baska bir siteye acilmis
         bir cerceveye sizmasin. */
      window.location.origin
    );
  }, []);

  React.useImperativeHandle(
    kol,
    () => ({ yolla, yenile: () => setCerceveAnahtari((k) => k + 1) }),
    [yolla]
  );

  /* Secim hatirlaniyor: her yazi acilista tercihi yeniden yapmak
     gereksiz. Sunucuda okunmuyor, yalnizca bu tarayicinin tercihi. */
  React.useEffect(() => {
    try {
      setOdak(localStorage.getItem("panic_odak") === "1");
    } catch {
      /* Gizli sekmede localStorage erisimi hata verebiliyor. */
    }
  }, []);

  /* En guncel degerler: cerceve "hazirim" dediginde o anki icerigi
     yolluyoruz ve mesaj isleyicisi eski bir kapanmis degeri
     gormemeli. */
  const degerlerRef = React.useRef(degerler);
  degerlerRef.current = degerler;

  /* CERCEVEDEN GELEN son degerler. Bunlari geri yollamak, yazarken
     govdeyi yeniden basmak ve imleci satir basina atmak demek. */
  const cerceveden = React.useRef<Partial<TuvalDegerleri>>({});

  const onDegisimRef = React.useRef(onDegisim);
  onDegisimRef.current = onDegisim;
  const onGorselRef = React.useRef(onGorsel);
  onGorselRef.current = onGorsel;
  const onUrunRef = React.useRef(onUrun);
  onUrunRef.current = onUrun;

  React.useEffect(() => {
    const isle = (olay: MessageEvent) => {
      /* Kaynak dogrulamasi: herhangi bir sekme bu panele mesaj
         yollayip duzenlenen icerigi degistirebilirdi. */
      if (olay.origin !== window.location.origin) return;
      const tur = olay.data?.type;

      /* Cerceve yuklendigini haber veriyor. Bu olmadan, cerceve
         acilmadan once yollanan ilk icerik kayboluyor ve onizleme
         kayitli surumde kaliyordu. */
      if (tur === "PANIC_STUDIO_PREVIEW_READY") {
        setHazir(true);
        const d = degerlerRef.current;
        yolla("PANIC_STUDIO_LIVE_UPDATE", {
          title: d.title,
          contentHtml: d.contentHtml,
          excerpt: d.excerpt,
          featuredImageUrl: d.featuredImageUrl,
        });
        return;
      }

      if (tur === "PANIC_LIVE_TO_STUDIO_SYNC") {
        const gelen = olay.data.payload || {};
        const kismi: Partial<TuvalDegerleri> = {};
        for (const alan of ["title", "contentHtml", "excerpt"] as const) {
          if (gelen[alan] !== undefined) kismi[alan] = gelen[alan];
        }
        cerceveden.current = { ...degerlerRef.current, ...kismi };
        onDegisimRef.current(kismi);
        return;
      }

      if (tur === "PANIC_STUDIO_HISTORY_STATE") {
        setGecmis({
          geri: Number(olay.data.payload?.geri ?? 0),
          ileri: Number(olay.data.payload?.ileri ?? 0),
        });
        return;
      }

      if (tur === "PANIC_OPEN_PRODUCT_PICKER") {
        onUrunRef.current?.(olay.data.payload?.istek ?? null);
        return;
      }

      if (tur === "PANIC_OPEN_IMAGE_STUDIO") {
        onGorselRef.current?.((olay.data.payload || {}) as GorselIstegi);
      }
    };

    window.addEventListener("message", isle);
    return () => window.removeEventListener("message", isle);
  }, [yolla]);

  /* PANELDEN gelen degisiklikler onizlemeye. Cerceveden gelen degeri
     geri yollamiyoruz — o yol yazarken imleci kaydiriyor. */
  React.useEffect(() => {
    if (!hazir) return;
    const c = cerceveden.current;
    if (
      c.title === degerler.title &&
      c.contentHtml === degerler.contentHtml &&
      c.excerpt === degerler.excerpt &&
      c.featuredImageUrl === degerler.featuredImageUrl
    ) {
      return;
    }
    yolla("PANIC_STUDIO_LIVE_UPDATE", {
      title: degerler.title,
      contentHtml: degerler.contentHtml,
      excerpt: degerler.excerpt,
      featuredImageUrl: degerler.featuredImageUrl,
    });
  }, [
    hazir,
    degerler.title,
    degerler.contentHtml,
    degerler.excerpt,
    degerler.featuredImageUrl,
    yolla,
  ]);

  /* Odak degisince cerceveye bildiriliyor; cerceve yeniden
     yuklendiginde de yeniden gonderiliyor, yoksa kip kayboluyor. */
  React.useEffect(() => {
    yolla("PANIC_STUDIO_FOCUS", { acik: odak });
  }, [odak, hazir, cerceveAnahtari, yolla]);

  /* Cerceve yeniden yuklenirken "hazir" sifirlanmali: yoksa panel
     onizlemenin ayakta oldugunu sanip ilk icerigi hic yollamaz. */
  React.useEffect(() => {
    setHazir(false);
    setGecikti(false);
  }, [cerceveAnahtari, slug]);

  /* Onizleme sekiz saniyede kendini bildirmezse bir sey ters gitmis
     demektir (sunucu kapali, sayfa hata veriyor, cerceve engellendi).
     Sessizce bos bir cerceve gostermek yerine kacis kapisini
     oneriyoruz. */
  React.useEffect(() => {
    if (hazir || !onKacis) return;
    const t = setTimeout(() => setGecikti(true), 8000);
    return () => clearTimeout(t);
  }, [hazir, cerceveAnahtari, onKacis]);

  const genislik =
    cihaz === "mobile" ? "w-[375px]" : cihaz === "tablet" ? "w-[768px]" : "w-full";

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/30">
      {/* ------------------------- DENETIM SERIDI -------------------------
          IKI GRUP: solda durum, sagda denetimler. Ogeler ince
          cizgilerle ayrilmis ve hepsi ayni yukseklikte; kenar cubugu
          ne yaparsa yapsin kume sag kenara yasli kaliyor. */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-xs">
        {/* --- sol: durum --- */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="truncate text-xs font-medium text-muted-foreground">
            Live In-Context Canvas
          </span>

          {/* Uyari SOLDA, durumun yaninda: sagdaki kumeyi itip
              denetimleri yerinden oynatmasin. */}
          {gecikti && !hazir && onKacis && (
            <button
              type="button"
              onClick={onKacis}
              className="ml-2 hidden cursor-pointer items-center gap-1.5 rounded-md border border-amber-400/60 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 sm:flex dark:bg-amber-950/40 dark:text-amber-200"
            >
              Preview isn’t responding — edit the HTML
            </button>
          )}
        </div>

        {/* --- sag: denetimler --- */}
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-muted/30 p-1">
          {/* GERI AL / ILERI AL — TEK yigin. Blok yuzeyinde metin
              duzenlemesi de blok islemleri de (tasi, sil, cogalt,
              ekle) ayni sirada duruyor; iki ayri dugme iki farkli
              gecmis varmis izlenimi verirdi. */}
          {(
            [
              ["geri", Undo2, "Undo (Cmd/Ctrl+Z)", gecmis.geri],
              ["ileri", Redo2, "Redo (Cmd/Ctrl+Shift+Z)", gecmis.ileri],
            ] as const
          ).map(([yon, Simge, ipucu, derinlik]) => (
            <button
              key={yon}
              type="button"
              disabled={derinlik === 0}
              onClick={() => yolla("PANIC_STUDIO_HISTORY", { yon })}
              title={
                derinlik === 0
                  ? `${ipucu} — nothing to ${yon === "geri" ? "undo" : "redo"}`
                  : ipucu
              }
              className={`flex size-7 items-center justify-center rounded-md transition ${
                derinlik === 0
                  ? "cursor-not-allowed text-muted-foreground/35"
                  : "cursor-pointer text-muted-foreground hover:text-foreground"
              }`}
            >
              <Simge className="size-3.5" />
            </button>
          ))}

          <span className="mx-0.5 h-4 w-px bg-border" />

          {/* ODAK. Yerinde duzenlemenin degeri icerigi gercek
              cevresinde gormek; ama her zaman gerekmiyor. */}
          <button
            type="button"
            onClick={() =>
              setOdak((o) => {
                try {
                  localStorage.setItem("panic_odak", o ? "0" : "1");
                } catch {}
                return !o;
              })
            }
            className={`h-7 cursor-pointer rounded-md px-2.5 text-[11px] font-medium transition ${
              odak
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={
              odak
                ? "Show the full page around the content"
                : "Hide everything except the content"
            }
          >
            {odak ? "Full page" : "Focus"}
          </button>

          <span className="mx-0.5 h-4 w-px bg-border" />

          {(
            [
              ["desktop", Monitor, "Desktop 100%"],
              ["tablet", Tablet, "Tablet 768px"],
              ["mobile", Smartphone, "Mobile 375px"],
            ] as const
          ).map(([kip, Simge, ipucu]) => (
            <button
              key={kip}
              type="button"
              onClick={() => setCihaz(kip)}
              title={ipucu}
              className={`flex size-7 cursor-pointer items-center justify-center rounded-md transition ${
                cihaz === kip
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Simge className="size-3.5" />
            </button>
          ))}

          <span className="mx-0.5 h-4 w-px bg-border" />

          <button
            type="button"
            onClick={() => setCerceveAnahtari((k) => k + 1)}
            title="Reload the preview"
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        <div
          className={`mx-auto h-full overflow-hidden rounded-xl border border-border bg-background shadow-lg transition-all duration-300 ${genislik}`}
        >
          {slug ? (
            <iframe
              ref={cerceveRef}
              key={`${slug}-${cerceveAnahtari}`}
              src={`/${slug}?live=1`}
              className="size-full border-0 bg-background"
              title="Live Web Preview"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-mono text-xs text-muted-foreground">
              Give the page an address to open the live canvas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

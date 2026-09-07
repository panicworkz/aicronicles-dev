'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

/**
 * Panelin kendi pencereleri.
 *
 * Panel her soruyu tarayiciya sordurmustu: prompt() ve confirm().
 * O kutu tarayicinin, panelin degil — kendi yazi tipi, kendi butonlari,
 * ustunde "fabelo.io" yazan bir baslik ve yaninda "Bu sayfanin ek
 * iletisim kutulari olusturmasinin onune gec" onay kutusu. Editor bir
 * kere onu isaretlerse panel BIR DAHA soru soramaz; silme onayi
 * sessizce reddedilir ve dugmeler calismiyormus gibi gorunur.
 *
 * Burada olan: sayfanin kendi katmani, kendi renkleri, Esc ile kapanma,
 * odak penceredeki ilk alana gecer ve kapaninca cagirana geri doner.
 */

function Katman({
  acik,
  kapat,
  baslik,
  aciklama,
  children,
  genislik = 'max-w-md',
}: {
  acik: boolean;
  kapat: () => void;
  baslik: string;
  aciklama?: string;
  children: React.ReactNode;
  genislik?: string;
}) {
  const kutu = useRef<HTMLDivElement>(null);
  /* Portal tarayiciya ihtiyac duyuyor; sunucuda document yok. */
  const [bindi, setBindi] = useState(false);
  useEffect(() => setBindi(true), []);

  /* kapat her renderda yeni bir islev olarak geliyor (cagiranlar ok
     islevi yaziyor). Etkiye dogrudan bagli olsaydi pencere HER
     renderda sokulup takilirdi: yani ikinci alana bir harf yazar
     yazmaz odak ilk alana geri sicrardi. Islevi bir kutuda tutup
     etkiyi yalnizca acik/kapali degisimine bagliyoruz. */
  const kapatRef = useRef(kapat);
  /* Atama render sirasinda degil etkide: bu proje React Compiler ile
     derleniyor ve render sirasinda ref yazmak kuraldisi. */
  useEffect(() => {
    kapatRef.current = kapat;
  }, [kapat]);

  useEffect(() => {
    if (!acik) return;

    const oncekiOdak = document.activeElement as HTMLElement | null;
    /* Arkadaki sayfa kaymasin. */
    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /* Odak pencerenin icine: ilk yazilabilir alan, yoksa pencerenin
       kendisi. Aksi halde Tab arkadaki forma kacar. */
    const t = setTimeout(() => {
      const ilk = kutu.current?.querySelector<HTMLElement>(
        'input, textarea, select, button[data-birincil]'
      );
      (ilk ?? kutu.current)?.focus();
    }, 0);

    const tus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        kapatRef.current();
      }
      if (e.key !== 'Tab') return;
      /* Odak dongusu pencerede kalsin. */
      const odaklanabilir = kutu.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select'
      );
      if (!odaklanabilir?.length) return;
      const ilk = odaklanabilir[0];
      const son = odaklanabilir[odaklanabilir.length - 1];
      if (e.shiftKey && document.activeElement === ilk) {
        e.preventDefault();
        son.focus();
      } else if (!e.shiftKey && document.activeElement === son) {
        e.preventDefault();
        ilk.focus();
      }
    };

    document.addEventListener('keydown', tus);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', tus);
      document.body.style.overflow = oncekiTasma;
      oncekiOdak?.focus?.();
    };
  }, [acik]);

  if (!acik || !bindi) return null;

  /* Katman z-[100010]: medya ve gorsel cekmeceleri z-[99999] ve
     [100000] kullaniyor, onay penceresi de onlarin ICINDEN aciliyor.
     Daha alcak bir deger pencereyi cekmecenin arkasina birakirdi —
     dugme calismiyormus gibi gorunurdu. */
  return createPortal(
    <div
      className="fixed inset-0 z-[100010] flex items-start justify-center overflow-y-auto p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={baslik}
    >
      {/* Perde — tiklayinca kapanir. */}
      <div
        className="pencere-perde fixed inset-0 bg-foreground/25 backdrop-blur-[2px]"
        onClick={kapat}
        aria-hidden="true"
      />
      <div
        ref={kutu}
        tabIndex={-1}
        className={`pencere-kutu relative w-full ${genislik} rounded-xl border border-border bg-background shadow-2xl outline-none`}
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{baslik}</h2>
          {aciklama && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{aciklama}</p>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

/** Icerigi cagiran belirleyen pencere (form vb. icin). */
export function Modal({
  acik,
  kapat,
  baslik,
  aciklama,
  genislik,
  children,
}: {
  acik: boolean;
  kapat: () => void;
  baslik: string;
  aciklama?: string;
  genislik?: string;
  children: React.ReactNode;
}) {
  return (
    <Katman acik={acik} kapat={kapat} baslik={baslik} aciklama={aciklama} genislik={genislik}>
      {children}
    </Katman>
  );
}

/** Pencerenin alt seridi — butonlar hep ayni yerde dursun diye. */
export function ModalAlt({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3.5">
      {children}
    </div>
  );
}

type OnaySorusu = {
  baslik: string;
  aciklama?: string;
  onayYazisi?: string;
  yikici?: boolean;
};

/**
 * confirm() yerine.
 *
 * Kullanimi ayni sekilde okunuyor:
 *   const { onayla, onayPenceresi } = useOnay();
 *   if (!(await onayla({ baslik: '...' }))) return;
 * ...ve bilesenin sonuna {onayPenceresi} konuyor.
 *
 * Bilesen degil ELEMAN donuyor: her soruda yeni bir bilesen turu
 * uretilseydi React agaci sokup yeniden takar, pencere de her
 * aciliste bir kare bos kalirdi.
 */
export function useOnay() {
  const [soru, setSoru] = useState<OnaySorusu | null>(null);
  const cevap = useRef<((e: boolean) => void) | null>(null);

  const onayla = useCallback((s: OnaySorusu) => {
    setSoru(s);
    return new Promise<boolean>((coz) => {
      cevap.current = coz;
    });
  }, []);

  const bitir = useCallback((e: boolean) => {
    setSoru(null);
    cevap.current?.(e);
    cevap.current = null;
  }, []);

  const onayPenceresi = (
    <Katman
      acik={Boolean(soru)}
      kapat={() => bitir(false)}
      baslik={soru?.baslik ?? ''}
      aciklama={soru?.aciklama}
      genislik="max-w-sm"
    >
      <ModalAlt>
        <Button variant="outline" onClick={() => bitir(false)}>
          Cancel
        </Button>
        <Button
          data-birincil
          className={
            soru?.yikici ? 'bg-red-600 text-white hover:bg-red-700 border-transparent' : undefined
          }
          onClick={() => bitir(true)}
        >
          {soru?.onayYazisi ?? 'Confirm'}
        </Button>
      </ModalAlt>
    </Katman>
  );

  return { onayla, onayPenceresi };
}

/* ---------------------------------------------------------------
   Panelin tek onay penceresi.

   Onay sorusu on kusur ekranda var (sil, kaldir, kalici sil...).
   Her birine ayri bir durum degiskeni ve ayri bir <pencere/> koymak
   ayni seyi on kez yazmak olurdu; biri unutulunca da o ekran yine
   tarayicinin kutusunu acardi.

   Bunun yerine pencere BIR KEZ panel duzeninde duruyor, ekranlar
   yalnizca soruyu soruyor:  if (!(await onayla({...}))) return;
   --------------------------------------------------------------- */

let acikPencere: ((s: OnaySorusu) => Promise<boolean>) | null = null;

/** Ekranlarin cagirdigi soru. confirm() ile ayni sekilde okunur. */
export function onayla(s: OnaySorusu): Promise<boolean> {
  /* Katman takili degilse (ornegin panel disinda bir ekranda)
     hicbir sey sormadan gecmek tehlikeli olurdu; tarayicinin
     kutusuna duseriz. */
  if (!acikPencere) return Promise.resolve(window.confirm(s.baslik));
  return acikPencere(s);
}

/** Panel duzenine bir kez konur. */
export function OnayKatmani() {
  const { onayla: sor, onayPenceresi } = useOnay();
  useEffect(() => {
    acikPencere = sor;
    return () => {
      acikPencere = null;
    };
  }, [sor]);
  return onayPenceresi;
}

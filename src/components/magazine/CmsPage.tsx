import React from "react";
import { parse } from "node-html-parser";

/**
 * SABIT SAYFA DUZENI.
 *
 * ONCEKI HALI VE NEDEN DEGISTI:
 * Bu bilesen sayfanin govdesini h2'lere gore bolumlere ayiriyor ve her
 * bolumu ayri bir kapta basiyordu. Hangi bolumun kart, hangisinin serit
 * olacagi ise KODDA bir eslesme tablosunda duruyordu:
 *
 *   advertise > "advertising-formats" > ilk <ul> > kart izgarasi
 *
 * Bunun uc bedeli vardi. (1) Yazar bir basligin metnini degistirince
 * kimligi da degisiyor, duzen sessizce duz metne dusuyordu. (2) Yeni bir
 * sabit sayfa acan kisi tabloyu bilmedigi icin hicbir duzene
 * ulasamiyordu. (3) Govde parca parca basildigi icin YERINDE DUZENLEME
 * calismiyordu: blok yuzeyi tek bir govde kabi ariyor.
 *
 * SIMDI: govde yazilarla ayni blok modelinden basiliyor ve tek bir kapta
 * duruyor. Kart, bant ve kunye artik birer BLOK — duzeni yazar koyuyor,
 * kod tahmin etmiyor. Sayfa da yazi gibi uzerinde duzenlenebiliyor.
 *
 * Icindekiler rayi kaldi ama artik TURETILMIS: govdedeki h2'lerden
 * okunuyor, duzenlenebilir icerik degil. Yazarin yazdigi bir sey degil,
 * yazdiginin haritasi.
 */

/** Govdedeki h2'lerden yan ray icin baslik listesi cikarir. */
function raydakiBasliklar(html: string): { id: string; baslik: string }[] {
  if (!html) return [];
  return parse(html)
    .querySelectorAll("h2")
    .map((h) => ({ id: h.getAttribute("id") ?? "", baslik: h.textContent.trim() }))
    .filter((h) => h.id && h.baslik);
}

export default function CmsPage({
  baslik,
  ozet,
  govdeHtml,
  kapakUrl,
  bolum,
  guncellendi,
}: {
  baslik: string;
  ozet?: string | null;
  govdeHtml: string;
  kapakUrl?: string | null;
  /** Ust bantta gorunen kunye etiketi — LEGAL, MASTHEAD, PARTNERSHIPS */
  bolum: string;
  guncellendi?: Date | null;
}) {
  const basliklar = raydakiBasliklar(govdeHtml);

  return (
    <main>
      {/* --- Baslik bandi ------------------------------------------------ */}
      {/* data-odak: odak kipinde gorunur kalacak bolge — yazarin bu
          ekranda gercekten degistirebildigi sey. */}
      <header data-odak="1" className="mag-wrap pt-14 sm:pt-20">
        <div className="folio mb-4" style={{ color: "var(--accent)" }}>
          § FABELO
        </div>
        {/* data-canli: panelin onizleme cercevesi bu isaretle bulup
            gunceliyor. Sinif adina bagli olsaydi bir tasarim
            degisikligi onizlemeyi sessizce kirardi. */}
        <h1
          data-canli="baslik"
          className="display max-w-[20ch] text-[clamp(2.6rem,6vw,4.75rem)] leading-[0.98]"
        >
          {baslik}
        </h1>
        {ozet && (
          <p
            data-canli="ozet"
            className="mt-7 max-w-[62ch] text-[1.15rem] leading-relaxed sm:text-[1.28rem]"
            style={{ color: "var(--ink-2)" }}
          >
            {ozet}
          </p>
        )}
        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-5"
          style={{ borderTop: "2px solid var(--ink)" }}
        >
          <span className="byline">{bolum}</span>
          {guncellendi && (
            <span className="byline">
              LAST UPDATED{" "}
              {guncellendi.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {kapakUrl && (
          <figure className="mt-10">
            <div className="plate w-full" style={{ aspectRatio: "21 / 9" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-canli="kapak"
                src={kapakUrl}
                alt={baslik}
                className="size-full object-cover"
              />
            </div>
          </figure>
        )}
      </header>

      {/* --- Ray + govde --------------------------------------------------
          IZGARA DEGIL ESNEK KUTU, bilerek. Izgara iki kolon tanimliyordu
          (240px + kalan); ray gizlendiginde — odak kipinde ya da uc
          basliktan az sayfada — govde BIRINCI kolonda kaliyor ve 240
          piksele siksiyordu. Odakta metnin daralmasinin sebebi buydu.
          Esnek kutuda gizlenen ray yer kaplamiyor, govde dogal olarak
          tam genislige aciliyor. */}
      <div className="mag-wrap pb-20 pt-14 sm:pb-28">
        <div className="lg:flex lg:gap-x-12">
          {/* Ucten az baslikta ray gostermeye degmez.
              GIZLEME KOSULU, VARLIK KOSULU DEGIL: ray her zaman
              basiliyor, azken data-ray-gizli ile gizleniyor. Once hic
              basilmiyordu; tuvalde ucuncu basligi yazan biri rayin
              dogmasini goremiyordu — DOM'da olmayan bir seyi tazelemek
              mumkun degil. */}
          <aside
            data-canli="ray"
            {...(basliklar.length > 2 ? {} : { "data-ray-gizli": "1" })}
            className="hidden shrink-0 lg:block lg:w-[240px]"
          >
            {/* Yapiskanlik ic sarmalayicida: aside kolonun tamamini
                kaplasin ki ray kaydirma boyunca gezsin. */}
            <div style={{ position: "sticky", top: "calc(var(--mag-header-h, 145px) + 2rem)" }}>
              <div className="folio mb-4" style={{ color: "var(--accent)" }}>
                § CONTENTS
              </div>
              <nav>
                <ol className="flex flex-col">
                  {basliklar.map((b, i) => (
                    <li key={b.id} style={{ borderTop: "1px solid var(--rule)" }}>
                      <a
                        href={`#${b.id}`}
                        className="flex gap-3 py-2.5 text-[0.88rem] leading-snug transition-colors hover:text-[var(--accent-ink)]"
                      >
                        <span className="folio shrink-0" style={{ color: "var(--ink-3)" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{b.baslik}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          {/* TEK PARCA GOVDE. Bolunmus kaplar yerinde duzenlemeyi
              imkansiz kiliyordu; metin olcusu artik CSS'te
              (.article-body--sayfa), kart ve bant kolonun tamamina
              yayiliyor. */}
          <div
            data-canli="govde"
            data-odak="1"
            className="article-body article-body--sayfa min-w-0 flex-1 text-[1.06rem] leading-[1.78]"
            dangerouslySetInnerHTML={{ __html: govdeHtml }}
          />
        </div>
      </div>
    </main>
  );
}

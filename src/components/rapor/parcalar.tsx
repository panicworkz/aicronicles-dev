import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * RAPOR PARCALARI.
 *
 * GRAFIK KITAPLIGI YOK, bilerek: burada cizilen sey yatay ve dikey
 * cubuklardan ibaret. Bir kitaplik yuz kilobayttan fazla JavaScript
 * indirtir, tema degisiminde ayri ayarlanir ve yazdirmada bozulur.
 * Genislik yuzdesi CSS'e yaziliyor; ayni yaklasim yayin tarafindaki
 * "grafik" blogunda da kullaniliyor.
 *
 * HER SAYI OLCULEN BIR SEY. Tahmin, ortalama ya da "ornek veri" yok:
 * gosterilecek veri olmadiginda kutu bos kaliyor ve NEDEN bos oldugu
 * yaziyor. Bos bir panelde uydurma rakam gostermek, ilk bakista
 * hosuna gider, ikinci bakista guveni bitirir.
 */

export function Kutu({
  baslik,
  aciklama,
  sag,
  children,
}: {
  baslik: string;
  aciklama?: string;
  sag?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">{baslik}</CardTitle>
          {aciklama && (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {aciklama}
            </p>
          )}
        </div>
        {sag}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function Bos({ neden }: { neden: string }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">{neden}</p>
  );
}

export function Sayi({
  etiket,
  deger,
  alt,
  vurgu,
  kivilcim,
  kivilcimBicim,
}: {
  etiket: string;
  deger: string;
  alt?: string;
  vurgu?: boolean;
  /* Karti bir seyir cizgisiyle tamamlar: tek bir sayi "iyi mi kotu
     mu" sorusuna cevap vermiyor, yonu veriyorsa veriyor. Etiketler de
     geliyor — uzerine gelince hangi gun oldugu yazsin diye. */
  kivilcim?: { etiket: string; deger: number }[];
  kivilcimBicim?: (n: number) => string;
}) {
  return (
    <Card className="shadow-xs">
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{etiket}</p>
        <p
          className={`mt-1 text-2xl font-bold leading-tight ${
            vurgu ? "text-primary" : "text-foreground"
          }`}
        >
          {deger}
        </p>
        {alt && (
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{alt}</p>
        )}
        {kivilcim && <Kivilcim veri={kivilcim} bicim={kivilcimBicim} />}
      </CardContent>
    </Card>
  );
}

/** Dikey cubuklar — zaman serisi. */
export function Sutunlar({
  veri,
  bicim = (n: number) => String(n),
}: {
  veri: { etiket: string; deger: number; ipucu?: string }[];
  bicim?: (n: number) => string;
}) {
  if (!veri.length) return <Bos neden="No data in this period yet." />;
  const enBuyuk = Math.max(...veri.map((v) => v.deger), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height: 150 }}>
      {veri.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-primary/80 transition-all"
              /* Sifir da GORUNUYOR (2 piksel): hic cubuk olmamasi ile
                 sifir ayni sey degil ve okuyan kisi ikisini
                 ayirabilmeli. */
              style={{ height: `${Math.max((v.deger / enBuyuk) * 100, v.deger > 0 ? 4 : 1.5)}%` }}
              title={v.ipucu ?? `${v.etiket}: ${bicim(v.deger)}`}
            />
          </div>
          <span className="w-full truncate text-center text-[9px] text-muted-foreground">
            {v.etiket}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Yatay cubuklar — siralama. */
export function Siralama({
  veri,
  bicim = (n: number) => String(n),
}: {
  veri: { etiket: string; deger: number; adres?: string; alt?: string }[];
  bicim?: (n: number) => string;
}) {
  if (!veri.length) return <Bos neden="Nothing to rank yet." />;
  const enBuyuk = Math.max(...veri.map((v) => v.deger), 1);

  return (
    <div className="space-y-2.5">
      {veri.map((v, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 truncate">
              {v.adres ? (
                <Link href={v.adres} className="hover:text-primary hover:underline">
                  {v.etiket}
                </Link>
              ) : (
                v.etiket
              )}
              {v.alt && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">{v.alt}</span>
              )}
            </span>
            <span className="shrink-0 font-medium tabular-nums">{bicim(v.deger)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${Math.max((v.deger / enBuyuk) * 100, 1)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Bir bolumu kac parcaya ayrildigini gosteren serit. */
export function Pay({
  veri,
}: {
  veri: { etiket: string; deger: number }[];
}) {
  const toplam = veri.reduce((t, v) => t + v.deger, 0);
  if (!toplam) return <Bos neden="Nothing recorded yet." />;

  const renkler = ["bg-primary", "bg-primary/70", "bg-primary/45", "bg-primary/25"];

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {veri.map((v, i) => (
          <div
            key={i}
            className={renkler[i % renkler.length]}
            style={{ width: `${(v.deger / toplam) * 100}%` }}
            title={`${v.etiket}: ${v.deger}`}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        {veri.map((v, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className={`size-2 shrink-0 rounded-full ${renkler[i % renkler.length]}`} />
              <span className="truncate">{v.etiket}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {v.deger} · {Math.round((v.deger / toplam) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SAGLIK SATIRI — "su kadar kayitta su eksik".
 *
 * Sayiyi tek basina gostermek ise yaramiyor: "12 yazida meta
 * aciklamasi yok" cumlesi, hangi on iki yazi oldugunu bilmeden bir
 * is emri degil. O yuzden her satir etkilenen kayitlari da veriyor
 * ve dogrudan duzenleme ekranina baglaniyor.
 */
export function Saglik({
  baslik,
  neden,
  ogeler,
  toplam,
  /* "firsat": bir kusur degil, yapilirsa iyi olacak sey. Ayri
     gorunmesi lazim — hepsini ayni turuncuyla gostermek, gercek
     eksiklerle iyilestirme onerilerini ayni telaşa sokuyordu. */
  tur = "kusur",
}: {
  baslik: string;
  neden: string;
  ogeler: { ad: string; adres: string }[];
  toplam: number;
  tur?: "kusur" | "firsat";
}) {
  const temiz = ogeler.length === 0;
  /* Kutucugun kimligi baslikтан turetiliyor: ayni ekranda yedi satir
     var ve hepsi ayni kimligi tasisaydi birine basmak hepsini
     acardi. */
  const anahtar = `ry-${baslik.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="border-t py-3 first:border-t-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium">{baslik}</span>
        <span
          className={`shrink-0 text-xs font-semibold tabular-nums ${
            temiz
              ? "text-emerald-600 dark:text-emerald-400"
              : tur === "firsat"
                ? "text-sky-600 dark:text-sky-400"
                : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {temiz ? "clear" : `${ogeler.length} of ${toplam}`}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{neden}</p>
      {!temiz && (
        /* ETIKET DEGIL LISTE.
           Once her yazi kucuk bir "chip" idi: baslik kirpiliyordu,
           hangisi oldugu anlasilmiyordu ve yan yana dizilince liste
           degil etiket bulutu gibi duruyordu. Bir IS LISTESI okunmak
           icin alt alta olmali.

           Yedinciden itibaren gizli; gizleme saf CSS ile (gizli bir
           kutucuk + kardes secici), JavaScript indirilmiyor. */
        <div className="mt-2 flex flex-col">
          <input id={anahtar} type="checkbox" className="peer sr-only" />

          {ogeler.map((o, i) => (
            <Link
              key={o.adres}
              href={o.adres}
              className={`group flex items-center justify-between gap-3 border-t px-1 py-1.5 text-[11px] transition-colors hover:bg-muted/50 ${
                i < 6 ? "flex" : "hidden peer-checked:flex"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-5 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  {i + 1}
                </span>
                <span className="truncate">{o.ad}</span>
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground group-hover:text-primary">
                Open →
              </span>
            </Link>
          ))}

          {/* IKI AYRI ETIKET, tek etiket icinde iki span DEGIL: kardes
              secici yalnizca KARDESLERE isliyor. */}
          {ogeler.length > 6 && (
            <>
              <label
                htmlFor={anahtar}
                className="cursor-pointer select-none border-t px-1 py-1.5 text-[11px] font-medium text-primary hover:underline peer-checked:hidden"
              >
                Show the other {ogeler.length - 6}
              </label>
              <label
                htmlFor={anahtar}
                className="hidden cursor-pointer select-none border-t px-1 py-1.5 text-[11px] font-medium text-primary hover:underline peer-checked:block"
              >
                Show fewer
              </label>
            </>
          )}

          <p className="hidden px-1 pt-1.5 text-[10px] leading-relaxed text-muted-foreground peer-checked:block">
            That is all {ogeler.length} of them.{" "}
            {toplam - ogeler.length > 0
              ? `The other ${toplam - ogeler.length} are already fine.`
              : "Every article is on this list."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   SVG GRAFIKLER

   Neden SVG, neden kitaplik degil: cizilen sey birkac poligon ve
   yay. Bir grafik kitapligi yuz kilobayttan fazla JavaScript
   indirtir, kendi temasini getirir, yazdirmada bozulur ve ekran
   okuyucuya hicbir sey soylemez. Burada cizgi de halka da tek bir
   path — tema degiskenlerini oldugu gibi kullaniyor, sunucuda
   basiliyor ve yazdirmada da duruyor.
   ================================================================== */

/** Bir dizi degeri 0-1 arasina indirger. */
function olcekle(veri: number[]): number[] {
  const enBuyuk = Math.max(...veri, 0);
  const enKucuk = Math.min(...veri, 0);
  const aralik = enBuyuk - enKucuk || 1;
  return veri.map((d) => (d - enKucuk) / aralik);
}

/**
 * ALAN GRAFIGI — zaman icinde seyir.
 *
 * YAZILAR NEDEN SVG'DE DEGIL:
 * Ilk hali her seyi SVG icine ciziyordu — eksen etiketleri de ipucu
 * da. SVG bir viewBox'a gore olcekleniyor: grafik tam genislikte bir
 * kartta duruyorsa on alti punto on alti piksel; ama ayni bilesen iki
 * kolonlu bir izgarada yari genislige dusunce olcek yariya iniyor ve
 * ayni yazi SEKIZ PIKSEL oluyor. Okunmuyor. Puntoyu buyutmek
 * cozmuyor cunku sorun puntoda degil, olcekte.
 *
 * Simdi: cizgi, alan ve kilavuz cizgileri SVG (esnesinler diye
 * preserveAspectRatio="none"), butun YAZILAR ve noktalar ise HTML.
 * HTML'deki punto gercek piksel — kart ne kadar dar olursa olsun
 * degismiyor.
 */
export function Alan({
  veri,
  bicim = (n: number) => String(n),
  yukseklik = 230,
}: {
  veri: { etiket: string; deger: number; ipucu?: string }[];
  bicim?: (n: number) => string;
  yukseklik?: number;
}) {
  if (veri.length < 2) return <Bos neden="Not enough points to draw a line yet." />;

  const enBuyuk = Math.max(...veri.map((v) => v.deger));
  const olcekTavan = enBuyuk > 0 ? enBuyuk * 1.15 : 1;

  /* Sayilar tam ise eksen de tam olmali: yarim siparis yok. */
  const tamSayi = veri.every((v) => Number.isInteger(v.deger));
  const hamKademe = enBuyuk > 0 ? [0, enBuyuk / 2, enBuyuk] : [0, 1];
  const kademeler = [...new Set(hamKademe.map((k) => (tamSayi ? Math.round(k) : k)))];

  /* Yuzde olarak konum: hem SVG hem HTML ayni hesabi kullaniyor,
     boylece nokta ile cizgi her genislikte ust uste oturuyor. */
  const xy = (i: number) => (veri.length === 1 ? 50 : (i / (veri.length - 1)) * 100);
  const yy = (d: number) => 100 - (d / olcekTavan) * 100;

  const noktalar = veri.map((v, i) => `${xy(i).toFixed(2)},${yy(v.deger).toFixed(2)}`);
  const cizgi = `M${noktalar.join(" L")}`;
  const alan = `${cizgi} L100,100 L0,100 Z`;

  /* Tarih etiketi: hepsini basmak dar ekranda ust uste bindiriyor. */
  const adim = veri.length > 8 ? Math.ceil(veri.length / 6) : 1;

  return (
    <div className="w-full" style={{ height: yukseklik }}>
      <div className="relative h-full w-full pb-6 pl-14 pr-2 pt-3">
        {/* --- deger ekseni (HTML) --- */}
        {kademeler.map((k, i) => (
          <span
            key={`y${i}`}
            className="absolute left-0 w-12 -translate-y-1/2 text-right text-[11px] text-muted-foreground"
            style={{ top: `calc(0.75rem + ${yy(k)}% * (100% - 2.25rem) / 100)` }}
          >
            {bicim(tamSayi ? Math.round(k) : k)}
          </span>
        ))}

        {/* --- cizim alani --- */}
        <div className="relative h-full w-full">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ry-alan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.20" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {kademeler.map((k, i) => (
              <line
                key={`g${i}`}
                x1="0"
                x2="100"
                y1={yy(k)}
                y2={yy(k)}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path d={alan} fill="url(#ry-alan)" className="text-primary" />
            <path
              d={cizgi}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="text-primary"
            />
          </svg>

          {/* --- noktalar, seritler ve ipucu (HTML) ---
              Serit grafigin tam yuksekliginde: degeri gormek icin
              kucuk bir noktaya isabet ettirmek gerekmiyor. */}
          {veri.map((v, i) => (
            <div
              key={`b${i}`}
              className="group absolute top-0 h-full -translate-x-1/2"
              style={{ left: `${xy(i)}%`, width: `${Math.max(100 / veri.length, 4)}%` }}
            >
              {/* bg-border kullaniliyor, bg-foreground/20 DEGIL: alfali tema
                  rengi bu projede hic uretilmiyor (asagidaki nota bak),
                  yani kilavuz cizgisi gorunmez kaliyordu. */}
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border opacity-0 group-hover:opacity-100" />
              <div
                className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-60 group-hover:size-3 group-hover:opacity-100"
                style={{ left: "50%", top: `${yy(v.deger)}%` }}
              />
              <div
                className="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-center shadow-lg group-hover:block"
                style={{ top: `${yy(v.deger)}%` }}
              >
                {/* ALFA DEGIL OPACITY.
                    "text-background/70" gecersiz CSS uretiyordu:
                    tema renkleri ham oklch() degeri olarak tanimli ve
                    Tailwind 3'te alfa birlestirmesi bu bicimde
                    calismiyor — kural tumuyle dusuyor, yazi koyu
                    zeminde koyu kaliyor ve ipucunun ust satiri BOS
                    gorunuyordu. Ayri bir opacity sinifi her durumda
                    calisiyor. */}
                <div className="text-[11px] font-medium text-background opacity-70">
                  {v.etiket}
                </div>
                <div className="text-[15px] font-bold leading-tight text-background">
                  {v.ipucu ?? bicim(v.deger)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- tarih ekseni (HTML) --- */}
        <div className="absolute inset-x-0 bottom-0 h-6 pl-14 pr-2">
          <div className="relative h-full w-full">
            {veri.map((v, i) =>
              i % adim === 0 || i === veri.length - 1 ? (
                <span
                  key={`x${i}`}
                  className="absolute top-1 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted-foreground"
                  style={{ left: `${xy(i)}%` }}
                >
                  {v.etiket}
                </span>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HALKA — bir butunun paylari.
 *
 * Serit (Pay) ayni bilgiyi veriyordu ama uc-dort parcada oranlar
 * goz karari zor ayirt ediliyor. Halkanin ortasi da bos durmuyor:
 * toplam oraya yaziliyor, yani grafik ayni anda hem dagilimi hem
 * buyuklugu soyluyor.
 */
export function Halka({
  veri,
  toplamEtiketi,
}: {
  veri: { etiket: string; deger: number }[];
  toplamEtiketi?: string;
}) {
  const toplam = veri.reduce((t, v) => t + v.deger, 0);
  if (!toplam) return <Bos neden="Nothing recorded yet." />;

  const R = 54;
  const kalinlik = 18;
  const cevre = 2 * Math.PI * R;
  const tonlar = [1, 0.68, 0.42, 0.24, 0.14];

  let birikim = 0;

  return (
    /* Halka da kartin genisligini kullaniyor: sabit 140 pikselde
       kalinca genis kartlarda saga dogru kocaman bir bosluk
       kaliyordu. Simdi olcu esnek, ama bir ust sinir var — cok genis
       bir kartta halkanin devlesmesi de anlamsiz. */
    <div className="flex flex-wrap items-center justify-between gap-6">
      <svg
        viewBox="0 0 140 140"
        className="h-auto w-[min(190px,45%)] shrink-0"
        role="img"
      >
        <g transform="translate(70,70) rotate(-90)">
          {veri.map((v, i) => {
            const pay = v.deger / toplam;
            const uzunluk = pay * cevre;
            const daire = (
              <circle
                key={i}
                r={R}
                fill="none"
                stroke="currentColor"
                strokeOpacity={tonlar[i % tonlar.length]}
                strokeWidth={kalinlik}
                strokeDasharray={`${uzunluk} ${cevre - uzunluk}`}
                strokeDashoffset={-birikim}
                className="text-primary"
              >
                <title>{`${v.etiket}: ${v.deger} (${Math.round(pay * 100)}%)`}</title>
              </circle>
            );
            birikim += uzunluk;
            return daire;
          })}
        </g>
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-foreground text-[22px] font-bold"
        >
          {toplam}
        </text>
        {toplamEtiketi && (
          <text
            x="70"
            y="82"
            textAnchor="middle"
            className="fill-muted-foreground text-[9px] uppercase tracking-wider"
          >
            {toplamEtiketi}
          </text>
        )}
      </svg>

      <div className="min-w-[150px] flex-1 space-y-2">
        {veri.map((v, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-sm bg-primary"
                style={{ opacity: tonlar[i % tonlar.length] }}
              />
              <span className="truncate capitalize">{v.etiket}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {Math.round((v.deger / toplam) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SAYI KARTININ ALTINDAKI SEYIR CIZGISI.
 *
 * IPUCU HTML, SVG DEGIL — buyuk grafiklerdeki ayni sebep. Yazi SVG
 * icinde olunca kartin genisligiyle birlikte kuculuyor: dar bir
 * kartta on alti punto sekiz piksele dusuyor ve okunmuyor. HTML'de
 * punto gercek piksel, kart ne kadar dar olursa olsun degismiyor.
 */
export function Kivilcim({
  veri,
  bicim = (n: number) => String(n),
}: {
  veri: { etiket: string; deger: number }[];
  bicim?: (n: number) => string;
}) {
  if (!veri || veri.length < 2) return null;

  const degerler = veri.map((v) => v.deger);
  const enBuyuk = Math.max(...degerler);
  const enKucuk = Math.min(...degerler);
  const aralik = enBuyuk - enKucuk || 1;

  const xy = (i: number) => (i / (veri.length - 1)) * 100;
  const yy = (d: number) => 100 - ((d - enKucuk) / aralik) * 100;

  const cizgi = `M${veri.map((v, i) => `${xy(i).toFixed(2)},${yy(v.deger).toFixed(2)}`).join(" L")}`;

  return (
    <div className="relative mt-3 h-10 w-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d={cizgi}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="text-primary/70"
        />
      </svg>

      {veri.map((v, i) => (
        <div
          key={i}
          className="group absolute top-0 h-full -translate-x-1/2"
          style={{ left: `${xy(i)}%`, width: `${Math.max(100 / veri.length, 3)}%` }}
        >
          <div
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 group-hover:opacity-100"
            style={{ left: "50%", top: `${yy(v.deger)}%` }}
          />
          <div
            className="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-center shadow-lg group-hover:block"
            style={{ top: `${yy(v.deger)}%` }}
          >
            <div className="text-[11px] font-medium text-background opacity-70">
              {v.etiket}
            </div>
            <div className="text-[14px] font-bold leading-tight text-background">
              {bicim(v.deger)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/providers/theme-provider";
import CustomCursor from "@/components/magazine/CustomCursor";
import BackToTop from "@/components/magazine/BackToTop";
import AnchorPin from "@/components/magazine/AnchorPin";
import NavProgress from "@/components/magazine/NavProgress";
import CanliOnizleme from "@/components/magazine/CanliOnizleme";
import VideoOynat from "@/components/magazine/VideoOynat";
import Olcum from "@/components/magazine/Olcum";
import "./globals.css";
import { SITE, SITE_ADI } from "@/lib/seo";

/**
 * Sekme simgesi. Ghost /favicon.png yayinliyordu; bu CMS'te hicbir
 * favicon yoktu ve fabelo.io'ya gectikten sonra /favicon.ico 404
 * donuyordu — sekmede bos bir kagit. Marka simgesi zaten depoda:
 * public/images/fabelo-icon.png (256x256). Yeni bir sey cizilmedi.
 *
 * Sayfalar kendi alternates'ini tanimliyor ama icons ayri bir anahtar,
 * o yuzden katmandan gelen deger eziliyor degil.
 */
export const metadata: Metadata = {
  /* Yayin katmaninin VARSAYILAN basligi.
     Kok duzen "Panic CMS" diyor — panelin adi. Kendi basligini
     tanimlamayan bir yayin sayfasi (404 gibi) onu miras aliyordu ve
     sunucudan gelen HTML'de sekme "Panic CMS" yaziyordu. Kendi
     basligi olan sayfalar bunu yine eziyor. */
  title: {
    default: "Fabelo | Personal Finance, Career & AI Tools for Professionals",
    template: "%s",
  },
  /* icon/shortcut BURADA TANIMLI DEGIL: src/app/favicon.ico dosyasi var
     ve Next onu hem /favicon.ico yolunda yayinliyor hem de <link rel=
     "icon"> etiketini kendisi basiyor. Burada bir de PNG tanimlayinca
     bas kisminda iki ayri rel="icon" cikiyordu; hangisinin kazandigi
     tarayiciya kaliyordu. .ico 16'dan 256'ya alti cozunurluk tasiyor,
     PNG'ye gerek yok. Apple dokunma simgesi .ico kabul etmiyor, o
     yuzden yalnizca o PNG kaldi. */
  icons: {
    apple: "/images/fabelo-icon.png",
  },

  /* ARAMA SONUCUNDA TAM GORUNURLUK.
     Bu yonergeler yokken Google varsayilani uyguluyor:
     max-image-preview "standard", yani sonuclarda kucuk kare kupur ve
     Discover'a girme sansi neredeyse yok; max-snippet de kisa tutuluyor.
     "large" + sinirsiz kupur, yayinlarin istedigi ayar.

     -1 "sinir yok" demek, 0 degil — 0 "hic gosterme" olurdu.

     MAGAZA VE ABONELIK SAYFALARINI EZMIYOR: sayfa duzeyindeki
     `robots: { index: false }` tanimlari (store, cart, order,
     unsubscribe) katmandan geleni eziyor, tersi degil. */
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="panic_theme">
      {/* Besleme kesfi. metadata.alternates ile yazilmiyor cunku sayfalar
          kendi alternates'ini (canonical) tanimliyor ve o, katmandan
          gelen alternates'in tamamini eziyor — besleme baglantisi
          sessizce kaybolurdu. React bu etiketi head'e tasiyor. */}
      <link
        rel="alternate"
        type="application/rss+xml"
        title={SITE_ADI}
        href={`${SITE}/rss`}
      />
      {/* Umami olcumu — umami.panic.pw'deki "Fabelo.io" kaydi. O kayit
          2025 subatindan beri veri tasiyor (Ghost donemi dahil); yeni
          kayit acmak gecmisi ikiye bolerdi, o yuzden AYNI kimlik.

          BETIK ARTIK <Script> ILE DEGIL, Olcum bileseninden takiliyor.
          Iki sebep var ve ikisi de olcumu bozuyordu:

          1. ONIZLEME SAYILIYORDU. Yazi editorunun tuvali sayfayi bir
             cerceve icinde ?live=1 ile aciyor. Kosulsuz yuklenen betik
             yazarin duzenleme dakikalarini "ziyaret" olarak sayiyordu;
             en cok duzenlenen yazi en cok okunan yazi gibi gorunurdu.
             Ayni tuzaga reklam sayaclarinda bir kez dusulmustu.

          2. STAGE, CANLININ VERISINE YAZIYORDU. Kimlik koda gomulu
             oldugu icin panic.panic.pw da ayni siteye olcum
             gonderiyordu — sinama gezintileri fabelo.io'nun
             rakamlarina karisiyordu. Kimlik artik ORTAMDAN geliyor:
             stage'de bos, yani hicbir sey gondermiyor.

          GONDERME ve OKUMA kimlikleri AYRI degiskenler
          (UMAMI_TRACK_ID / UMAMI_WEBSITE_ID). Tek degisken olsaydi
          stage'i susturmak, ayni anda rapor ekranini da kor
          birakirdi: stage olcum GONDERMEMELI ama sitenin verisini
          OKUYABILMELI.

          Yayin katmanina ozel oldugu icin /panic zaten disarida. */}
      <Olcum
        kok={process.env.UMAMI_URL ?? ""}
        siteKimligi={process.env.UMAMI_TRACK_ID ?? ""}
      />
      <div className="theme-fabelo min-h-screen">{children}</div>
      <CustomCursor />
      <BackToTop />
      {/* Kunyedeki cipa baglantilari her sayfada var; isleyici de burada durmali. */}
      <AnchorPin />
      {/* Gezinme cizgisi. Once burada bir iskelet ekrani (loading.tsx)
          vardi; akis baslattigi icin sitedeki butun 404'ler 200
          donuyordu. Ayrintisi bilesenin basinda. */}
      <NavProgress />
      {/* Panelin onizleme cercevesi. Kendi kosulunu kendisi
          denetliyor: cerceve disinda ya da ?live=1 yoksa hicbir sey
          yapmadan cikiyor. */}
      <CanliOnizleme />
      <VideoOynat />
    </ThemeProvider>
  );
}

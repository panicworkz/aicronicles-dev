import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SepetSaglayici } from "@/components/store/SepetSaglayici";
import { magazaAcik, magazaGorunur } from "@/lib/magaza-durumu";

/**
 * Magaza DISARIYA KAPALI.
 *
 * Neden: /store ve /store/[slug] canliydi, dergi kunyesi her sayfadan
 * "§ SECTIONS" sutununda — Personal Finance, Career, AI & Tech'in
 * yaninda — oraya baglanti veriyordu. Icerideki bes urun ise tohumlama
 * verisiydi: 350 dolarlik bir "danismanlik", stok fotograftan bir
 * toplanti gorseli, ve buy.stripe.com/test_... diye var olmayan odeme
 * adresleri. Iki urunde "Add to Cart" hicbir sey yapmiyordu; sepet de
 * siparis de olusmuyordu.
 *
 * Yani okur gercek bir bolume girer gibi giriyor, olmayan bir dukkanla
 * karsilasiyordu. Sayfalar dergiye uygun hale gelene ve gercek odeme
 * baglanana kadar disariya kapali.
 *
 * KAPATMA BICIMI 404, 401 DEGIL. "Yetkin yok" demek sayfanin VAR
 * oldugunu soyler; arama motoru da adresi hatirlar ve tekrar dener.
 * 404 ise "boyle bir sayfa yok" der — dizinden dusmesinin dogru yolu
 * bu. Kunyedeki baglanti da kaldirildi.
 *
 * Oturum acmis editor sayfayi normal goruyor; tasarim isi canlida
 * yurusun diye.
 *
 * Duzen katmaninda duruyor cunku iki sayfayi da ayni anda kapatmasi
 * gerekiyor: birine koyup otekini unutmak mumkun olmasin.
 */

/**
 * Kapi BURADAN da tutuluyor, ama karar lib/magaza-durumu.ts'te.
 *
 * generateMetadata akistan once cozuluyor; govdedeki kontrol ise onun
 * calismadigi bir durumda kapiyi acik birakmasin diye duruyor. Ikisi
 * de ayni tek kaynagi soruyor.
 */
export async function generateMetadata(): Promise<Metadata> {
  if (!(await magazaGorunur())) notFound();
  return {
    title: "Store | Fabelo",
    /* Kapaliyken dizine girmiyor; acilinca kendiliginden kalkiyor. */
    robots: (await magazaAcik()) ? undefined : { index: false, follow: false },
  };
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await magazaGorunur())) notFound();

  return (
    <>
      {/* Editore hatirlatma: burasi yalnizca sana gorunuyor. Bu serit
          olmadan magaza acikmis gibi durur ve "neden kimse gormuyor"
          diye aranilirdi. */}
      {!(await magazaAcik()) && (
        <div
          className="px-4 py-2 text-center text-[13px] font-medium"
          style={{ background: "#78350f", color: "#fef3c7" }}
        >
          This store is closed to the public — only signed-in staff can see it.
        </div>
      )}
      {/* Serit burada DEGIL, sayfalarin icinde: buradan cizilseydi
          derginin basliginin ustunde kalirdi. Bkz. SepetSeridi. */}
      <SepetSaglayici>{children}</SepetSaglayici>
    </>
  );
}

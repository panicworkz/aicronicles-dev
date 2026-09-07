import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { jwtVerify } from "jose";

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

const COOKIE_NAME = "panic_session";

async function oturumVarMi(): Promise<boolean> {
  const gizli = process.env.JWT_SECRET;
  if (!gizli) return false;

  const jeton = (await cookies()).get(COOKIE_NAME)?.value;
  if (!jeton) return false;

  try {
    await jwtVerify(jeton, new TextEncoder().encode(gizli));
    return true;
  } catch {
    return false;
  }
}

/**
 * Kapiyi BURASI aciyor, govde degil.
 *
 * (frontend)/loading.tsx bir Suspense siniri kuruyor ve Next iskeleti
 * hemen akitmaya basliyor; akis basladiktan sonra durum kodu
 * degistirilemiyor. Govdedeki notFound() 404 sayfasini basiyordu ama
 * yanit 200 gidiyordu — arama motoru icin "bu sayfa var" demek.
 *
 * generateMetadata akistan ONCE bekleniyor, o yuzden kontrol burada.
 */
export async function generateMetadata(): Promise<Metadata> {
  if (!(await oturumVarMi())) notFound();
  /* Kapali bir dukkan indekslenmesin — oturum acmis editor gorse bile. */
  return { title: "Store | Fabelo", robots: { index: false, follow: false } };
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Govdede de duruyor: metadata bir gun once calismazsa kapi kapali kalsin.
  if (!(await oturumVarMi())) notFound();

  return (
    <>
      {/* Editore hatirlatma: burasi yalnizca sana gorunuyor. Bu serit
          olmadan magaza acikmis gibi durur ve "neden kimse gormuyor"
          diye aranilirdi. */}
      <div
        className="px-4 py-2 text-center text-[13px] font-medium"
        style={{ background: "#78350f", color: "#fef3c7" }}
      >
        This store is closed to the public — only signed-in staff can see it.
      </div>
      {children}
    </>
  );
}

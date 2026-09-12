import React from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { MagazaRaporu } from "./magaza";
import { IcerikRaporu } from "./icerik";
import { DonemSecici } from "@/components/rapor/DonemSecici";
import { donemCoz } from "@/lib/donem";

export const dynamic = "force-dynamic";

/**
 * RAPORLAR.
 *
 * IKI RAPOR, TEK EKRAN. Ayri iki menu maddesi yapmak yerine sekme:
 * ikisi de "elimizde ne var" sorusunun cevabi ve yan yana bakilmasi
 * gereken seyler — bir ay kac yazi cikti ile o ay kac siparis geldi
 * ayni ekranda anlam kazaniyor.
 *
 * Sekme adres uzerinden (?bolum=): sunucuda ciziliyor, yani ekrani
 * paylasabiliyor ve yenileyince ayni yerde kaliyorsunuz. Istemci
 * durumu olsaydi her yenileme sizi baslangica atardi.
 */

/* ICERIK ONCE. Once "Store" varsayilandi ve ekrani acan kisi dogrudan
   magaza raporuna dusuyordu; sitenin okunma rakamlari bir sekme
   arkasinda kaliyordu ve "olcum entegre degil" gibi gorunuyordu.
   Raporlar denince once sitenin kendisi bekleniyor. */
const SEKMELER = [
  { kod: "content", ad: "Content" },
  { kod: "store", ad: "Store" },
] as const;

export default async function RaporlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ bolum?: string; donem?: string }>;
}) {
  const { bolum, donem: donemKodu } = await searchParams;
  const secili = bolum === "store" ? "store" : "content";
  /* Donem SUNUCUDA cozuluyor: iki rapor da ayni araligi gormeli,
     yoksa icerik "son 30 gun" gosterirken magaza "bu yil" gosterir. */
  const donem = donemCoz(donemKodu);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Reports</h1>
            <p className="text-[11px] text-muted-foreground">
              Everything here is measured. Nothing is estimated or sampled.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DonemSecici secili={donem.kod} />
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
          {SEKMELER.map((s) => (
            <Link
              key={s.kod}
              href={`/panic/reports?bolum=${s.kod}&donem=${donem.kod}`}
              className={`rounded-md px-3.5 py-1.5 font-medium transition ${
                secili === s.kod
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.ad}
            </Link>
          ))}
          </div>
        </div>
      </div>

      {secili === "store" ? <MagazaRaporu donem={donem} /> : <IcerikRaporu donem={donem} />}
    </div>
  );
}

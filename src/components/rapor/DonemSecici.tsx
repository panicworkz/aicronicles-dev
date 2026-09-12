"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { DONEM_SECENEKLERI } from "@/lib/donem";

/**
 * DONEM SECICI.
 *
 * Adres uzerinden calisiyor (?donem=...): secim sunucuda okunuyor,
 * yani ekran paylasildiginda ya da yenilendiginde ayni aralikta
 * kaliyor. Istemci durumunda tutulsaydi her yenileme secimi sifirlar,
 * bir kutunun "son 30 gun" mu "bu yil" mi oldugunu kimse bilemezdi.
 *
 * Sekme (bolum) korunuyor: donem degistirirken Store'dayken
 * Content'e atlamak, kullanicinin istemedigi bir sey.
 */
export function DonemSecici({ secili }: { secili: string }) {
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();

  const degistir = (kod: string) => {
    const yeni = new URLSearchParams(parametreler.toString());
    yeni.set("donem", kod);
    router.push(`${yol}?${yeni.toString()}`);
  };

  const gruplar = [...new Set(DONEM_SECENEKLERI.map((d) => d.grup))];

  return (
    <label className="flex items-center gap-2 text-xs">
      <CalendarRange className="size-3.5 text-muted-foreground" />
      <span className="sr-only">Period</span>
      <select
        value={secili}
        onChange={(e) => degistir(e.target.value)}
        className="h-8 cursor-pointer rounded-lg border bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
      >
        {gruplar.map((g) => (
          <optgroup key={g} label={g}>
            {DONEM_SECENEKLERI.filter((d) => d.grup === g).map((d) => (
              <option key={d.kod} value={d.kod}>
                {d.ad}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

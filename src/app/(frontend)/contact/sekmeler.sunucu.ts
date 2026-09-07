/**
 * Sekmeleri veritabanindan okur — YALNIZCA SUNUCU.
 *
 * Ayri dosyada duruyor cunku ContactForm bir ISTEMCI bileseni ve
 * sekmeler.ts'ten tip aliyor. Okuyucu orada kalsaydi veritabani kodu
 * istemci paketine surüklenip derlemeyi kirardi — AdSlot'ta ayni sey
 * yasanmisti (bkz. AdSlot.tsx basi).
 */

import { cache } from "react";
import { SEKMELER, type Sekme } from "./sekmeler";
import { db, schema } from "@/db";
import { asc, eq } from "drizzle-orm";

/**
 * Sekmeleri veritabanindan okur; bos ya da hatali ise yedege duser.
 *
 * React'in cache'i sayesinde tek sayfa isteginde bir kez okunuyor —
 * sayfa hem metadata'da hem govdede sekmeye bakiyor.
 */
export const sekmeleriGetir = cache(async (): Promise<Sekme[]> => {
  try {
    const satirlar = await db.query.contactTabs.findMany({
      where: eq(schema.contactTabs.isActive, true),
      orderBy: [asc(schema.contactTabs.sortOrder)],
    });
    if (!satirlar.length) return SEKMELER;

    const alanlar = await db.query.contactFields.findMany({
      orderBy: [asc(schema.contactFields.sortOrder)],
    });

    return (satirlar as any[]).map((t) => ({
      anahtar: t.key,
      no: t.no,
      baslik: t.title,
      ozet: t.summary ?? "",
      sayfa: t.page ?? "",
      mesajEtiketi: t.messageLabel,
      alanlar: (alanlar as any[])
        .filter((a) => a.tabId === t.id)
        .map((a) =>
          a.type === "secim" || a.type === "select"
            ? {
                tur: "secim" as const,
                ad: a.name,
                etiket: a.label,
                zorunlu: Boolean(a.required),
                secenekler: Array.isArray(a.options) ? (a.options as string[]) : [],
              }
            : {
                tur: "metin" as const,
                ad: a.name,
                etiket: a.label,
                zorunlu: Boolean(a.required),
                ipucu: a.hint ?? undefined,
              }
        ),
    }));
  } catch (hata) {
    console.error("[contact] sekmeler okunamadi, yedege dusuldu:", hata);
    return SEKMELER;
  }
});

/** Adresteki ?type= degerini, VERILEN sekme listesinde arar. */
export function sekmeSec(sekmeler: Sekme[], deger?: string | null): Sekme {
  const b = sekmeler.find((s) => s.anahtar === (deger || "").toLowerCase());
  return b ?? sekmeler[0] ?? SEKMELER[0];
}

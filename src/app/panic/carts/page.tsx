import React from "react";
import Link from "next/link";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { ShoppingBag, Mail, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Sayi } from "@/components/rapor/parcalar";
import { SepetSil } from "@/components/store/SepetSil";

export const dynamic = "force-dynamic";

/**
 * BIRAKILMIS SEPETLER.
 *
 * "Birakilmis" bir DURUM DEGIL, bir HESAP: sepet hala acik ve son
 * hareketin uzerinden belli bir sure gecmis. Veritabanina "abandoned"
 * diye yazsaydik onu isaretleyecek zamanlanmis bir is gerekirdi; o is
 * bir gun calismayinca ekran sessizce yanlis gosterirdi. Burada her
 * acilista yeniden hesaplaniyor, yani her zaman dogru.
 *
 * KIME AIT OLDUGU COGU ZAMAN BILINMIYOR ve bu normal: e-posta ancak
 * odeme adiminda YAZILDIYSA elimizde oluyor. Sepete urun koyup cikan
 * birinin kim oldugunu bilmiyoruz — bilmeye calismak da dogru degil.
 * Ekran bu ayrimi acikca gosteriyor.
 */

const SAAT = 60 * 60 * 1000;
/* Bir saat: bundan yenisi hala aliveristе olabilir, "unuttu" demek
   erken olur. */
const TAZE_ESIGI = 1 * SAAT;

function sure(t: Date): string {
  const fark = Date.now() - new Date(t).getTime();
  const saat = Math.floor(fark / SAAT);
  if (saat < 1) return `${Math.max(1, Math.floor(fark / 60000))} min ago`;
  if (saat < 48) return `${saat} hr ago`;
  return `${Math.floor(saat / 24)} days ago`;
}

function para(tutar: unknown, birim: string): string {
  const n = Number(tutar ?? 0) || 0;
  const simge = birim === "USD" ? "$" : birim === "EUR" ? "€" : birim === "TRY" ? "₺" : "";
  return `${simge}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function SepetlerSayfasi() {
  const sepetler = await db
    .select()
    .from(schema.carts)
    .orderBy(desc(schema.carts.updatedAt))
    .limit(200);

  const acik = sepetler.filter((s) => s.status === "active");
  const simdi = Date.now();
  const birakilmis = acik.filter((s) => simdi - new Date(s.updatedAt).getTime() > TAZE_ESIGI);
  const taze = acik.filter((s) => simdi - new Date(s.updatedAt).getTime() <= TAZE_ESIGI);
  const siparise = sepetler.filter((s) => s.status === "ordered");

  const topla = (liste: typeof sepetler) =>
    liste.reduce((t, s) => t + (Number(s.subtotal) || 0), 0);

  const birim = sepetler[0]?.currency ?? "USD";
  /* Donusum orani: siparise donen / (siparise donen + birakilmis).
     Taze sepetler disarida — daha karar vermemis birini kayip
     saymak, orani oldugundan kotu gosterirdi. */
  const paydasi = siparise.length + birakilmis.length;
  const oran = paydasi ? Math.round((siparise.length / paydasi) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <ShoppingBag className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Carts</h1>
          <p className="text-[11px] text-muted-foreground">
            What people put in a basket, and what happened next.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Sayi
          etiket="Left behind"
          deger={String(birakilmis.length)}
          alt={`${para(topla(birakilmis), birim)} sitting in them`}
          vurgu
        />
        <Sayi
          etiket="Still shopping"
          deger={String(taze.length)}
          alt="Touched within the last hour"
        />
        <Sayi
          etiket="Turned into orders"
          deger={String(siparise.length)}
          alt={para(topla(siparise), birim)}
        />
        <Sayi
          etiket="Completion rate"
          deger={oran === null ? "—" : `${oran}%`}
          alt="Of decided carts — the ones still open are not counted"
        />
      </div>

      <Card className="shadow-xs">
        <CardContent className="p-0">
          {sepetler.length === 0 ? (
            <p className="py-14 text-center text-xs text-muted-foreground">
              Nothing yet. A cart is recorded the moment someone puts a product in
              one — the store has to be open for that.
            </p>
          ) : (
            <div className="divide-y">
              {sepetler.map((s) => {
                const kalemler = (Array.isArray(s.itemsJson) ? s.itemsJson : []) as any[];
                const durgun = simdi - new Date(s.updatedAt).getTime() > TAZE_ESIGI;
                const durum =
                  s.status === "ordered"
                    ? { ad: "Ordered", renk: "text-emerald-600 dark:text-emerald-400" }
                    : durgun
                      ? { ad: "Left behind", renk: "text-amber-600 dark:text-amber-400" }
                      : { ad: "Still shopping", renk: "text-sky-600 dark:text-sky-400" };

                return (
                  <div key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-semibold ${durum.renk}`}>
                          {durum.ad}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="size-3" />
                          {sure(s.updatedAt)}
                        </span>
                      </div>

                      {/* KIM: e-posta varsa kisi, yoksa acikca
                          "bilinmiyor". Bos birakmak, veri kayipmis
                          gibi okunurdu. */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="size-3.5 text-muted-foreground" />
                        {s.email ? (
                          <a
                            href={`mailto:${s.email}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {s.name ? `${s.name} · ` : ""}
                            {s.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            Not known — they never reached the checkout form
                          </span>
                        )}
                      </div>

                      <ul className="space-y-0.5 pt-0.5">
                        {kalemler.map((k, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground">
                            <span className="font-mono">{k.adet}×</span>{" "}
                            <Link
                              href={`/panic/products/${k.urunId}`}
                              className="hover:text-primary hover:underline"
                            >
                              {k.baslik}
                            </Link>{" "}
                            <span className="opacity-70">{para(k.fiyat, s.currency)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                      <span className="text-base font-bold">
                        {para(s.subtotal, s.currency)}
                      </span>
                      <SepetSil id={s.id} />
                      {s.orderId && (
                        <Link
                          href={`/panic/orders/${s.orderId}`}
                          className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                          <ExternalLink className="size-3" /> Order
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        A cart is recorded when a product goes into it, and removed when the basket
        is emptied. We store what is in it and, if the person typed their details
        at the checkout, their name and email — nothing else. Carts are not linked
        across devices, records older than 90 days are removed automatically, and
        any record can be deleted here on request.
      </p>
    </div>
  );
}

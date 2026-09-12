import React from "react";
import { db, schema } from "@/db";
import { sql, desc, eq } from "drizzle-orm";
import { Kutu, Sayi, Alan, Halka, Siralama, Bos } from "@/components/rapor/parcalar";
import { kovalar, type Donem } from "@/lib/donem";
import { umamiKurulu, umamiSayfalar } from "@/lib/umami";

/**
 * MAGAZA RAPORU.
 *
 * ODENMIS ILE BEKLEYEN AYRI DURUYOR — bu raporun en onemli karari.
 * Odeme havale ve kapida odeme ile aliniyor, yani para siparisten
 * GUNLER SONRA geliyor ve bir kismi hic gelmiyor. Butun siparisleri
 * toplayip "gelir" demek, tahsil edilmemis parayi kasada gostermek
 * olurdu. Ust satirdaki buyuk rakam yalnizca odemesi onaylanmis
 * siparisler; bekleyen ayri bir kutuda ve "henuz elimizde degil"
 * diye yaziyor.
 *
 * PARA BIRIMI: siparisler kendi para biriminde kaydediliyor. Farkli
 * birimleri toplamak icin bugunku kuru kullanmak, gecmis bir
 * siparisin degerini her gun degistirirdi. O yuzden toplamlar para
 * birimi BASINA veriliyor; tek birim varsa tek satir gorunuyor.
 */

const gun = 24 * 60 * 60 * 1000;

function paraBicim(tutar: number, birim: string): string {
  const simge = birim === "USD" ? "$" : birim === "EUR" ? "€" : birim === "TRY" ? "₺" : "";
  return `${simge}${tutar.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${simge ? "" : ` ${birim}`}`;
}

/** Odemesi tamamlanmis sayilan durumlar. */
const ODENDI = ["paid", "completed"];
/* Sepetlerin para birimi bos gelebiliyor (hic urun eslesmemisse);
   varsayilan USD. */
const birim = (b?: string | null) => b || "USD";
/** Para gelmis ve GERI VERILMIS. */
const IADE = ["refunded", "partially_refunded"];

export async function MagazaRaporu({ donem }: { donem: Donem }) {
  let siparisler = await db
    .select({
      id: schema.orders.id,
      total: schema.orders.total,
      shipping: schema.orders.shipping,
      currency: schema.orders.currency,
      paymentStatus: schema.orders.paymentStatus,
      orderStatus: schema.orders.orderStatus,
      paymentMethod: schema.orders.paymentMethod,
      customerEmail: schema.orders.customerEmail,
      createdAt: schema.orders.createdAt,
      paidAt: schema.orders.paidAt,
    })
    .from(schema.orders);

  /* DONEM SUZGECI.
     Once butun siparisler sayiliyordu ve "gelir" her zaman tum
     zamanlarin toplamiydi; ekranda hangi araliga ait oldugu
     yazmiyordu. Suzgec siparisin ODEME anina gore calisiyor —
     odenmemisse siparis anina. Parayi ne zaman aldigimiz sorusunun
     cevabi bu. */
  const iceride = (s: { paidAt: Date | null; createdAt: Date }) => {
    const t = new Date(s.paidAt ?? s.createdAt).getTime();
    return t >= donem.bas.getTime() && t <= donem.son.getTime();
  };
  const tumSiparisler = siparisler;
  siparisler = siparisler.filter(iceride);

  if (tumSiparisler.length === 0) {
    return (
      <Kutu
        baslik="No orders yet"
        aciklama="Every number on this screen comes from real orders. Nothing is simulated, so the screen stays empty until the first one arrives."
      >
        <Bos neden="The store has taken no orders. Open it in Settings when you are ready." />
      </Kutu>
    );
  }

  /* Siparis var ama BU ARALIKTA yok: bos ekran gostermek yerine
     sebebini soyluyoruz, yoksa "rapor bozuk" diye okunuyor. */
  if (siparisler.length === 0) {
    return (
      <Kutu
        baslik={`No orders in this period`}
        aciklama={`The store has ${tumSiparisler.length} order${
          tumSiparisler.length === 1 ? "" : "s"
        } in total, but none fall inside ${donem.ad.toLowerCase()}.`}
      >
        <Bos neden="Pick a longer period from the selector above." />
      </Kutu>
    );
  }

  const sayi = (x: unknown) => Number(x ?? 0) || 0;
  const odenmis = siparisler.filter((s) => ODENDI.includes(s.paymentStatus));
  /* IADE AYRI DURUYOR.
     Once "odenmis olmayan her sey" bekleyen sayiliyordu ve iade
     edilmis siparisler de o kutuya dusuyordu — yani geri verdigimiz
     para "tahsil edilecek" gorunuyordu. Demo siparislerde iki iade
     vardi ve bekleyen tutar 3.628 dolar cikti; gercek bekleyen
     1.013 dolardi. Uc ayri sey: gelen, gelecek, geri verilen. */
  const iadeler = siparisler.filter((s) => IADE.includes(s.paymentStatus));
  const bekleyen = siparisler.filter(
    (s) => !ODENDI.includes(s.paymentStatus) && !IADE.includes(s.paymentStatus)
  );

  /* Para birimi basina toplam — farkli birimler toplanmiyor. */
  const birimBasina = (liste: typeof siparisler) => {
    const t = new Map<string, { tutar: number; adet: number }>();
    for (const s of liste) {
      const b = s.currency || "USD";
      const o = t.get(b) ?? { tutar: 0, adet: 0 };
      o.tutar += sayi(s.total);
      o.adet += 1;
      t.set(b, o);
    }
    return [...t.entries()].sort((a, b) => b[1].tutar - a[1].tutar);
  };

  const gelir = birimBasina(odenmis);
  const bekleyenGelir = birimBasina(bekleyen);
  const iadeTutari = birimBasina(iadeler);

  /* Ortalama sepet — yalnizca odenmis ve en cok kullanilan birimde. */
  const anaBirim = gelir[0]?.[0] ?? siparisler[0].currency ?? "USD";
  const anaGelir = gelir.find(([b]) => b === anaBirim)?.[1];
  const ortalama = anaGelir && anaGelir.adet ? anaGelir.tutar / anaGelir.adet : 0;

  /* Son 12 hafta — hafta hafta odenmis gelir.
     ODEME TARIHINE gore, siparis tarihine gore DEGIL. Havale ve
     kapida odemede para gunler sonra geliyor; siparis tarihine
     yazsaydik para daha elimize gecmeden gecmis bir haftada
     gorunurdu. Odeme tarihi bilinmeyen eski kayitlar siparis
     tarihine dusuyor — bilmedigimiz bir tarihi uydurmuyoruz, ama
     kaydi da gorunmez yapmiyoruz. */
  const odemeAni = (s: { paidAt: Date | null; createdAt: Date }) =>
    new Date(s.paidAt ?? s.createdAt).getTime();

  const kovaListesi = kovalar(donem);
  const haftalar = kovaListesi.map((k) => {
    const icinde = odenmis.filter((s) => {
      const t = odemeAni(s);
      return t >= k.bas && t < k.son;
    });
    const tutar = icinde
      .filter((s) => (s.currency || "USD") === anaBirim)
      .reduce((x, s) => x + sayi(s.total), 0);
    return {
      etiket: k.etiket,
      deger: tutar,
      ipucu: `${paraBicim(tutar, anaBirim)} · ${icinde.length} order${icinde.length === 1 ? "" : "s"}`,
    };
  });

  /* Haftalik siparis ADEDI — gelirden ayri: az sayida buyuk siparis
     ile cok sayida kucuk siparis ayni ciroyu verir ve ikisi ayni sey
     degildir. */
  const haftalikAdet = kovaListesi.map(
    (k) =>
      siparisler.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return t >= k.bas && t < k.son;
      }).length
  );

  /* Durumlar */
  const grupla = (liste: typeof siparisler, alan: "orderStatus" | "paymentStatus" | "paymentMethod") => {
    const t = new Map<string, number>();
    for (const s of liste) {
      const k = String(s[alan] ?? "unknown");
      t.set(k, (t.get(k) ?? 0) + 1);
    }
    return [...t.entries()]
      .map(([etiket, deger]) => ({ etiket: etiket.replace(/_/g, " "), deger }))
      .sort((a, b) => b.deger - a.deger);
  };

  /* En cok satan urunler — satir kalemlerinden, adet ve ciro. */
  const kalemler = await db
    .select({
      baslik: schema.orderItems.title,
      urunId: schema.orderItems.productId,
      adet: sql<number>`sum(${schema.orderItems.quantity})`,
      ciro: sql<number>`sum(${schema.orderItems.totalPrice})`,
    })
    .from(schema.orderItems)
    .groupBy(schema.orderItems.title, schema.orderItems.productId)
    .orderBy(desc(sql`sum(${schema.orderItems.totalPrice})`))
    .limit(8);

  /* Musteriler: ilk kez mi aliyor, yine mi geldi. */
  const epostalar = new Map<string, number>();
  for (const s of siparisler) {
    epostalar.set(s.customerEmail, (epostalar.get(s.customerEmail) ?? 0) + 1);
  }
  const tekrarEden = [...epostalar.values()].filter((n) => n > 1).length;

  /* --- SEPETLER ---
     Siparise donmeyen alisveris de bir olcu: kac sepet acildi, kaci
     birakildi, birakilanlarda ne kadar para duruyor. Bunlar siparis
     tablosunda GORUNMEYEN seyler; sepet golgesi olmasa hic
     bilinmezdi. */
  const sepetler = await db
    .select({
      id: schema.carts.id,
      durum: schema.carts.status,
      tutar: schema.carts.subtotal,
      birim: schema.carts.currency,
      eposta: schema.carts.email,
      guncel: schema.carts.updatedAt,
      kalemler: schema.carts.itemsJson,
    })
    .from(schema.carts);

  const saat = 60 * 60 * 1000;
  const sepetIcinde = sepetler.filter((s) => {
    const t = new Date(s.guncel).getTime();
    return t >= donem.bas.getTime() && t <= donem.son.getTime();
  });
  const acikSepet = sepetIcinde.filter((s) => s.durum === "active");
  const birakilan = acikSepet.filter((s) => Date.now() - new Date(s.guncel).getTime() > saat);
  const sepettenSiparis = sepetIcinde.filter((s) => s.durum === "ordered");
  const birakilanTutar = birakilan.reduce((t, s) => t + (Number(s.tutar) || 0), 0);
  const sepetPaydasi = sepettenSiparis.length + birakilan.length;
  const donusum = sepetPaydasi
    ? Math.round((sepettenSiparis.length / sepetPaydasi) * 100)
    : null;

  /* Hangi urun sepete cok giriyor ama siparise donmuyor — en pahali
     soru bu: ilgi var, satis yok. */
  const sepetUrun = new Map<string, { sepet: number; birakilan: number; id?: number }>();
  for (const s of sepetIcinde) {
    const kalemler = (Array.isArray(s.kalemler) ? s.kalemler : []) as any[];
    const bosVerildi = s.durum === "active" && Date.now() - new Date(s.guncel).getTime() > saat;
    for (const k of kalemler) {
      const kayit = sepetUrun.get(k.baslik) ?? { sepet: 0, birakilan: 0, id: k.urunId };
      kayit.sepet += Number(k.adet) || 1;
      if (bosVerildi) kayit.birakilan += Number(k.adet) || 1;
      sepetUrun.set(k.baslik, kayit);
    }
  }

  /* --- URUN SAYFASI ZIYARETLERI ---
     Umami'den geliyor: /store/<slug> yollari. Siparis sayisiyla yan
     yana konunca "kac kisi baktı, kaci aldi" sorusu cevaplanabiliyor.
     Olcum bagli degilse kutu hic cizilmiyor — bos bir kutu
     gostermektense hic gostermemek. */
  const olcumVar = umamiKurulu();
  const sayfaOlcumu = olcumVar ? await umamiSayfalar(donem, 40) : null;
  const urunZiyareti = (sayfaOlcumu ?? [])
    .filter((x) => x.yol.startsWith("/store/"))
    .map((x) => {
      const slug = x.yol.replace(/^\/store\//, "").replace(/\/$/, "").split(/[?#]/)[0];
      return { slug, deger: x.deger };
    })
    .filter((x) => x.slug && x.slug !== "cart");

  /* Stogu biten ya da azalan urunler — rapor degil is emri. */
  const urunler = await db
    .select({
      id: schema.products.id,
      baslik: schema.products.title,
      stok: schema.products.inventory,
      sinirsiz: schema.products.unlimitedStock,
      tur: schema.products.productType,
      durum: schema.products.status,
    })
    .from(schema.products)
    .where(eq(schema.products.status, "published"));

  /* Sinirsiz stoklu urunler DISARIDA: onlarin "3 kaldi" diye bir
     durumu yok ve listede gorunmeleri yanlis bir aciliyet uretirdi. */
  const stokSorunu = urunler
    .filter(
      (u) =>
        u.tur === "physical" &&
        !u.sinirsiz &&
        typeof u.stok === "number" &&
        u.stok <= 3
    )
    .sort((a, b) => (a.stok ?? 0) - (b.stok ?? 0));

  return (
    <div className="space-y-5">
      {/* --- ust satir --- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Sayi
          kivilcim={haftalar}
          kivilcimBicim={(n) => paraBicim(n, anaBirim)}
          etiket={`Money received · ${donem.ad.toLowerCase()}`}
          deger={gelir.length ? paraBicim(gelir[0][1].tutar, gelir[0][0]) : "—"}
          alt={
            gelir.length > 1
              ? gelir.slice(1).map(([b, o]) => paraBicim(o.tutar, b)).join(" · ")
              : "Payment confirmed"
          }
          vurgu
        />
        <Sayi
          etiket="Awaiting payment"
          deger={bekleyenGelir.length ? paraBicim(bekleyenGelir[0][1].tutar, bekleyenGelir[0][0]) : "—"}
          alt={`${bekleyen.length} order${bekleyen.length === 1 ? "" : "s"} — not in hand yet`}
        />
        <Sayi
          etiket="Refunded"
          deger={iadeTutari.length ? paraBicim(iadeTutari[0][1].tutar, iadeTutari[0][0]) : "—"}
          alt={`${iadeler.length} order${iadeler.length === 1 ? "" : "s"} — money given back`}
        />
        <Sayi
          etiket="Average order"
          deger={ortalama ? paraBicim(ortalama, anaBirim) : "—"}
          alt={`Paid orders only · ${siparisler.length} orders in total`}
        />
      </div>

      <Kutu
        baslik="Money received over time"
        aciklama={`${donem.ad}, ${anaBirim}, counted on the day the payment was confirmed — not the day the order was placed. Bank transfer and cash on delivery land days apart from the order.${
          odenmis.some((s) => !s.paidAt)
            ? " Orders recorded before this was tracked fall back to their order date."
            : ""
        }`}
      >
        <Alan veri={haftalar} bicim={(n) => paraBicim(n, anaBirim)} />
      </Kutu>

      <div className="grid gap-5 lg:grid-cols-2">
        <Kutu baslik="Best sellers" aciklama="By revenue across every order.">
          <Siralama
            veri={kalemler.map((k) => ({
              etiket: k.baslik,
              deger: Number(k.ciro ?? 0),
              alt: `×${Number(k.adet ?? 0)}`,
              adres: k.urunId ? `/panic/products/${k.urunId}` : undefined,
            }))}
            bicim={(n) => paraBicim(n, anaBirim)}
          />
        </Kutu>

        <Kutu baslik="Where orders stand" aciklama="Fulfilment status, not payment.">
          <Halka veri={grupla(siparisler, "orderStatus")} toplamEtiketi="orders" />
        </Kutu>

        <Kutu baslik="How people pay" aciklama="No card payments are taken on this site.">
          <Halka veri={grupla(siparisler, "paymentMethod")} toplamEtiketi="orders" />
        </Kutu>

        <Kutu
          baslik="Customers"
          aciklama="Counted by e-mail address, because the store takes orders without an account."
        >
          <div className="grid grid-cols-2 gap-4">
            <Sayi etiket="People who ordered" deger={String(epostalar.size)} />
            <Sayi
              etiket="Ordered more than once"
              deger={String(tekrarEden)}
              alt={
                epostalar.size
                  ? `${Math.round((tekrarEden / epostalar.size) * 100)}% came back`
                  : undefined
              }
            />
          </div>
        </Kutu>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Kutu
          baslik="Payment status"
          aciklama="Bank transfer and cash on delivery are confirmed by hand, so money lands after the order."
        >
          <Halka veri={grupla(siparisler, "paymentStatus")} toplamEtiketi="orders" />
        </Kutu>

        <Kutu
          baslik="Orders over time"
          aciklama="Every order, whether or not the payment has landed."
        >
          <Alan
            veri={haftalar.map((h, i) => ({
              etiket: h.etiket,
              deger: haftalikAdet[i],
              ipucu: `${h.etiket}: ${haftalikAdet[i]} order${haftalikAdet[i] === 1 ? "" : "s"}`,
            }))}
          />
        </Kutu>
      </div>

      {/* --- SEPET --- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Sayi
          etiket="Baskets left behind"
          deger={String(birakilan.length)}
          alt={`${paraBicim(birakilanTutar, birim(birakilan[0]?.birim))} sitting in them`}
        />
        <Sayi
          etiket="Baskets that became orders"
          deger={String(sepettenSiparis.length)}
          alt={donusum === null ? "Nothing decided yet" : `${donusum}% of decided baskets`}
        />
        <Sayi
          etiket="Baskets with a name on them"
          deger={String(birakilan.filter((s) => s.eposta).length)}
          alt="They reached the checkout form — you can follow up"
        />
        <Sayi
          etiket="Still shopping"
          deger={String(acikSepet.length - birakilan.length)}
          alt="Touched within the last hour"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Kutu
          baslik="Wanted but not bought"
          aciklama="Products sitting in baskets that were left behind. Interest without a sale — usually the most useful thing on this screen."
        >
          {sepetUrun.size ? (
            <Siralama
              veri={[...sepetUrun.entries()]
                .filter(([, v]) => v.birakilan > 0)
                .sort((a, b) => b[1].birakilan - a[1].birakilan)
                .slice(0, 8)
                .map(([ad, v]) => ({
                  etiket: ad,
                  deger: v.birakilan,
                  alt: `of ${v.sepet} in baskets`,
                  adres: v.id ? `/panic/products/${v.id}` : undefined,
                }))}
              bicim={(n) => `${n} left behind`}
            />
          ) : (
            <Bos neden="No basket has been left behind in this period." />
          )}
        </Kutu>

        <Kutu
          baslik="Product pages people looked at"
          aciklama={
            olcumVar
              ? "Real page views from Umami. Compare with the sales above: a lot of looking and little buying points at the price, the photos or the description."
              : "Needs the analytics connection — see the Content tab."
          }
        >
          {urunZiyareti.length ? (
            <Siralama
              veri={urunZiyareti.slice(0, 8).map((x) => ({
                etiket: x.slug,
                deger: x.deger,
              }))}
              bicim={(n) => `${n} views`}
            />
          ) : (
            <Bos
              neden={
                olcumVar
                  ? "No product page was opened in this period."
                  : "Analytics is not connected, so there is nothing to show."
              }
            />
          )}
        </Kutu>
      </div>

      <Kutu
        baslik="Stock running out"
        aciklama="Published physical products with three or fewer left. Digital products are not counted — they do not run out."
      >
        {stokSorunu.length ? (
          <Siralama
            veri={stokSorunu.map((u) => ({
              etiket: u.baslik,
              deger: u.stok ?? 0,
              adres: `/panic/products/${u.id}`,
            }))}
            bicim={(n) => (n <= 0 ? "out of stock" : `${n} left`)}
          />
        ) : (
          <Bos neden="Nothing is running low." />
        )}
      </Kutu>
    </div>
  );
}

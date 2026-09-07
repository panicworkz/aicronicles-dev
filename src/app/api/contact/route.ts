import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Iletisim formu.
 *
 * NEDEN VAR
 * Sitede hicbir yerde e-posta adresi YAZMAMALI. Bes CMS sayfasi
 * (about, advertise, sponsor, terms, data-and-privacy) "support@..."
 * diye mailto baglantisi tasiyordu; adres sayfada duz metin olarak
 * durunca toplayici botlarin isine yariyor ve okurun posta programini
 * acmaya zorluyordu. Butun iletisim buradan geciyor.
 *
 * SIRA ONEMLI: once VERITABANI, sonra gateway.
 * Mesaj basta yalnizca gateway'e gidiyordu; SMTP dusse siteni
 * tarafinda hic iz birakmadan kayboluyor ve panelde "bunu cevapladim"
 * diyebilecegin bir yer bulunmuyordu. Artik asil kayit contact_messages
 * tablosunda, gateway'e iletimin sonucu da o kayda isleniyor —
 * bulten aboneligindeki kalibin ayni (bkz. api/subscribe).
 *
 * Gateway yine merkezi olan: abonelik de oraya gidiyor ve oteki siteler
 * (turcopartners, aicall, panicworkz) iletisim formlarini yillardir
 * oradan isliyor. Teslimati, otomatik yaniti ve kendi kaydini o yapiyor.
 */

const GATEWAY =
  process.env.GATEWAY_URL || "http://host.docker.internal:8787/ingest/fabelo";

const EPOSTA = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Gateway'in tanidigi tuzak alanlar — insan bunlari doldurmaz. */
const TUZAK_ALANLAR = ["website_url", "company_website", "hp_field", "_hp", "honeypot"];

/* Hiz siniri: IP basina saatte 5 mesaj. Abonelikteki ile ayni sekil;
   surec bellekte tutuyor, yeniden baslatinca sifirlaniyor — kucuk bir
   site icin yeterli, kalici bir depo kurmanin bedeline degmez. */
const PENCERE = 60 * 60 * 1000;
const SINIR = 5;
const gecmis = new Map<string, number[]>();

function hizSiniri(ip: string): boolean {
  const simdi = Date.now();
  const liste = (gecmis.get(ip) ?? []).filter((t) => simdi - t < PENCERE);
  if (liste.length >= SINIR) return true;
  liste.push(simdi);
  gecmis.set(ip, liste);
  return false;
}

export async function POST(request: NextRequest) {
  const govde = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Tuzak dolduysa basarili gorunup sessizce birakiyoruz: bot bir sey
  // ogrenmesin, gercek kullanici da hata gormesin.
  for (const alan of TUZAK_ALANLAR) {
    if (typeof govde[alan] === "string" && (govde[alan] as string).trim()) {
      return NextResponse.json({ success: true });
    }
  }

  const ad = String(govde.name ?? "").trim().slice(0, 120);
  const eposta = String(govde.email ?? "").trim().toLowerCase().slice(0, 200);
  const mesaj = String(govde.message ?? "").trim().slice(0, 5000);
  const kurum = String(govde.organization ?? "").trim().slice(0, 160);
  const telefon = String(govde.phone ?? "").trim().slice(0, 40);
  const sekmeEtiketi = String(govde.topic_label ?? "").trim().slice(0, 80);
  const sekme = String(govde.topic ?? "").trim().slice(0, 40);

  /* Sekmeye ozel alanlar. Gateway'in tablosu sabit bir alan listesi
     bekliyor (field_rows), bizim sekmelerimiz ise sayfaya gore
     degisiyor — o yuzden onlari mesaja BASLIKLARIYLA yaziyoruz.
     Boylece gateway'e dokunmadan her sekme okunur bir e-posta
     uretiyor. */
  const ekler =
    govde.fields && typeof govde.fields === "object"
      ? Object.entries(govde.fields as Record<string, unknown>)
          .map(([k, v]) => [String(k).slice(0, 80), String(v).trim().slice(0, 500)] as const)
          .filter(([, v]) => v)
      : [];

  const konu = sekmeEtiketi
    ? `${sekmeEtiketi} — fabelo.io`
    : String(govde.subject ?? "").trim().slice(0, 200);

  if (!ad || !eposta || !mesaj) {
    return NextResponse.json(
      { success: false, error: "Name, email and message are required." },
      { status: 400 }
    );
  }
  if (!EPOSTA.test(eposta)) {
    return NextResponse.json(
      { success: false, error: "That email address does not look right." },
      { status: 400 }
    );
  }
  if (mesaj.length < 10) {
    return NextResponse.json(
      { success: false, error: "Please write a little more so we can help." },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";
  if (hizSiniri(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many messages from this address. Try again later." },
      { status: 429 }
    );
  }

  const tarayici = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  /* 1) ASIL KAYIT. Bu basarisiz olursa mesaji aldik diyemeyiz. */
  let kayitId: number | null = null;
  try {
    const [satir] = await db
      .insert(schema.contactMessages)
      .values({
        topic: sekme || "general",
        topicLabel: sekmeEtiketi || null,
        name: ad,
        email: eposta,
        organization: kurum || null,
        phone: telefon || null,
        subject: konu || null,
        message: mesaj,
        fields: ekler.length ? Object.fromEntries(ekler) : null,
        sourceUrl: String(govde.source_url ?? `${SITE}/contact`).slice(0, 300),
        ip,
        userAgent: tarayici,
      } as any)
      .returning({ id: schema.contactMessages.id });
    kayitId = satir?.id ?? null;
  } catch (hata) {
    console.error("[contact] veritabanina yazilamadi:", hata);
    return NextResponse.json(
      { success: false, error: "We could not send that just now. Please try again shortly." },
      { status: 500 }
    );
  }

  /* 2) Gateway'e ilet. Buradan sonrasi mesajin KAYDINI etkilemiyor:
     iletim basarisiz olsa da mesaj elimizde, panelde gorunuyor ve
     durumu 'failed' olarak isaretleniyor. Ziyaretciye hata gostermiyoruz
     cunku bizim acimizdan islem tamamlandi. */
  const kontrol = new AbortController();
  const zamanAsimi = setTimeout(() => kontrol.abort(), 20000);
  let iletim: "sent" | "failed" = "failed";
  try {
    const cevap = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ad,
        email: eposta,
        subject: konu || "Message from fabelo.io",
        message:
          ekler.length
            ? `${ekler.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${mesaj}`
            : mesaj,
        form_name: `Fabelo — Contact${sekmeEtiketi ? ` (${sekmeEtiketi})` : ""}`,
        source_url: String(govde.source_url ?? `${SITE}/contact`).slice(0, 300),
        // Gateway bunlari kendi tablosunda gosteriyor (field_rows).
        ...(kurum ? { company: kurum } : {}),
        ...(telefon ? { phone: telefon } : {}),
        ...(sekme ? { project_type: sekmeEtiketi || sekme } : {}),
        lang: "en",
      }),
      signal: kontrol.signal,
    });
    if (cevap.ok) iletim = "sent";
    else console.error("[contact] gateway yaniti:", cevap.status);
  } catch (hata) {
    console.error("[contact] gateway'e iletilemedi:", hata);
  } finally {
    clearTimeout(zamanAsimi);
  }

  /* Iletim sonucu kayda islensin — panelde "gitti mi" gorunsun. */
  if (kayitId !== null) {
    try {
      await db
        .update(schema.contactMessages)
        .set({ gatewayStatus: iletim, updatedAt: new Date() } as any)
        .where(eq(schema.contactMessages.id, kayitId));
    } catch {
      /* Sayac tutulamazsa mesaj yine de kayitli. */
    }
  }

  return NextResponse.json({ success: true });
}

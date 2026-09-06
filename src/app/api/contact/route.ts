import { NextRequest, NextResponse } from "next/server";
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
 * Mesaj panic-workz'un merkezi gateway'ine gidiyor — abonelik de ayni
 * yere gidiyor ve oteki siteler (turcopartners, aicall, panicworkz)
 * iletisim formlarini yillardir oradan isliyor. Yeni bir posta yolu
 * kurmaya gerek yok; gateway teslimati, otomatik yaniti ve kaydi
 * kendisi yapiyor.
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
  const konu = String(govde.subject ?? "").trim().slice(0, 200);
  const mesaj = String(govde.message ?? "").trim().slice(0, 5000);

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

  const kontrol = new AbortController();
  const zamanAsimi = setTimeout(() => kontrol.abort(), 20000);
  try {
    const cevap = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ad,
        email: eposta,
        subject: konu || "Message from fabelo.io",
        message: mesaj,
        form_name: "Fabelo — Contact",
        source_url: String(govde.source_url ?? `${SITE}/contact`).slice(0, 300),
        lang: "en",
      }),
      signal: kontrol.signal,
    });
    if (!cevap.ok) throw new Error(`gateway ${cevap.status}`);
    return NextResponse.json({ success: true });
  } catch (hata) {
    console.error("[contact] gateway'e iletilemedi:", hata);
    return NextResponse.json(
      { success: false, error: "We could not send that just now. Please try again shortly." },
      { status: 502 }
    );
  } finally {
    clearTimeout(zamanAsimi);
  }
}

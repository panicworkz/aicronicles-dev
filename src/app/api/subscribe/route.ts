import { NextRequest, NextResponse, after } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Bulten abonelik ucu.
 *
 * Iki yere birden yaziyor:
 *   1. subscribers tablosu — asil kayit burasi
 *   2. contact-gateway — bildirim e-postasi ve merkezi kayit
 *
 * Sira onemli: once veritabani. Gateway erisilemezse abonelik yine de
 * kayitli kalir ve gateway durumu 'failed' olarak isaretlenir; ziyaretciye
 * hata gostermeyiz, cunku bizim acimizdan islem basarili olmustur.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EPOSTA = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Formun icine gizlenmis, insanlarin doldurmadigi alanlar */
const TUZAK_ALANLAR = ["website_url", "company_website", "_hp", "honeypot"];

const GATEWAY =
  process.env.GATEWAY_URL || "http://host.docker.internal:8787/ingest/fabelo";

/** Cikis baglantisinin tam adresi icin — alan adi degisince buradan gecilir */
const SITE = process.env.SITE_URL || "https://fabelo.testworkz.com";

/* --- Hiz siniri: IP basina saatte 5 abonelik ---------------------------- */
const PENCERE = 60 * 60 * 1000;
const SINIR = 5;
const gecmis = new Map<string, number[]>();

function hizliMi(ip: string): boolean {
  const simdi = Date.now();
  const kayitlar = (gecmis.get(ip) ?? []).filter((t) => simdi - t < PENCERE);
  if (kayitlar.length >= SINIR) return true;
  kayitlar.push(simdi);
  gecmis.set(ip, kayitlar);

  // Sonsuza kadar buyumesin
  if (gecmis.size > 5000) {
    for (const [anahtar, liste] of gecmis) {
      if (!liste.some((t) => simdi - t < PENCERE)) gecmis.delete(anahtar);
    }
  }
  return false;
}

/** Gateway'e ilet — gateway ad ve mesaj bekliyor, ikisini de biz uretiyoruz */
async function gatewayeIlet(eposta: string, kaynak: string, kaynakUrl: string, jeton: string) {
  const kontrol = new AbortController();
  const zamanAsimi = setTimeout(() => kontrol.abort(), 20000);
  try {
    const cevap = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Fabelo Dispatch",
        email: eposta,
        subject: "Newsletter subscription",
        message:
          `New subscriber for The Dispatch.\n\n` +
          `Email: ${eposta}\nForm: ${kaynak}\n\n` +
          `Unsubscribe link for this address:\n${SITE}/unsubscribe?t=${jeton}`,
        form_name: `Fabelo — The Dispatch (${kaynak})`,
        source_url: kaynakUrl,
        lang: "en",
      }),
      signal: kontrol.signal,
    });
    if (!cevap.ok) return "failed";
    const veri = (await cevap.json().catch(() => null)) as { delivery?: string } | null;
    return veri?.delivery === "sent" ? "sent" : "queued";
  } catch {
    return "failed";
  } finally {
    clearTimeout(zamanAsimi);
  }
}

export async function POST(req: NextRequest) {
  let govde: Record<string, unknown>;
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Tuzak alan doluysa bot demektir: basarili gibi cevapla, hicbir sey yazma.
  if (TUZAK_ALANLAR.some((alan) => String(govde[alan] ?? "").trim())) {
    return NextResponse.json({ ok: true });
  }

  const eposta = String(govde.email ?? "").trim().toLowerCase();
  if (!EPOSTA.test(eposta) || eposta.length > 254) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const kaynak = ["footer", "dispatch", "article"].includes(String(govde.source))
    ? String(govde.source)
    : "unknown";

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "bilinmiyor";

  if (hizliMi(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const tarayici = (req.headers.get("user-agent") ?? "").slice(0, 300);
  const kaynakUrl = req.headers.get("referer") ?? "https://fabelo.io/";

  /* 1) Asil kayit — ayni adres tekrar abone olursa kaydi tazeliyoruz,
        daha once cikmissa yeniden etkinlestiriyoruz. */
  let jeton = "";
  try {
    const sonuc = (await db.execute(sql`
      INSERT INTO subscribers (email, source, ip, user_agent, status, unsubscribe_token)
      VALUES (${eposta}, ${kaynak}, ${ip}, ${tarayici}, 'active',
              encode(gen_random_bytes(24), 'hex'))
      ON CONFLICT (email) DO UPDATE SET
        status = 'active',
        source = COALESCE(subscribers.source, EXCLUDED.source),
        updated_at = now(),
        unsubscribed_at = NULL
      RETURNING unsubscribe_token
    `)) as unknown as { rows?: { unsubscribe_token: string }[] };

    jeton =
      (Array.isArray(sonuc) ? (sonuc[0] as any) : sonuc.rows?.[0])?.unsubscribe_token ?? "";
  } catch (hata) {
    console.error("[subscribe] veritabanina yazilamadi:", hata);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  /* 2) Gateway'e ilet — yanittan SONRA.
     Gateway e-postayi es zamanli gonderiyor ve SMTP birkac saniye
     surebiliyor; ziyaretciyi bunun icin bekletmiyoruz. Abonelik zaten
     yukarida kayda gecti, iletim durumu arkadan isleniyor. */
  after(async () => {
    const durum = await gatewayeIlet(eposta, kaynak, kaynakUrl, jeton);
    try {
      await db.execute(
        sql`UPDATE subscribers SET gateway_status = ${durum} WHERE email = ${eposta}`
      );
    } catch {
      // Durum notu tutulamadiysa abonelige zarari yok
    }
  });

  return NextResponse.json({ ok: true });
}

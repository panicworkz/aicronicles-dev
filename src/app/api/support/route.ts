import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HUBZ_INTAKE_URL =
  process.env.HUBZ_WEBSITE_INTAKE_URL || "https://hubz.panic.pw/api/internal/website-intake";
const EPOSTA = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TUZAK_ALANLAR = ["website_url", "company_website", "hp_field", "_hp", "honeypot"];

const PENCERE = 60 * 60 * 1000;
const SINIR = 5;
const gecmis = new Map<string, number[]>();

function metin(deger: unknown, max = 4000) {
  return typeof deger === "string" ? deger.trim().slice(0, max) : "";
}

function secim(deger: string, izinli: string[], varsayilan: string) {
  return izinli.includes(deger) ? deger : varsayilan;
}

function imza(govde: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(govde, "utf8").digest("hex")}`;
}

function hizSiniri(ip: string): boolean {
  const simdi = Date.now();
  const liste = (gecmis.get(ip) ?? []).filter((t) => simdi - t < PENCERE);
  if (liste.length >= SINIR) return true;
  liste.push(simdi);
  gecmis.set(ip, liste);
  return false;
}

export async function POST(request: NextRequest) {
  const secret = process.env.WEBSITE_INTAKE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { success: false, error: "Support gateway is not configured." },
      { status: 503 }
    );
  }

  const govde = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  for (const alan of TUZAK_ALANLAR) {
    if (typeof govde[alan] === "string" && (govde[alan] as string).trim()) {
      return NextResponse.json({ success: true });
    }
  }

  const ad = metin(govde.name, 120);
  const eposta = metin(govde.email, 200).toLowerCase();
  const kurum = metin(govde.organization, 160);
  const telefon = metin(govde.phone, 40);
  const konu = metin(govde.subject, 200);
  const mesaj = metin(govde.message, 5000);
  const kategori = secim(metin(govde.category, 40), ["general", "project", "technical", "maintenance", "billing"], "general");
  const oncelik = secim(metin(govde.priority, 20), ["low", "medium", "high", "urgent"], "medium");

  if (!ad || !eposta || !konu || !mesaj) {
    return NextResponse.json(
      { success: false, error: "Name, email, subject and message are required." },
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
      { success: false, error: "Too many support requests from this address. Try again later." },
      { status: 429 }
    );
  }

  const simdi = new Date().toISOString();
  const kaynak = String(govde.source_url ?? `${SITE}/support`).slice(0, 300);
  const payload = {
    external_id: `panicworkz:support:${randomUUID()}`,
    event_type: "website_support",
    site_slug: "panicworkz",
    website: "panicworkz.com",
    source_url: kaynak.startsWith("https://panicworkz.com") ? kaynak : "https://panicworkz.com/support",
    occurred_at: simdi,
    submitted_at: simdi,
    payload: {
      name: ad,
      email: eposta,
      company: kurum,
      phone: telefon,
      subject: konu,
      message: mesaj,
      category: kategori,
      priority: oncelik,
      page: "support",
    },
  };

  const ham = JSON.stringify(payload);
  const kontrol = new AbortController();
  const zamanAsimi = setTimeout(() => kontrol.abort(), 20000);

  try {
    const cevap = await fetch(HUBZ_INTAKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-panicworkz-signature": imza(ham, secret),
      },
      body: ham,
      signal: kontrol.signal,
    });
    if (!cevap.ok && cevap.status !== 409) {
      const hata = (await cevap.json().catch(() => ({}))) as { error?: string };
      throw new Error(hata.error || "Support request could not be delivered.");
    }
  } catch (hata) {
    console.error("[support] Hubz intake failed:", hata);
    return NextResponse.json(
      { success: false, error: "We could not open that support request just now. Please try again shortly." },
      { status: 502 }
    );
  } finally {
    clearTimeout(zamanAsimi);
  }

  return NextResponse.json({ success: true });
}

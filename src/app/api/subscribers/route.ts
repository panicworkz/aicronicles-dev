import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Abone yonetimi — /panic/subscribers ekraninin veri ucu.
 *
 * Halka acik abonelik ucu ayri (/api/subscribe). Burasi oturum gerektiriyor;
 * middleware zaten /api/* icin dogruluyor, bu yuzden ek kontrol yok.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Sayfada gosterilecek kayit sayisi ust siniri */
const SAYFA = 100;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const arama = (p.get("q") ?? "").trim().toLowerCase();
  const kaynak = p.get("source") ?? "";
  const durum = p.get("status") ?? "";
  const disaAktar = p.get("export") === "csv";
  const sayfa = Math.max(1, Number(p.get("page") ?? 1) || 1);

  const kosullar = [sql`true`];
  if (arama) kosullar.push(sql`email LIKE ${"%" + arama + "%"}`);
  if (kaynak) kosullar.push(sql`source = ${kaynak}`);
  if (durum) kosullar.push(sql`status = ${durum}`);
  const nerede = sql.join(kosullar, sql` AND `);

  // CSV: sayfalama yok, eslesen her sey
  const limit = disaAktar ? 100000 : SAYFA;
  const atla = disaAktar ? 0 : (sayfa - 1) * SAYFA;

  const satirlar = (await db.execute(sql`
    SELECT id, email, source, status, gateway_status, ip, created_at, unsubscribed_at
    FROM subscribers
    WHERE ${nerede}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${atla}
  `)) as unknown as { rows?: any[] };

  const kayitlar = Array.isArray(satirlar) ? satirlar : (satirlar.rows ?? []);

  if (disaAktar) {
    const alanlar = ["email", "source", "status", "gateway_status", "created_at"];
    const kacir = (d: unknown) => {
      const s = d == null ? "" : String(d);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      alanlar.join(","),
      ...kayitlar.map((r: any) => alanlar.map((a) => kacir(r[a])).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fabelo-subscribers-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  }

  const ozet = (await db.execute(sql`
    SELECT
      count(*)::int                                             AS toplam,
      count(*) FILTER (WHERE status = 'active')::int            AS aktif,
      count(*) FILTER (WHERE status = 'unsubscribed')::int      AS cikan,
      count(*) FILTER (WHERE gateway_status = 'failed')::int    AS iletilemeyen,
      count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS bu_hafta
    FROM subscribers
  `)) as unknown as { rows?: any[] };

  const eslesen = (await db.execute(sql`
    SELECT count(*)::int AS n FROM subscribers WHERE ${nerede}
  `)) as unknown as { rows?: any[] };

  const ilk = (x: any) => (Array.isArray(x) ? x[0] : x.rows?.[0]) ?? {};

  return NextResponse.json({
    subscribers: kayitlar,
    stats: ilk(ozet),
    matched: ilk(eslesen).n ?? 0,
    page: sayfa,
    perPage: SAYFA,
  });
}

/** Aboneligi sonlandir veya geri al */
export async function PUT(req: NextRequest) {
  const { id, status } = (await req.json().catch(() => ({}))) as {
    id?: number;
    status?: string;
  };
  if (!id || !["active", "unsubscribed"].includes(String(status))) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  await db.execute(sql`
    UPDATE subscribers
       SET status = ${status},
           unsubscribed_at = ${status === "unsubscribed" ? sql`now()` : sql`NULL`},
           updated_at = now()
     WHERE id = ${id}
  `);
  return NextResponse.json({ ok: true });
}

/** Kaydi tamamen sil — silme talebi gelen aboneler icin */
export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  await db.execute(sql`DELETE FROM subscribers WHERE id = ${id}`);
  return NextResponse.json({ ok: true });
}

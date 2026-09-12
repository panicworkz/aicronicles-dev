import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { handleApiError, apiUnauthorized } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * BIR SEPET KAYDINI SILER.
 *
 * NEDEN GEREKLI: sepet kaydi kisisel veri tasiyabiliyor — odeme
 * formuna yazilmis ad ve e-posta. Birisi "kaydimi silin" derse bunun
 * bir yolu olmali; doksan gunluk saklama suresinin dolmasini beklemek
 * bir cevap degil. Panelde her sepetin yaninda bir dugme duruyor.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiUnauthorized();

    const { id } = await params;
    await db.delete(schema.carts).where(eq(schema.carts.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err, "DELETE /api/cart/[id]");
  }
}

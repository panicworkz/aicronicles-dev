import { NextResponse } from 'next/server';
import { alaniDoldur } from '@/lib/ads';

export const dynamic = 'force-dynamic';

/**
 * Bir alana reklam secer.
 *
 * NEDEN AYRI BIR UC
 * Reklam once sunucuda seciliyor ve afisin SVG'si sayfaya GOMULUYORDU.
 * Iki bedeli vardi:
 *
 *   1. Sayfa agirdi. Ana sayfanin HTML'i 1,09 MB, bunun 425 KB'i
 *      (yuzde 39) reklam SVG'siydi. Ayni afis her istekte yeniden
 *      gonderiliyordu, cunku HTML'in bir parcasiydi.
 *   2. Sayfayi onbellege almak reklami de dondururdu — bir yuvaya
 *      ikinci kampanya girdigi gun onbellek penceresindeki herkes ayni
 *      reklami gorurdu.
 *
 * Simdi HTML yalnizca bos cerceveyi tasiyor ve secim burada, her
 * ziyaretci icin ayri yapiliyor. Afisin kendisi statik bir dosya:
 * kenarda uzun sureli onbellekleniyor, yani ikinci kez indirilmiyor.
 * Buyuk yayincilarin yaptigi da bu — sayfa onbellekte, reklam ayri.
 *
 * Yanit ASLA onbelleklenmemeli; onbelleklenirse secim yine donar ve
 * butun bu degisiklik anlamsizlasir.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get('placement');
  if (!placement) {
    return NextResponse.json({ error: 'placement gerekli' }, { status: 400 });
  }

  const tur = searchParams.get('tur');
  const slug = searchParams.get('slug');
  const baglam = tur ? { tur, slug: slug || null } : undefined;

  const reklam = await alaniDoldur(placement, baglam);

  return NextResponse.json(
    reklam
      ? {
          id: reklam.id,
          imageUrl: reklam.imageUrl,
          alt: reklam.alt,
          targetUrl: reklam.targetUrl,
        }
      : null,
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

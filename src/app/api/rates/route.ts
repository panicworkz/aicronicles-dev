import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let cachedRates: any = null;
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();
  // Return cached rates if fetched within last 10 minutes
  if (cachedRates && now - lastFetchTime < 10 * 60 * 1000) {
    return NextResponse.json(cachedRates);
  }

  try {
    const res = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml,text/xml,*/*',
      },
    });

    if (!res.ok) {
      throw new Error(`TCMB response status: ${res.status}`);
    }

    const xml = await res.text();

    // Parse USD
    const usdMatch = xml.match(/<Currency[^>]*Kod="USD"[^>]*>([\s\S]*?)<\/Currency>/i);
    const usdSelling = usdMatch ? parseFloat(usdMatch[1].match(/<ForexSelling>([0-9.]+)<\/ForexSelling>/i)?.[1] || '0') : 0;
    const usdBuying = usdMatch ? parseFloat(usdMatch[1].match(/<ForexBuying>([0-9.]+)<\/ForexBuying>/i)?.[1] || '0') : 0;

    // Parse EUR
    const eurMatch = xml.match(/<Currency[^>]*Kod="EUR"[^>]*>([\s\S]*?)<\/Currency>/i);
    const eurSelling = eurMatch ? parseFloat(eurMatch[1].match(/<ForexSelling>([0-9.]+)<\/ForexSelling>/i)?.[1] || '0') : 0;
    const eurBuying = eurMatch ? parseFloat(eurMatch[1].match(/<ForexBuying>([0-9.]+)<\/ForexBuying>/i)?.[1] || '0') : 0;
    const eurCrossOther = eurMatch ? parseFloat(eurMatch[1].match(/<CrossRateOther>([0-9.]+)<\/CrossRateOther>/i)?.[1] || '0') : 0;

    // Date
    const dateMatch = xml.match(/Tarih="([0-9.]+)"/i)?.[1] || new Date().toLocaleDateString('tr-TR');

    const eurUsdRate = eurCrossOther || (usdSelling > 0 ? parseFloat((eurSelling / usdSelling).toFixed(4)) : 1.09);

    if (!usdSelling || !eurSelling) {
      throw new Error('TCMB yanitinda USD/EUR satis kuru yok');
    }

    cachedRates = {
      success: true,
      stale: false,
      source: 'TCMB',
      date: dateMatch,
      usd: {
        selling: usdSelling,
        buying: usdBuying,
        display: `₺${usdSelling.toFixed(2)}`,
      },
      eur: {
        selling: eurSelling,
        buying: eurBuying,
        display: `₺${eurSelling.toFixed(2)}`,
      },
      eurUsd: {
        rate: eurUsdRate,
        display: `$${eurUsdRate.toFixed(2)}`,
      },
      updatedAt: new Date().toISOString(),
    };
    lastFetchTime = now;

    return NextResponse.json(cachedRates);
  } catch (err: any) {
    console.error('Error fetching TCMB rates:', err);

    // Elde son basarili kur varsa onu "eski" isaretiyle dondur.
    if (cachedRates) {
      return NextResponse.json({ ...cachedRates, stale: true });
    }

    // Hic kur alinamadiysa uydurma deger dondurulmez.
    return NextResponse.json(
      { success: false, stale: true, error: 'TCMB kuru alinamadi' },
      { status: 503 },
    );
  }
}

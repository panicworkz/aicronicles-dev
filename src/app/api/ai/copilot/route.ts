import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper: Strip HTML tags and clean whitespace
function cleanText(htmlOrText: string): string {
  if (!htmlOrText) return '';
  return htmlOrText
    .replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, '')
    .replace(/<style[^>]*>([\S\s]*?)<\/style>/gim, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Extract complete sentences from body
function getCompleteSentences(text: string): string[] {
  if (!text) return [];
  // Split on sentence boundaries
  const raw = text.match(/[^.!?]+[.!?]+/g) || [text];
  return raw
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && !s.startsWith('#') && !s.startsWith('-'));
}

// Optional Gemini LLM caller if GEMINI_API_KEY is configured
async function callGeminiIfAvailable(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { action, title, description, contentHtml, text, filename, slug, excerpt } = await request.json();

    const rawText = cleanText(contentHtml || description || excerpt || text || '');
    const cleanTitle = (title || filename || '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[|\-_]+$/, '')
      .trim();

    const s = (slug || cleanTitle).toLowerCase();
    const isTurkish = /[çğıöşü]/i.test(`${cleanTitle} ${rawText} ${s}`);

    // =========================================================================
    // 1. ARTICLE & PAGE SEO / SERP META GENERATOR
    // =========================================================================
    if (action === 'generateSeoMeta') {
      // 1. Check if Gemini LLM can produce high-quality result
      if (process.env.GEMINI_API_KEY) {
        const geminiPrompt = `You are a professional web editor. Write a natural, highly relevant SEO Meta Title (max 60 chars) and Meta Description (120-155 chars) for this page. Do not use generic filler words. Write in ${isTurkish ? 'Turkish' : 'English'}.
Title: "${cleanTitle}"
Slug: "${slug || ''}"
Content: "${rawText.substring(0, 700)}"

Return JSON ONLY: {"metaTitle": "...", "metaDescription": "..."}`;

        const llmResult = await callGeminiIfAvailable(geminiPrompt);
        if (llmResult) {
          try {
            const parsed = JSON.parse(llmResult.replace(/```json/g, '').replace(/```/g, '').trim());
            if (parsed.metaTitle && parsed.metaDescription) {
              return NextResponse.json({
                success: true,
                metaTitle: parsed.metaTitle.substring(0, 60),
                metaDescription: parsed.metaDescription.substring(0, 160),
              });
            }
          } catch (e) {
            // fallback to contextual generator
          }
        }
      }

      // 2. Specialized Meta Rules for Standard Corporate / Legal Pages
      if (/about|hakkimizda|hakkinda/i.test(s) || /about|hakkımızda/i.test(cleanTitle)) {
        return NextResponse.json({
          success: true,
          metaTitle: isTurkish ? 'Hakkımızda | Fabelo' : 'About Us | Fabelo',
          metaDescription: isTurkish
            ? 'Fabelo editoryal vizyonu, teknoloji yayıncılığı yaklaşımımız, yazar kadromuz ve kurumsal ilkelerimiz.'
            : "Discover Fabelo's editorial mission, our story, technology insights, and the team behind our publications.",
        });
      }

      if (/privacy|gizlilik|kvkk|data/i.test(s) || /privacy|gizlilik/i.test(cleanTitle)) {
        return NextResponse.json({
          success: true,
          metaTitle: isTurkish ? 'Gizlilik Politikası & KVKK | Fabelo' : 'Data & Privacy Policy | Fabelo',
          metaDescription: isTurkish
            ? 'Fabelo kullanıcı gizliliği, veri güvenliği standartları, çerez politikası ve KVKK kapsamındaki haklarınız.'
            : 'Learn how Fabelo collects, protects, and manages your personal data and privacy rights.',
        });
      }

      if (/terms|sartlar|kosullar|agreement/i.test(s) || /terms|kullanım şartları/i.test(cleanTitle)) {
        return NextResponse.json({
          success: true,
          metaTitle: isTurkish ? 'Kullanım Şartları & Sözleşme | Fabelo' : 'Terms & Conditions | Fabelo',
          metaDescription: isTurkish
            ? 'Fabelo platformu kullanım kuralları, kullanıcı sorumlulukları ve yasal sözleşme şartları.'
            : 'Review the official terms of service, user agreements, and legal guidelines for using Fabelo.',
        });
      }

      if (/sponsor|advertise|reklam|is-birligi/i.test(s) || /sponsor|advertise|reklam/i.test(cleanTitle)) {
        return NextResponse.json({
          success: true,
          metaTitle: isTurkish ? 'Sponsorluk & Reklam | Fabelo' : 'Sponsor & Advertise | Fabelo',
          metaDescription: isTurkish
            ? 'Fabelo ile sponsorluk ve reklam çözümleri, kitle etkileşimi ve markanıza özel iş birliği modelleri.'
            : 'Explore sponsorship packages, advertising opportunities, and audience reach with Fabelo.',
        });
      }

      // 3. Dynamic Editorial Articles & Custom Pages
      let metaTitle = cleanTitle;
      if (!metaTitle.toLowerCase().includes('fabelo')) {
        if (metaTitle.length <= 48) {
          metaTitle = `${metaTitle} | Fabelo`;
        }
      }
      if (metaTitle.length > 60) {
        metaTitle = cleanTitle.length <= 60 ? cleanTitle : cleanTitle.substring(0, 57).trim() + '...';
      }

      // Extract real text from editor content
      let metaDescription = '';
      const sentences = getCompleteSentences(rawText);

      if (sentences.length > 0) {
        // Take the first 1-2 actual sentences written by the author
        let combined = sentences[0].replace(/[.]+$/, '');
        if (combined.length < 110 && sentences.length > 1) {
          const second = sentences[1].replace(/[.]+$/, '');
          if ((combined + '. ' + second).length <= 155) {
            combined = `${combined}. ${second}`;
          }
        }

        if (combined.length >= 90 && combined.length <= 155) {
          metaDescription = `${combined}.`;
        } else if (combined.length > 155) {
          metaDescription = combined.substring(0, 152).trim() + '...';
        } else {
          metaDescription = `${combined}.`;
        }
      }

      // Natural, context-specific fallback if editor is empty
      if (!metaDescription || metaDescription.length < 50) {
        if (isTurkish) {
          metaDescription = `${cleanTitle} rehberi: Temel kavramlar, pratik uygulama adımları ve dikkat edilmesi gereken noktalar.`;
        } else {
          metaDescription = `Comprehensive guide on ${cleanTitle}: core concepts, actionable insights, and practical best practices.`;
        }
      }

      return NextResponse.json({ success: true, metaTitle, metaDescription });
    }

    // =========================================================================
    // 2. MEDIA ASSET SEO & AEO SYNTHESIZER
    // =========================================================================
    if (action === 'generateMediaSeo') {
      const cleanFileName = (filename || cleanTitle || 'image')
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_0-9]+/g, ' ')
        .trim();

      const words = cleanFileName
        .split(' ')
        .filter((w) => w.length > 0)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const autoTitle = words || 'Visual Asset';
      const autoAlt = words || 'Editorial image';
      const autoCaption = isTurkish ? `${words} görseli.` : `${words} visual reference.`;
      const autoAeo = isTurkish
        ? `${words} konusunu açıklayan görsel materyal.`
        : `Visual asset demonstrating ${words}.`;

      return NextResponse.json({
        success: true,
        title: autoTitle,
        alt: autoAlt,
        caption: autoCaption,
        aeoContext: autoAeo,
      });
    }

    // =========================================================================
    // 3. PRODUCT SEO SYNTHESIZER
    // =========================================================================
    if (action === 'generateProductSeo') {
      const pTitle = cleanTitle || 'Product';
      let metaTitle = `${pTitle} | Fabelo Store`;
      if (metaTitle.length > 60) metaTitle = pTitle.substring(0, 57) + '...';

      let metaDescription = '';
      const sentences = getCompleteSentences(rawText);
      if (sentences.length > 0 && sentences[0].length <= 155) {
        metaDescription = sentences[0];
      } else {
        metaDescription = isTurkish
          ? `${pTitle} ürün detayları, özellikleri ve Fabelo Store güvencesiyle sipariş seçenekleri.`
          : `Shop ${pTitle} with verified quality, detailed specifications, and secure checkout at Fabelo Store.`;
      }

      return NextResponse.json({ success: true, metaTitle, metaDescription });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

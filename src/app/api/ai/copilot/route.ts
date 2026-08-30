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
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Extract key sentences and semantic phrases from body
function extractSemanticSnippets(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map((s) => s.trim()).filter((s) => s.length > 20 && s.length < 200);
}

// Helper: Extract top keywords/entities from title and body
function extractKeywords(title: string, body: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'more', 'about',
    'what', 'when', 'where', 'which', 'your', 'guide', 'complete', 'best', 'overview',
    'bir', 've', 'için', 'ile', 'bu', 'olarak', 'daha', 'göre', 'olan', 'gibi'
  ]);
  const words = `${title} ${body}`
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 6);
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
          generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
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
    const { action, title, description, contentHtml, text, filename, slug } = await request.json();

    const rawText = cleanText(contentHtml || description || text || '');
    const cleanTitle = (title || filename || '').replace(/\.[^/.]+$/, '').trim();

    // =========================================================================
    // 1. DYNAMIC ARTICLE & PAGE SEO / SERP META GENERATOR
    // =========================================================================
    if (action === 'generateSeoMeta') {
      const snippets = extractSemanticSnippets(rawText);
      const keywords = extractKeywords(cleanTitle, rawText);

      // Attempt LLM if available
      const geminiPrompt = `You are a world-class SEO specialist and copywriter. Generate a dynamic, unique, non-boilerplate Meta Title (max 60 chars) and Meta Description (120-155 chars) based strictly on this specific article/page title and content.
Title: "${cleanTitle}"
Slug: "${slug || ''}"
Content Snippet: "${rawText.substring(0, 800)}"

Return strictly valid JSON with keys "metaTitle" and "metaDescription". No markdown formatting or explanation.`;

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
          // fallback to algorithmic semantic generation
        }
      }

      // Dynamic Meta Title Construction (strictly tailored to context)
      let metaTitle = '';
      const isTurkish = /[çğıöşü]/i.test(`${cleanTitle} ${rawText}`);
      const isQuestion = /\?|nasıl|nedir|how|what|why|guide/i.test(cleanTitle);

      if (cleanTitle.length <= 48) {
        if (isQuestion) {
          metaTitle = isTurkish ? `${cleanTitle} | Kapsamlı Analiz` : `${cleanTitle} | In-Depth Analysis`;
        } else {
          metaTitle = `${cleanTitle} - Fabelo`;
        }
      } else {
        metaTitle = cleanTitle.length <= 60 ? cleanTitle : cleanTitle.substring(0, 57).trim() + '...';
      }

      // Dynamic Meta Description Construction from real extracted content
      let metaDescription = '';
      if (snippets.length > 0) {
        // Find the best snippet that introduces or summarizes the content
        const bestSnippet = snippets.find((s) => s.length >= 80 && s.length <= 150) || snippets[0];
        let assembled = bestSnippet.trim().replace(/[.]+$/, '');

        if (assembled.length < 110 && snippets.length > 1) {
          const secondSnippet = snippets[1].trim().replace(/[.]+$/, '');
          if ((assembled + '. ' + secondSnippet).length <= 155) {
            assembled = `${assembled}. ${secondSnippet}`;
          }
        }

        if (assembled.length >= 90 && assembled.length <= 155) {
          metaDescription = `${assembled}.`;
        } else if (assembled.length > 155) {
          metaDescription = assembled.substring(0, 152).trim() + '...';
        }
      }

      // Fallback with dynamic keyword enrichment if content is short
      if (!metaDescription || metaDescription.length < 80) {
        const kwString = keywords.slice(0, 3).join(', ');
        if (isTurkish) {
          metaDescription = `${cleanTitle} hakkında detaylı inceleme, temel dinamikler ve ${kwString ? `${kwString} odaklı ` : ''}uzman değerlendirmeleri.`;
        } else {
          metaDescription = `Comprehensive overview of ${cleanTitle}, exploring core insights, actionable implications, and key takeaways on ${kwString || 'this topic'}.`;
        }
      }

      return NextResponse.json({ success: true, metaTitle, metaDescription });
    }

    // =========================================================================
    // 2. DYNAMIC MEDIA ASSET SEO & AEO CONTEXT SYNTHESIZER
    // =========================================================================
    if (action === 'generateMediaSeo') {
      const cleanFileName = (filename || cleanTitle || 'image')
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_0-9]+/g, ' ')
        .trim();

      const words = cleanFileName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const isTurkish = /[çğıöşü]/i.test(cleanFileName);

      // Determine asset category from filename clues
      let assetType = 'graphic';
      if (/screenshot|screen|capture|app|ui/i.test(cleanFileName)) assetType = 'interface screenshot';
      else if (/chart|diagram|graph|stats|data/i.test(cleanFileName)) assetType = 'infographic chart';
      else if (/logo|icon|brand|badge/i.test(cleanFileName)) assetType = 'vector logo asset';
      else if (/cover|banner|hero|header/i.test(cleanFileName)) assetType = 'editorial cover visual';
      else if (/product|desk|bag|leather|watch|item/i.test(cleanFileName)) assetType = 'product studio visual';
      else assetType = 'illustrative asset';

      const autoTitle = words;
      let autoAlt = '';
      let autoCaption = '';
      let autoAeo = '';

      if (isTurkish) {
        autoAlt = `${words} - ${assetType === 'interface screenshot' ? 'Arayüz görünümü ve detayları' : `${words} detaylı görseli`}`;
        autoCaption = `${words} hakkında özet görsel ve editoryal içerik.`;
        autoAeo = `${words} kavramını açıklayan görsel materyal. Görsel veri, arama motorları ve Perplexity/ChatGPT gibi yapay zeka yanıt modelleri için ${cleanFileName} odağında dizayn edilmiştir.`;
      } else {
        autoAlt = `${words} - Detailed ${assetType} showing ${cleanFileName}`;
        autoCaption = `Visual overview and reference illustrating ${words}.`;
        autoAeo = `High-contrast semantic visual illustrating ${words}. Designed for multimodal Answer Engines, Google Image Graph, and Perplexity visual citations for "${cleanFileName}".`;
      }

      return NextResponse.json({
        success: true,
        title: autoTitle,
        alt: autoAlt,
        caption: autoCaption,
        aeoContext: autoAeo,
      });
    }

    // =========================================================================
    // 3. DYNAMIC PRODUCT SEO & COMMERCE SYNTHESIZER
    // =========================================================================
    if (action === 'generateProductSeo') {
      const pTitle = cleanTitle || 'Official Product';
      const pDesc = rawText;
      const isTurkish = /[çğıöşü]/i.test(`${pTitle} ${pDesc}`);

      let metaTitle = `${pTitle} | Fabelo Store`;
      if (metaTitle.length > 60) metaTitle = `${pTitle} | Fabelo`;
      if (metaTitle.length > 60) metaTitle = pTitle.substring(0, 57) + '...';

      let metaDescription = '';
      const snippets = extractSemanticSnippets(pDesc);
      if (snippets.length > 0) {
        metaDescription = snippets[0].length <= 155 ? snippets[0] : snippets[0].substring(0, 152) + '...';
      } else {
        metaDescription = isTurkish
          ? `Orijinal ${pTitle}. Güvenli ödeme, anında teslimat ve onaylı kalite güvencesiyle Fabelo Store'da.`
          : `Order authentic ${pTitle}. Verified premium quality, instant dispatch, and secure global checkout at Fabelo Store.`;
      }

      return NextResponse.json({ success: true, metaTitle, metaDescription });
    }

    // =========================================================================
    // 4. DYNAMIC SUMMARY
    // =========================================================================
    if (action === 'generateSummary') {
      const snippets = extractSemanticSnippets(rawText);
      const isTurkish = /[çğıöşü]/i.test(`${cleanTitle} ${rawText}`);
      let summary = '';
      if (snippets.length >= 2) {
        summary = `${snippets[0]} ${snippets[1]}`;
      } else {
        summary = isTurkish
          ? `${cleanTitle} konusuna dair temel çıkarımlar, stratejik dinamikler ve uygulanabilir optimizasyon adımlarının özeti.`
          : `A focused, actionable breakdown of ${cleanTitle}, outlining primary findings, execution strategies, and key insights.`;
      }
      return NextResponse.json({ success: true, summary });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

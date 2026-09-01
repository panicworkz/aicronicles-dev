import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkRateLimit, recordAttempt } from '@/lib/rate-limiter';
import { handleApiError, apiUnauthorized, apiTooManyRequests } from '@/lib/api-response';

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
          generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiUnauthorized('Admin authentication required for AI Copilot.');
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const clientIp = cfIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1');

    const rateLimitKey = `copilot:${clientIp}`;
    const check = checkRateLimit(rateLimitKey, 30, 60 * 1000); // 30 req / min
    if (!check.success) {
      return apiTooManyRequests('Copilot request rate limit exceeded. Please wait a moment.', check.resetInMs);
    }
    recordAttempt(rateLimitKey);

    const body = await request.json();
    const {
      action,
      title,
      description,
      contentHtml,
      text,
      filename,
      slug,
      excerpt,
      articleTitle,
      articleContent,
      currentAlt,
      currentTitle,
    } = body;

    const rawText = cleanText(articleContent || contentHtml || description || excerpt || text || '');
    const cleanTitle = (articleTitle || title || filename || '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[|\-_]+$/, '')
      .trim();

    const s = (slug || cleanTitle).toLowerCase();
    const isTurkish = /[çğıöşü]/i.test(`${cleanTitle} ${rawText} ${s}`);

    // =========================================================================
    // 1. ARTICLE & PAGE SEO / SERP META GENERATOR
    // =========================================================================
    if (action === 'generateSeoMeta') {
      if (process.env.GEMINI_API_KEY) {
        const geminiPrompt = `You are a senior digital editor. Write a natural, highly relevant SEO Meta Title (max 60 chars) and Meta Description (120-155 chars) for this page. Write in ${isTurkish ? 'Turkish' : 'English'}.
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
            // fallback
          }
        }
      }

      // Specialized Meta Rules for Standard Corporate / Legal Pages
      if (/about|hakkimizda|hakkinda/i.test(s) || /about|hakkımızda/i.test(cleanTitle)) {
        return NextResponse.json({
          success: true,
          metaTitle: isTurkish ? 'Hakkımızda | Fabelo' : 'About Us | Fabelo',
          metaDescription: isTurkish
            ? 'Fabelo hakkında bilgi edinin: Vizyonumuz, yayın ilkelerimiz ve teknoloji odaklı içerik ekibimiz.'
            : 'Learn about Fabelo, our editorial mission, values, and our commitment to independent technology research.',
        });
      }

      if (/privacy|gizlilik/i.test(s) || /privacy|gizlilik/i.test(cleanTitle)) {
        return NextResponse.json({
          success: true,
          metaTitle: isTurkish ? 'Gizlilik Politikası | Fabelo' : 'Privacy Policy | Fabelo',
          metaDescription: isTurkish
            ? 'Fabelo gizlilik politikası: Kişisel verilerinizin nasıl korunduğu ve işlendiği hakkında detaylı bilgi.'
            : 'Read the Fabelo Privacy Policy to learn how we collect, protect, and process your personal data securely.',
        });
      }

      if (/terms|kullanim|şartlar/i.test(s) || /terms|şartlar/i.test(cleanTitle)) {
        return NextResponse.json({
          success: true,
          metaTitle: isTurkish ? 'Kullanım Koşulları | Fabelo' : 'Terms of Service | Fabelo',
          metaDescription: isTurkish
            ? 'Fabelo web sitesi ve hizmetlerinin kullanım şartları, kuralları ve yasal bildirimler.'
            : 'Review the Fabelo terms of service and conditions governing your use of our website and services.',
        });
      }

      if (/contact|iletisim|iletişim/i.test(s) || /contact|iletişim/i.test(cleanTitle)) {
        return NextResponse.json({
          success: true,
          metaTitle: isTurkish ? 'İletişim | Fabelo' : 'Contact Us | Fabelo',
          metaDescription: isTurkish
            ? 'Fabelo ekibi ile iletişime geçin. Görüş, öneri ve iş birliği talepleriniz için bize ulaşın.'
            : 'Get in touch with the Fabelo team for editorial inquiries, feedback, and partnership opportunities.',
        });
      }

      // Default smart extraction from actual text
      let metaTitle = `${cleanTitle} | Fabelo`;
      if (metaTitle.length > 60) {
        metaTitle = cleanTitle.length <= 58 ? cleanTitle : cleanTitle.substring(0, 55) + '...';
      }

      let metaDescription = '';
      const sentences = getCompleteSentences(rawText);

      if (sentences.length > 0) {
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
      const topicTitle = (articleTitle || title || '').replace(/[|\-_]+$/, '').trim();
      const filenameRaw = (filename || '').split('/').pop() || '';
      
      // Clean filename from numeric IDs and random hashes (e.g. pexels-photo-4050315 -> pexels photo)
      const cleanFileName = filenameRaw
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_0-9]+/g, ' ')
        .trim();

      // Check if filename contains actual semantic words rather than generic IDs
      const hasMeaningfulFilename = cleanFileName.length > 3 && !/^(pexels|unsplash|fabelo card|image|photo|img|asset)/i.test(cleanFileName);

      // If Gemini is available, generate context-aware Alt & SEO Caption
      if (process.env.GEMINI_API_KEY) {
        const geminiPrompt = `You are a professional web editor & SEO specialist. Generate high-quality, realistic, and specific image metadata.
Article Topic: "${topicTitle}"
Image Name/URL: "${filenameRaw}"
Context: "${rawText.substring(0, 500)}"

Do NOT use generic cliché filler (like "an editorial image", "visual demonstration", "görsel açıklaması").
Write specific, natural English metadata describing what the image represents in the context of the article.

Return JSON ONLY:
{
  "alt": "Specific, descriptive Alt text describing the subject and workflow",
  "title": "Clean, concise 3-5 word image title",
  "caption": "Helpful editorial caption providing meaningful context to the reader",
  "aeoContext": "Key conceptual insight for AI search engines (Perplexity, SearchGPT)"
}`;

        const llmResult = await callGeminiIfAvailable(geminiPrompt);
        if (llmResult) {
          try {
            const parsed = JSON.parse(llmResult.replace(/```json/g, '').replace(/```/g, '').trim());
            if (parsed.alt) {
              return NextResponse.json({
                success: true,
                title: parsed.title,
                alt: parsed.alt,
                caption: parsed.caption || '',
                aeoContext: parsed.aeoContext || '',
              });
            }
          } catch (e) {
            // fallback to contextual synthesis
          }
        }
      }

      // Contextual High-Quality NLP Synthesis
      const topicLower = topicTitle.toLowerCase();
      let subjectDesc = 'modern workstation and digital workspace';
      
      if (/productivity|boost|efficient|time|task/i.test(topicLower)) {
        subjectDesc = 'modern laptop workspace setup with notebook and coffee for digital productivity';
      } else if (/career|job|interview|work|resume/i.test(topicLower)) {
        subjectDesc = 'professional desktop workspace representing career development and remote work';
      } else if (/finance|budget|money|saving|invest|wealth|credit/i.test(topicLower)) {
        subjectDesc = 'financial planning workspace with digital charts, calculator, and analytical reports';
      } else if (/freelance|developer|code|tech|software/i.test(topicLower)) {
        subjectDesc = 'developer programming desk setup with code on screen and workspace accessories';
      } else if (/chart|data|graph/i.test(filenameRaw)) {
        subjectDesc = `comparative data breakdown and benchmark analysis for ${topicTitle}`;
      } else if (hasMeaningfulFilename) {
        subjectDesc = `${cleanFileName} setup`;
      }

      const autoAlt = currentAlt && currentAlt.length > 10 && !/^(image|photo|illustration)/i.test(currentAlt)
        ? currentAlt
        : `${subjectDesc.charAt(0).toUpperCase() + subjectDesc.slice(1)} related to ${topicTitle || 'the guide'}`;

      const autoTitle = topicTitle
        ? `${topicTitle.split(':')[0]} - Workspace Setup`
        : 'Digital Productivity & Tools Setup';

      const autoCaption = `Optimizing digital workflows and daily focus with modern tools in ${topicTitle || 'daily practice'}.`;

      const autoAeo = `Visual context illustrating workflow execution and operational best practices for ${topicTitle || 'the topic'}.`;

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
  } catch (err: unknown) {
    return handleApiError(err, 'POST /api/ai/copilot');
  }
}

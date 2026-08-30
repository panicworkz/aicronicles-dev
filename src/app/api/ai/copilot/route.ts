import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { action, title, contentHtml, text } = await request.json();

    const plainText = (contentHtml || text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (action === 'generateFaq') {
      const topic = title || 'General Guide';
      const faqs = [
        {
          question: `What is the primary benefit of ${topic}?`,
          answer: `The primary benefit is maximizing efficiency, authority, and measurable outcome based on modern industry standards and proven workflows.`,
        },
        {
          question: `Who should follow the recommendations in ${topic}?`,
          answer: `Professionals, content creators, and decision makers looking to optimize their workflow and achieve repeatable high-performance results.`,
        },
        {
          question: `How quickly can I see results after implementing this?`,
          answer: `Most users see immediate structural improvements right away, with compounding long-term gains within 2 to 4 weeks.`,
        },
        {
          question: `Is technical expertise required to get started?`,
          answer: `No extensive technical background is required; following the step-by-step instructions provided in the guide is sufficient.`,
        },
      ];

      const faqHtml = `
<div class="panic-faq-block my-8 p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-4">
  <h3 class="text-xl font-bold text-white mb-4">Frequently Asked Questions</h3>
  ${faqs
    .map(
      (f) => `
  <div class="border-b border-neutral-800 pb-3 last:border-0">
    <h4 class="text-sm font-semibold text-amber-400 mb-1.5">${f.question}</h4>
    <p class="text-xs text-neutral-300 leading-relaxed">${f.answer}</p>
  </div>`
    )
    .join('')}
</div>`;

      return NextResponse.json({ success: true, faqs, faqHtml });
    }

    if (action === 'generateSummary') {
      const summary = `A comprehensive, actionable breakdown covering core strategies, proven execution steps, and key optimization tips for ${title || 'this topic'}. Designed for high-impact decision making and fast implementation.`;
      return NextResponse.json({ success: true, summary });
    }

    if (action === 'generateSeoMeta') {
      const metaTitle = `${title} | Complete 2026 Guide & Action Plan`;
      const metaDescription = `Discover the ultimate guide on ${title}. Step-by-step strategies, expert insights, and actionable best practices to achieve measurable success.`;
      return NextResponse.json({ success: true, metaTitle, metaDescription });
    }

    if (action === 'generateProsCons') {
      const prosConsHtml = `
<div class="panic-pros-cons-block my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div class="p-5 rounded-xl border border-emerald-900/40 bg-emerald-950/20 space-y-2">
    <h4 class="text-sm font-bold text-emerald-400 flex items-center gap-1.5">✓ Key Advantages</h4>
    <ul class="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
      <li>Fast execution and zero operational friction</li>
      <li>High return on investment and scalable output</li>
      <li>Complies with latest 2026 search and AI standards</li>
    </ul>
  </div>
  <div class="p-5 rounded-xl border border-red-900/40 bg-red-950/20 space-y-2">
    <h4 class="text-sm font-bold text-red-400 flex items-center gap-1.5">✗ Considerations</h4>
    <ul class="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
      <li>Requires consistent initial setup and diligence</li>
      <li>Best results achieved with ongoing monitoring</li>
    </ul>
  </div>
</div>`;
      return NextResponse.json({ success: true, html: prosConsHtml });
    }

    if (action === 'generateCta') {
      const ctaHtml = `
<div class="panic-cta-block my-8 p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-950/20 text-center space-y-3">
  <span class="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Featured Resource</span>
  <h3 class="text-xl font-bold text-white">Ready to Master ${title || 'This Strategy'}?</h3>
  <p class="text-xs text-neutral-300 max-w-md mx-auto">Get instant access to our curated checklists, templates, and actionable automation blueprints.</p>
  <div>
    <a href="/panic/products" class="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition shadow-lg">
      Get Instant Access →
    </a>
  </div>
</div>`;
      return NextResponse.json({ success: true, html: ctaHtml });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

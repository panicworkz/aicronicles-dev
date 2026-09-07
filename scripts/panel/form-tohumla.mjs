/**
 * Iletisim formunun sekmelerini kodda duran tanimdan veritabanina tasir.
 *
 * Tablolar bostken bir kez calistirilir. Kaynak, formun O ANA KADAR
 * calisan hali: sekmeler.ts icindeki tanim buraya elle kopyalanmadi,
 * ayni degerler yazildi ve karsilastirildi (bkz. asagidaki DOGRULAMA).
 *
 * Tekrar calistirmak guvenli: var olan sekme key'e gore guncellenir,
 * alanlari yeniden yazilir.
 *
 * Kullanim (konteynerde):
 *   docker exec panic-cms node /app/form-tohumla.mjs
 */
import pg from 'pg';

const SEKMELER = [
  {
    key: 'general',
    no: '01',
    title: 'General & corrections',
    summary:
      'Questions about a story, a correction to something we published, or a note about writing for Fabelo.',
    page: '/about',
    messageLabel: 'What would you like to tell us?',
    fields: [
      {
        name: 'general_category',
        label: 'What is this about',
        type: 'select',
        required: true,
        options: [
          'A correction to a published story',
          'A question about our reporting',
          'Writing for Fabelo',
          'Partnership or collaboration',
          'Something else',
        ],
      },
      { name: 'general_subject', label: 'Story or subject', type: 'text', hint: 'Headline or URL, if it is about one' },
    ],
  },
  {
    key: 'advertising',
    no: '02',
    title: 'Advertising',
    summary: 'Rates, availability and custom packages across the site and the newsletter.',
    page: '/advertise',
    messageLabel: 'What are you trying to reach, and by when?',
    fields: [
      {
        name: 'ad_format',
        label: 'Format',
        type: 'select',
        required: true,
        options: ['Display banner', 'Sponsored article', 'Newsletter sponsorship', 'A package — help me choose'],
      },
      {
        name: 'ad_placement',
        label: 'Placement (display only)',
        type: 'select',
        options: [
          'No preference',
          'Measure — 1440 × 200, full content width',
          'Feature — 940 × 180, in the article body',
          'Panel — 511 × 300, side column',
          'Rail — 387 × 540, tall side unit',
        ],
      },
      {
        name: 'ad_period',
        label: 'When',
        type: 'select',
        options: ['As soon as possible', 'This quarter', 'Next quarter', 'Ongoing', 'Not decided yet'],
      },
      {
        name: 'ad_budget',
        label: 'Budget range',
        type: 'select',
        options: ['Under $1k / month', '$1k – $5k / month', '$5k – $15k / month', 'Above $15k / month', 'Prefer to discuss'],
      },
    ],
  },
  {
    key: 'sponsorship',
    no: '03',
    title: 'Sponsored content',
    summary: 'In-depth articles written in collaboration with your brand, and longer partnerships.',
    page: '/sponsor',
    messageLabel: 'Tell us about your brand and what you want readers to take away',
    fields: [
      { name: 'sp_brand', label: 'Brand', type: 'text', required: true },
      { name: 'sp_title', label: 'Working title or angle', type: 'text', hint: 'Optional — a rough idea is enough' },
      {
        name: 'sp_category',
        label: 'Section',
        type: 'select',
        required: true,
        options: ['Personal Finance', 'Career', 'AI & Tech', 'Not sure yet'],
      },
      {
        name: 'sp_scope',
        label: 'Scope',
        type: 'select',
        options: ['A single article', 'A series', 'A season-long partnership', 'Open to suggestions'],
      },
    ],
  },
  {
    key: 'licensing',
    no: '04',
    title: 'Rights & licensing',
    summary: 'Permission to republish, translate, quote at length or teach from a Fabelo story.',
    page: '/terms-and-conditions',
    messageLabel: 'Anything else we should know about the intended use?',
    fields: [
      { name: 'lic_article', label: 'Which story', type: 'text', hint: 'Paste the URL', required: true },
      {
        name: 'lic_use',
        label: 'Intended use',
        type: 'select',
        required: true,
        options: ['Republish in full', 'Excerpt or quote at length', 'Translation', 'Teaching or academic use', 'Something else'],
      },
      { name: 'lic_medium', label: 'Where it will appear', type: 'text', hint: 'Publication, course, site' },
    ],
  },
  {
    key: 'privacy',
    no: '05',
    title: 'Privacy & data',
    summary: 'Exercise your rights over the data we hold — access, correction, deletion or export.',
    page: '/data-and-privacy',
    messageLabel: 'Anything that helps us find your record',
    fields: [
      {
        name: 'pr_request',
        label: 'Request',
        type: 'select',
        required: true,
        options: [
          'Access the data you hold about me',
          'Correct my data',
          'Delete my data',
          'Export my data',
          'Object to processing',
        ],
      },
      { name: 'pr_identifier', label: 'Email on record', type: 'text', hint: 'If it differs from the address above' },
    ],
  },
];

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

let sekmeSayisi = 0;
let alanSayisi = 0;

for (const [i, s] of SEKMELER.entries()) {
  const { rows } = await db.query(
    `INSERT INTO contact_tabs (key, no, title, summary, page, message_label, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (key) DO UPDATE SET
       no = EXCLUDED.no, title = EXCLUDED.title, summary = EXCLUDED.summary,
       page = EXCLUDED.page, message_label = EXCLUDED.message_label,
       sort_order = EXCLUDED.sort_order, updated_at = now()
     RETURNING id`,
    [s.key, s.no, s.title, s.summary, s.page, s.messageLabel, i]
  );
  const tabId = rows[0].id;
  sekmeSayisi++;

  // Alanlar bastan yaziliyor: panelden silinen bir alan tohumlama
  // tekrar calisinca geri gelmesin diye once temizleniyor.
  await db.query('DELETE FROM contact_fields WHERE tab_id = $1', [tabId]);
  for (const [j, a] of s.fields.entries()) {
    await db.query(
      `INSERT INTO contact_fields (tab_id, name, label, type, hint, required, options, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [tabId, a.name, a.label, a.type, a.hint ?? null, Boolean(a.required), JSON.stringify(a.options ?? []), j]
    );
    alanSayisi++;
  }
}

const ozet = await db.query(
  `SELECT t.key, t.title, count(f.id)::int AS alan
   FROM contact_tabs t LEFT JOIN contact_fields f ON f.tab_id = t.id
   GROUP BY t.id ORDER BY t.sort_order`
);
await db.end();

console.log(`  ${sekmeSayisi} sekme, ${alanSayisi} alan yazildi`);
for (const r of ozet.rows) console.log(`    ${r.key.padEnd(12)} ${String(r.alan).padStart(2)} alan  ${r.title}`);

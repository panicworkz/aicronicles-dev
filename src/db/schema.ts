import { pgTable, serial, text, timestamp, boolean, integer, jsonb, numeric, index, bigserial } from 'drizzle-orm/pg-core';

// ==========================================
// CORE CONTENT TABLES (Hubz Standard)
// ==========================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const authors = pgTable('authors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  role: text('role').default('Editorial Staff'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  socialLinks: jsonb('social_links').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('authors_slug_idx').on(table.slug),
]);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentCategoryId: integer('parent_category_id'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('categories_slug_idx').on(table.slug),
]);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  color: text('color').default('#2563eb'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('tags_slug_idx').on(table.slug),
]);

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  title: text('title'),
  alt: text('alt'),
  caption: text('caption'),
  aeoContext: text('aeo_context'),
  mimeType: text('mime_type').default('image/jpeg'),
  filesize: integer('filesize'),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  /* Govdenin DOGRULUK KAYNAGI: blok dizisi (bkz. lib/bloklar.ts).
     Bloklar tasinabilir, cogaltilabilir, aralarina yeni tur eklenebilir. */
  blocksJson: jsonb('blocks_json'),
  /* Bloklardan URETILEN HTML. Silinmedi cunku RSS, llms.txt, SSS
     cikarimi, AEO puani ve okuma ekrani buradan besleniyor; her
     kayitta bloklardan yeniden yaziliyor. Elle duzenlenmemeli.

     content_json KALDIRILDI: TipTap'in kendi belge agaciydi, TipTap
     gittikten sonra hicbir yerde okunmuyordu. Yazilan ama okunmayan
     bir sutun, ileride "acaba bu mu dogru?" diye sorulacak ikinci bir
     govde kaynagi olurdu. */
  contentHtml: text('content_html'),
  featuredImageId: integer('featured_image_id').references(() => media.id, { onDelete: 'set null' }),
  featuredImageUrl: text('featured_image_url'),
  status: text('status').notNull().default('published'),
  authorId: integer('author_id').references(() => authors.id, { onDelete: 'set null' }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  tagsJson: jsonb('tags_json').default([]),
  readingTime: text('reading_time').default('5 min read'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('posts_slug_idx').on(table.slug),
  index('posts_status_idx').on(table.status),
  index('posts_category_id_idx').on(table.categoryId),
  index('posts_author_id_idx').on(table.authorId),
  index('posts_published_at_idx').on(table.publishedAt),
]);

export const postRevisions = pgTable('post_revisions', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  /* Surumler de blok tutuyor: yoksa eski bir surume donuldugunde
     govde HTML'den yeniden ayristirilir ve o surumun blok duzeni
     (ornegin elle bolunmus bir paragraf) kaybolurdu. */
  blocksJson: jsonb('blocks_json'),
  contentHtml: text('content_html'),
  excerpt: text('excerpt'),
  authorName: text('author_name').default('Admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('post_revisions_post_id_idx').on(table.postId),
]);

export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  /* Basligin altindaki giris cumlesi. Sabit sayfada da yazinin
     ustundeki spot kadar ise yariyor: hem sayfanin ustunde okunuyor
     hem paylasim ozeti olarak gidiyor. */
  excerpt: text('excerpt'),
  /* Govdenin DOGRULUK KAYNAGI — yazilarla AYNI model (lib/bloklar.ts).
     Sabit sayfalarin duzeni once kodda bir eslesme tablosundaydi;
     artik duzeni de bloklar tasiyor. */
  blocksJson: jsonb('blocks_json'),
  /* Bloklardan URETILEN HTML. Elle duzenlenmemeli: her kayitta
     bloklardan yeniden yaziliyor. */
  contentHtml: text('content_html'),
  featuredImageId: integer('featured_image_id').references(() => media.id, { onDelete: 'set null' }),
  featuredImageUrl: text('featured_image_url'),
  status: text('status').notNull().default('published'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('pages_slug_idx').on(table.slug),
  index('pages_status_idx').on(table.status),
]);

/**
 * KALICI YONLENDIRMELER.
 *
 * Bir adres degistiginde eskisine gelen okuru ve arama motorunu
 * yenisine gondermek icin. Boyle bir yol yoktu: eski adres 404
 * donuyordu, yani o adrese verilmis butun dis baglantilar ve arama
 * sirasindaki yer bir anda kayboluyordu.
 */
export const redirects = pgTable('redirects', {
  id: serial('id').primaryKey(),
  fromSlug: text('from_slug').notNull().unique(),
  toSlug: text('to_slug').notNull(),
  /* Neden tasindi — alti ay sonra bakan biri icin. */
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('redirects_from_slug_idx').on(table.fromSlug),
]);

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
/* E-TICARET TABLOLARI.
   Basligi "Payload E-Commerce Standard" yaziyordu — bu projede
   Payload YOK; bagimliliklarda gecmiyor. Next.js + Drizzle + Postgres
   kullaniliyor. Yanlis bir kaynak gostermek, sonradan bakan birini
   olmayan bir belgeye yollar. */
// ==========================================

export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('product_categories_slug_idx').on(table.slug),
]);

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  contentHtml: text('content_html'),
  featuredImageUrl: text('featured_image_url'),
  galleryUrls: jsonb('gallery_urls').default([]),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  compareAtPrice: numeric('compare_at_price', { precision: 10, scale: 2 }),
  currency: text('currency').notNull().default('USD'),
  sku: text('sku'),
  inventory: integer('inventory').default(100),
  unlimitedStock: boolean('unlimited_stock').default(false),
  productType: text('product_type').notNull().default('physical'),
  digitalAssetUrl: text('digital_asset_url'),
  checkoutUrl: text('checkout_url'),
  status: text('status').notNull().default('published'),
  categoryId: integer('category_id').references(() => productCategories.id, { onDelete: 'set null' }),
  tagsJson: jsonb('tags_json').default([]),
  specificationsJson: jsonb('specifications_json').default([]),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('products_slug_idx').on(table.slug),
  index('products_category_id_idx').on(table.categoryId),
  index('products_status_idx').on(table.status),
]);

export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  sku: text('sku'),
  price: numeric('price', { precision: 10, scale: 2 }),
  inventory: integer('inventory').default(50),
  optionsJson: jsonb('options_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('product_variants_product_id_idx').on(table.productId),
]);

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  phone: text('phone'),
  totalSpent: numeric('total_spent', { precision: 10, scale: 2 }).default('0.00'),
  orderCount: integer('order_count').default(0),
  shippingAddressJson: jsonb('shipping_address_json'),
  billingAddressJson: jsonb('billing_address_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('customers_email_idx').on(table.email),
]);

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0.00'),
  tax: numeric('tax', { precision: 10, scale: 2 }).default('0.00'),
  shipping: numeric('shipping', { precision: 10, scale: 2 }).default('0.00'),
  currency: text('currency').notNull().default('USD'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  orderStatus: text('order_status').notNull().default('processing'),
  carrier: text('carrier'),
  trackingNumber: text('tracking_number'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  /* Parayi nasil aliyoruz: bank_transfer | cash_on_delivery | card.
     Sema yalnizca stripe_payment_intent_id tasiyordu, yani tek bir
     saglayiciya gore yazilmisti; havale ve kapida odeme hicbir yere
     kaydedilemezdi. Bkz. scripts/migration_odeme_yontemi.sql */
  paymentMethod: text('payment_method'),
  /* Havalede dekont notu, kartta saglayici referansi — ikisi de ayni
     soruyu cevapliyor: bu parayi hangi kayitla eslestirdik. */
  paymentReference: text('payment_reference'),
  /* Onay kayitlari. Dijital urundeki cayma hakki istisnasi ancak
     tuketici bilgilendirilip ONAYLADIYSA gecerli ve bunu satici
     ispat etmek zorunda. Bkz. scripts/migration_onay_kaydi.sql */
  /* Odemenin ONAYLANDIGI an. payment_status tek basina "odendi mi"
     sorusuna cevap veriyordu ama "ne zaman" sorusuna vermiyordu;
     havale ve kapida odemede para siparisten gunler sonra geldigi
     icin rapordaki haftalik gelir yanlis haftaya yaziliyordu. */
  paidAt: timestamp('paid_at'),
  termsAcceptedAt: timestamp('terms_accepted_at'),
  digitalWaiverAt: timestamp('digital_waiver_at'),
  shippingAddressJson: jsonb('shipping_address_json'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('orders_customer_id_idx').on(table.customerId),
  index('orders_order_status_idx').on(table.orderStatus),
  index('orders_created_at_idx').on(table.createdAt),
]);

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'set null' }),
  variantId: integer('variant_id'),
  title: text('title').notNull(),
  productType: text('product_type').default('physical'),
  digitalAssetUrl: text('digital_asset_url'),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('order_items_order_id_idx').on(table.orderId),
  index('order_items_product_id_idx').on(table.productId),
]);

/**
 * SEPET GOLGESI.
 *
 * Sepetin kendisi tarayicida (localStorage) duruyor ve orada kalmali:
 * sunucuda tutmak oturum ve temizlik isi demek. Bu tablo sepetin
 * yerine gecmiyor, NE OLDUGUNU kaydediyor — "kac sepet acildi, kaci
 * siparise dondu, birakilan sepetlerde ne kadar para var" sorularinin
 * baska cevabi yoktu.
 *
 * "Birakilmis" bir DURUM DEGIL, hesap: son hareketin uzerinden gecen
 * sure. Durum olarak yazsaydik onu guncelleyecek zamanlanmis bir is
 * gerekirdi; o is bir gun calismayinca rapor sessizce yalan soylerdi.
 */
export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  /* Tarayicinin urettigi rastgele kimlik — cerez degil, localStorage. */
  token: text('token').notNull().unique(),
  /* Yalnizca odeme adiminda YAZILDIYSA. Yazilmadiysa sepetin sahibi
     bilinmiyor ve bu normal. */
  email: text('email'),
  name: text('name'),
  itemsJson: jsonb('items_json').notNull().default([]),
  itemCount: integer('item_count').notNull().default(0),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0.00'),
  currency: text('currency').notNull().default('USD'),
  /** active | ordered */
  status: text('status').notNull().default('active'),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
  orderedAt: timestamp('ordered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('carts_status_idx').on(table.status),
  index('carts_updated_at_idx').on(table.updatedAt),
  index('carts_email_idx').on(table.email),
]);

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull().default('percentage'),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }).default('0.00'),
  usageLimit: integer('usage_limit'),
  timesUsed: integer('times_used').default(0),
  active: boolean('active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('coupons_code_idx').on(table.code),
  index('coupons_active_idx').on(table.active),
]);

export const ads = pgTable('ads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  placement: text('placement').notNull(), // 'billboard' | 'leaderboard' | 'skyscraper' | 'rectangle' | 'inread' | 'native'
  imageUrl: text('image_url').notNull(),
  alt: text('alt'),
  targetUrl: text('target_url').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  impressions: integer('impressions').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  /** Reklam ANA SAYFADA cikar mi.
      Once "hedefi olmayan reklam ana sayfada cikar" kuralı vardi;
      ana sayfayi CMS'ten yonetmenin yolu yoktu. */
  targetHome: boolean('target_home').notNull().default(false),
  /** Bos dizi = her kategoride/etikette cikabilir */
  targetCategories: text('target_categories').array().default([]),
  targetTags: text('target_tags').array().default([]),
  /** Deneydeki kol: contextual | offset | null (deney disi) */
  arm: text('arm'),
  /** Hedef sitenin dili — olay kaydina da yaziliyor */
  destLang: text('dest_lang'),
  /** Deneydeki ikinci faktor: plain (tek tip sade) | styled (kendi tarzi) */
  creative: text('creative'),
  /** Ayni markanin varyantlarini gruplayan anahtar — 'superd', 'turco' … */
  brand: text('brand'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('ads_placement_idx').on(table.placement),
  index('ads_is_active_idx').on(table.isActive),
  index('ads_starts_at_idx').on(table.startsAt),
  index('ads_ends_at_idx').on(table.endsAt),
]);


/**
 * Bulten aboneleri.
 *
 * Abonelik formu daha once hicbir yere gitmiyordu (onSubmit yalnizca
 * preventDefault yapiyordu). Artik adres once buraya yaziliyor, sonra
 * merkezi contact-gateway'e iletiliyor: gateway erisilemese bile kayit
 * kaybolmuyor.
 */
/**
 * Iletisim formunun SEKMELERI.
 *
 * Once sekmeler ve alanlar kodda duruyordu (contact/sekmeler.ts): yeni
 * bir sekme acmak ya da bir butce araligini degistirmek kod degisikligi
 * ve yeniden derleme istiyordu. Artik panelden yonetiliyor.
 *
 * `key` adres parametresidir: /contact?type=advertising. Statik
 * sayfalardaki baglantilar bu degeri kullaniyor, o yuzden bir sekmenin
 * key'i degisirse o baglantilar da guncellenmeli — panel bunu uyariyor.
 */
export const contactTabs = pgTable('contact_tabs', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  /** Sekme numarasi — "01", "02"... Ekranda gorunuyor. */
  no: text('no').notNull().default('01'),
  title: text('title').notNull(),
  /** Sekmenin altindaki aciklama cumlesi. */
  summary: text('summary'),
  /** Bu sekmeyi acan sabit sayfa — /advertise gibi. Yalnizca kayit
      icin: hangi sayfanin buraya baglandigini panelde gostermek. */
  page: text('page'),
  /** Mesaj kutusunun ustundeki soru. */
  messageLabel: text('message_label').notNull().default('Your message'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('contact_tabs_sort_idx').on(table.sortOrder),
]);

/**
 * Sekmeye ozel alanlar.
 *
 * Ortak alanlar (ad, kurum, e-posta, telefon, mesaj) formda sabit;
 * burada yalnizca KONUYA ozel olanlar duruyor — reklam formatı, butce
 * araligi, hangi yazi gibi.
 */
export const contactFields = pgTable('contact_fields', {
  id: serial('id').primaryKey(),
  tabId: integer('tab_id').notNull().references(() => contactTabs.id, { onDelete: 'cascade' }),
  /** Gonderilen veride ve e-postada kullanilan ad. */
  name: text('name').notNull(),
  label: text('label').notNull(),
  /** text | select */
  type: text('type').notNull().default('text'),
  /** Metin alaninda yer tutucu; secimde kullanilmiyor. */
  hint: text('hint'),
  required: boolean('required').notNull().default(false),
  /** type = select oldugunda secenekler. */
  options: jsonb('options').default([]),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('contact_fields_tab_id_idx').on(table.tabId),
]);

/**
 * Iletisim formu mesajlari.
 *
 * ASIL KAYIT BURASI, gateway degil. Once bu tabloya yaziliyor, sonra
 * merkezi gateway'e iletiliyor ve iletimin sonucu gatewayStatus'a
 * isleniyor — bulten aboneligiyle ayni sira (bkz. api/subscribe).
 *
 * Onceden mesaj YALNIZCA gateway'e gidiyordu: SMTP dusse mesaj siteden
 * tarafinda hic iz birakmadan kayboluyordu ve panelde "bu mesaji
 * cevapladim" diyebilecegin bir yer yoktu.
 */
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  /** Formdaki sekme — general | advertising | sponsorship | licensing | privacy */
  topic: text('topic').notNull().default('general'),
  /** Sekmenin okunabilir adi; sekme kodu sonradan degisse bile kayit
      hangi konuda geldigini kendi icinde tasisin. */
  topicLabel: text('topic_label'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  organization: text('organization'),
  phone: text('phone'),
  subject: text('subject'),
  message: text('message').notNull(),
  /** Sekmeye ozel alanlar (format, butce, hangi yazi...). Sekmeler
      degisebildigi icin sabit sutun degil, etiket->deger olarak. */
  fields: jsonb('fields'),
  sourceUrl: text('source_url'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  /** new | read | replied | archived */
  status: text('status').notNull().default('new'),
  /** Gateway'e iletildi mi — sent | failed */
  gatewayStatus: text('gateway_status'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('contact_messages_status_idx').on(table.status),
  index('contact_messages_created_at_idx').on(table.createdAt),
]);

export const subscribers = pgTable('subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  /** Formun sayfadaki yeri — footer | dispatch | article */
  source: text('source'),
  /** Kaydin yapildigi sayfanin adresi — hangi yazi abone getirdi */
  sourceUrl: text('source_url'),
  status: text('status').notNull().default('active'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  /** Gateway'e iletildi mi — sent | queued | failed */
  gatewayStatus: text('gateway_status'),
  /** E-postadaki tek tik cikis baglantisinin tasidigi jeton */
  unsubscribeToken: text('unsubscribe_token').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  unsubscribedAt: timestamp('unsubscribed_at'),
}, (table) => [
  index('subscribers_status_idx').on(table.status),
  index('subscribers_created_at_idx').on(table.createdAt),
]);

/**
 * Reklam olaylari — her gosterim ve tiklama KENDI BAGLAMIYLA.
 *
 * ads.impressions/clicks yalnizca toplam tutuyor; bir reklam bes ayri
 * konu sayfasinda donunce hangi sayfanin tiklama getirdigi kayboluyordu.
 * "Konuyla ortusen marka daha iyi mi calisiyor" sorusu ancak bu tabloyla
 * cevaplanabiliyor.
 */
export const adEvents = pgTable('ad_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  adId: integer('ad_id').notNull().references(() => ads.id, { onDelete: 'cascade' }),
  /** impression | click */
  kind: text('kind').notNull(),
  pagePath: text('page_path'),
  /** home | category | tag | author | article */
  contextType: text('context_type'),
  contextSlug: text('context_slug'),
  /** Olayin yasandigi andaki kol — reklamin kolu sonra degisse de
      gecmis olcum bozulmasin diye burada saklaniyor. */
  arm: text('arm'),
  /** Olay anindaki hedef dili — kol gibi, sonradan degisse de gecmis bozulmasin */
  destLang: text('dest_lang'),
  /** Olay anindaki kreatif varyanti: plain | styled */
  creative: text('creative'),
  /** Marka anahtari — iki varyanti tek satirda gruplamak icin */
  brand: text('brand'),
  /** Okuru taniyor muyuz: anon | member. Site henuz okur girisi
      tasimiyor; 'member' su an bulten abonesi demek. */
  viewer: text('viewer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('ad_events_ad_idx').on(table.adId),
  index('ad_events_kind_idx').on(table.kind),
  index('ad_events_context_idx').on(table.contextType, table.contextSlug),
  index('ad_events_created_idx').on(table.createdAt),
]);

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
  contentHtml: text('content_html'),
  contentJson: jsonb('content_json'),
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
  contentHtml: text('content_html'),
  contentJson: jsonb('content_json'),
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
  contentJson: jsonb('content_json'),
  contentHtml: text('content_html'),
  status: text('status').notNull().default('published'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('pages_slug_idx').on(table.slug),
  index('pages_status_idx').on(table.status),
]);

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// E-COMMERCE CORE TABLES (Payload E-Commerce Standard)
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
  contentJson: jsonb('content_json'),
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

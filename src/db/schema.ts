import { pgTable, serial, text, timestamp, boolean, integer, jsonb, numeric } from 'drizzle-orm/pg-core';

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
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  contentHtml: text('content_html'),
  contentJson: jsonb('content_json'),
  featuredImageUrl: text('featured_image_url'),
  featuredImageAlt: text('featured_image_alt'),
  authorId: integer('author_id').references(() => users.id),
  status: text('status').notNull().default('draft'),
  readingTime: text('reading_time').default('5 min read'),
  categoryId: integer('category_id').references(() => categories.id),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  canonicalUrl: text('canonical_url'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postRevisions = pgTable('post_revisions', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  title: text('title').notNull(),
  contentHtml: text('content_html'),
  contentJson: jsonb('content_json'),
  summary: text('summary'),
  authorId: integer('author_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  alt: text('alt'),
  caption: text('caption'),
  mimeType: text('mime_type'),
  filesize: integer('filesize'),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  contentHtml: text('content_html'),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
});

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
  categoryId: integer('category_id'),
  tagsJson: jsonb('tags_json').default([]),
  specificationsJson: jsonb('specifications_json').default([]),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  title: text('title').notNull(),
  sku: text('sku'),
  price: numeric('price', { precision: 10, scale: 2 }),
  inventory: integer('inventory').default(50),
  optionsJson: jsonb('options_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: integer('customer_id'),
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
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  productId: integer('product_id').notNull(),
  variantId: integer('variant_id'),
  title: text('title').notNull(),
  productType: text('product_type').default('physical'),
  digitalAssetUrl: text('digital_asset_url'),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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
});

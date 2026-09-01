-- =========================================================================
-- PANIC CMS — SCHEMA V2 SECURITY, FOREIGN KEYS & INDEXES MIGRATION
-- Safe, transactional, idempotent migration script for PostgreSQL 16
-- =========================================================================

BEGIN;

-- 1. Ensure authors table has all schema columns
ALTER TABLE IF EXISTS authors ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS authors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Clean any orphaned foreign key references before adding constraints
-- Posts -> Categories
UPDATE posts 
SET category_id = NULL 
WHERE category_id IS NOT NULL 
  AND category_id NOT IN (SELECT id FROM categories);

-- Posts -> Authors
UPDATE posts 
SET author_id = NULL 
WHERE author_id IS NOT NULL 
  AND author_id NOT IN (SELECT id FROM authors);

-- Posts -> Media
UPDATE posts 
SET featured_image_id = NULL 
WHERE featured_image_id IS NOT NULL 
  AND featured_image_id NOT IN (SELECT id FROM media);

-- Post Revisions -> Posts
DELETE FROM post_revisions 
WHERE post_id NOT IN (SELECT id FROM posts);

-- Products -> Product Categories
UPDATE products 
SET category_id = NULL 
WHERE category_id IS NOT NULL 
  AND category_id NOT IN (SELECT id FROM product_categories);

-- Product Variants -> Products
DELETE FROM product_variants 
WHERE product_id NOT IN (SELECT id FROM products);

-- Orders -> Customers
UPDATE orders 
SET customer_id = NULL 
WHERE customer_id IS NOT NULL 
  AND customer_id NOT IN (SELECT id FROM customers);

-- Order Items -> Orders
DELETE FROM order_items 
WHERE order_id NOT IN (SELECT id FROM orders);

-- Order Items -> Products
UPDATE order_items 
SET product_id = NULL 
WHERE product_id IS NOT NULL 
  AND product_id NOT IN (SELECT id FROM products);

-- 3. Add Foreign Key Constraints Safely
-- posts -> categories
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_category') THEN
    ALTER TABLE posts 
      ADD CONSTRAINT fk_posts_category 
      FOREIGN KEY (category_id) REFERENCES categories(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- posts -> authors
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_author') THEN
    ALTER TABLE posts 
      ADD CONSTRAINT fk_posts_author 
      FOREIGN KEY (author_id) REFERENCES authors(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- posts -> media
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_featured_image') THEN
    ALTER TABLE posts 
      ADD CONSTRAINT fk_posts_featured_image 
      FOREIGN KEY (featured_image_id) REFERENCES media(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- post_revisions -> posts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_post_revisions_post') THEN
    ALTER TABLE post_revisions 
      ADD CONSTRAINT fk_post_revisions_post 
      FOREIGN KEY (post_id) REFERENCES posts(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- products -> product_categories
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_category') THEN
    ALTER TABLE products 
      ADD CONSTRAINT fk_products_category 
      FOREIGN KEY (category_id) REFERENCES product_categories(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- product_variants -> products
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_variants_product') THEN
    ALTER TABLE product_variants 
      ADD CONSTRAINT fk_product_variants_product 
      FOREIGN KEY (product_id) REFERENCES products(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- orders -> customers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_customer') THEN
    ALTER TABLE orders 
      ADD CONSTRAINT fk_orders_customer 
      FOREIGN KEY (customer_id) REFERENCES customers(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- order_items -> orders
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_items_order') THEN
    ALTER TABLE order_items 
      ADD CONSTRAINT fk_order_items_order 
      FOREIGN KEY (order_id) REFERENCES orders(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- order_items -> products
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_items_product') THEN
    ALTER TABLE order_items 
      ADD CONSTRAINT fk_order_items_product 
      FOREIGN KEY (product_id) REFERENCES products(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Create Performance and Query Indexes
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_category_id_idx ON posts(category_id);
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at DESC);

CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug);
CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags(slug);
CREATE INDEX IF NOT EXISTS authors_slug_idx ON authors(slug);
CREATE INDEX IF NOT EXISTS pages_slug_idx ON pages(slug);
CREATE INDEX IF NOT EXISTS pages_status_idx ON pages(status);

CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS product_categories_slug_idx ON product_categories(slug);
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_order_status_idx ON orders(order_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);
CREATE INDEX IF NOT EXISTS post_revisions_post_id_idx ON post_revisions(post_id);
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON coupons(active);

COMMIT;

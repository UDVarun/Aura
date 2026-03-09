-- AURA V2: AMAZON/MYNTRA PRODUCT SCHEMA
-- Run this in your Supabase SQL Editor

-- 1. Create Categories Table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Products Table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Reviews Table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, user_id) -- One review per user per product
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- -----------------
-- CATEGORIES POLICIES
-- -----------------
-- Everyone can read categories
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Only admins can insert/update/delete (we use our user_roles table for this check, or just restrict for now)
-- (Simplification: for now we allow manual data entry or admin only)


-- -----------------
-- PRODUCTS POLICIES
-- -----------------
-- Everyone can read products
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Vendors can insert their own products
CREATE POLICY "Vendors can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

-- Vendors can update their own products
CREATE POLICY "Vendors can update own products" ON products
  FOR UPDATE USING (auth.uid() = vendor_id);

-- Vendors can delete their own products
CREATE POLICY "Vendors can delete own products" ON products
  FOR DELETE USING (auth.uid() = vendor_id);


-- -----------------
-- REVIEWS POLICIES
-- -----------------
-- Everyone can read reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- SEED INITIAL DATA (Optional)
-- ==========================================
INSERT INTO categories (name, slug, image_url) VALUES 
('Electronics', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661'),
('Fashion', 'fashion', 'https://images.unsplash.com/photo-1445205170230-053b83016050'),
('Home & Garden', 'home-garden', 'https://images.unsplash.com/photo-1484154218962-a197022b5858'),
('Sports', 'sports', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211')
ON CONFLICT (slug) DO NOTHING;

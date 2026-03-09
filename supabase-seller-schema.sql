-- ==============================================================================
-- Aura E-Commerce: SELLER ECOSYSTEM SCHEMA
-- This script creates the core infrastructure for Orders, Shipping Management,
-- and Customer Questions (Q&A) to power the Vendor Dashboard natively.
-- ==============================================================================

-- 1. Create Orders Table (Tracking overall customer purchases)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Order Items Table (Tracking which vendor sold which item in an order)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Product Questions Table (Customer Q&A)
CREATE TABLE IF NOT EXISTS public.product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT, -- Vendor replies here
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

-- Orders: Customers see their own orders.
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Order Items: Vendors can ONLY see line items belonging to their products, and customers can see their own.
CREATE POLICY "Vendors view own sold items" ON public.order_items FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Customers view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));
CREATE POLICY "Vendors update shipping status of own items" ON public.order_items FOR UPDATE USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);

-- Q&A: Everyone can read questions and answers.
CREATE POLICY "Anyone views Q&A" ON public.product_questions FOR SELECT USING (true);
CREATE POLICY "Customers ask questions" ON public.product_questions FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Vendors answer questions on own products" ON public.product_questions FOR UPDATE USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);

-- 4. Storage Bucket for Products
-- Assuming Supabase Storage is enabled, we create a public bucket for product images.
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Images publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

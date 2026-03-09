-- ==============================================================================
-- Aura E-Commerce: SECURE CART SCHEMA
-- This SQL script creates the necessary table & policies to store cart data 
-- strictly associated with a logged-in user.
-- ==============================================================================

-- 1. Create the cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_price NUMERIC(10, 2) NOT NULL,
    product_image TEXT NOT NULL,
    product_category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a user only has one row per unique product for easy updates
    UNIQUE(user_id, product_id)
);

-- 2. Enable Row Level Security (RLS) to physically isolate data per user
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can only read their own cart items
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert items into their own cart
CREATE POLICY "Users can insert their own cart items" 
ON public.cart_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own cart items
CREATE POLICY "Users can update their own cart items" 
ON public.cart_items FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own cart items
CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create an index for faster lookups when querying a user's entire cart
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

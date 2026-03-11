-- =====================================================
-- AURA MARKETPLACE DATABASE SETUP
-- Full updated schema with safe reruns, auth profile sync,
-- non-recursive admin RLS, vendor workflows, orders,
-- support cases, reviews, and storage.
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- 1. PROFILES
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'customer',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'customer';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- =====================================================
-- 2. AUTH -> PROFILE SYNC
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  )
  on conflict (id) do update
  set 
    email = excluded.email,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Force sync all profiles from auth metadata
insert into public.profiles (id, email, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'role', 'customer')
from auth.users u
on conflict (id) do update
set 
  email = excluded.email,
  role = excluded.role;

-- =====================================================
-- 3. ADMIN HELPER
-- =====================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = auth, public
as $$
  -- Check user metadata directly to avoid recursion on public.profiles
  select (raw_user_meta_data->>'role' = 'admin')
  from auth.users
  where id = auth.uid();
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- =====================================================
-- 4. UPDATED_AT TRIGGER FUNCTION
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- 5. VENDORS
-- =====================================================
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_name text not null,
  store_description text,
  phone text,
  address text,
  business_category text,
  government_id text,
  gst_number text,
  status text not null default 'pending',
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendors_status_check check (status in ('pending', 'approved', 'rejected', 'suspended'))
);

alter table public.vendors add column if not exists store_description text;
alter table public.vendors add column if not exists phone text;
alter table public.vendors add column if not exists address text;
alter table public.vendors add column if not exists business_category text;
alter table public.vendors add column if not exists government_id text;
alter table public.vendors add column if not exists gst_number text;
alter table public.vendors add column if not exists review_notes text;
alter table public.vendors add column if not exists reviewed_at timestamptz;
alter table public.vendors add column if not exists reviewed_by uuid;
alter table public.vendors add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vendors_reviewed_by_fkey'
  ) then
    alter table public.vendors
      add constraint vendors_reviewed_by_fkey
      foreign key (reviewed_by) references public.profiles(id) on delete set null;
  end if;
end $$;

create unique index if not exists vendors_user_id_key
on public.vendors(user_id);

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

-- =====================================================
-- 6. CATEGORIES
-- =====================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique,
  created_at timestamptz not null default now()
);

insert into public.categories (name, slug)
values
  ('Electronics', 'electronics'),
  ('Fashion', 'fashion'),
  ('Home Decor', 'home-decor'),
  ('Accessories', 'accessories'),
  ('Audio', 'audio'),
  ('Kitchen', 'kitchen'),
  ('Furniture', 'furniture'),
  ('Sports', 'sports')
on conflict (name) do nothing;

-- =====================================================
-- 7. PRODUCTS
-- =====================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  price numeric(12,2) not null default 0,
  stock_quantity integer not null default 0,
  image_url text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists description text;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists brand text default 'Aura';
alter table public.products add column if not exists tier text not null default 'standard' check (tier in ('elite', 'premium', 'standard'));
alter table public.products add column if not exists rating numeric(2,1) default 4.5;
alter table public.products add column if not exists updated_at timestamptz not null default now();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Performance indexes for products
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_vendor_id_idx on public.products(vendor_id);
create index if not exists products_created_at_idx on public.products(created_at desc);
create index if not exists products_brand_idx on public.products(brand);
create index if not exists products_tier_idx on public.products(tier);

-- =====================================================
-- 7.1 PRODUCT IMAGES
-- =====================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_images_display_order_idx on public.product_images(display_order);

-- =====================================================
-- 8. USER PROFILES
-- =====================================================
create table if not exists public.user_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  country text default 'India',
  upi_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- =====================================================
-- 9. CART
-- =====================================================
create table if not exists public.cart_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_name text not null,
  product_price numeric(12,2) not null default 0,
  product_image text,
  product_category text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

-- =====================================================
-- 10. ORDERS
-- =====================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  order_number text not null unique,
  status text not null default 'placed',
  payment_status text not null default 'paid',
  fulfillment_status text not null default 'pending_vendor_ack',
  subtotal numeric(12,2) not null default 0,
  shipping_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  payment_method text,
  shipping_address jsonb not null default '{}'::jsonb,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (status in ('placed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed')),
  constraint orders_payment_status_check check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  constraint orders_fulfillment_status_check check (fulfillment_status in ('pending_vendor_ack', 'processing', 'partially_shipped', 'shipped', 'delivered', 'issue_reported'))
);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  vendor_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_title text not null,
  quantity integer not null default 1 check (quantity > 0),
  price_at_time numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  status text not null default 'placed',
  shipment_status text not null default 'pending',
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_items_status_check check (status in ('placed', 'processing', 'shipped', 'delivered', 'cancelled', 'refund_requested', 'refunded', 'disputed')),
  constraint order_items_shipment_status_check check (shipment_status in ('pending', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'issue_reported'))
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_vendor_id_idx on public.order_items(vendor_id);
create index if not exists order_items_customer_id_idx on public.order_items(customer_id);

drop trigger if exists order_items_set_updated_at on public.order_items;
create trigger order_items_set_updated_at
before update on public.order_items
for each row execute function public.set_updated_at();

-- =====================================================
-- 11. PRODUCT QUESTIONS
-- =====================================================
create table if not exists public.product_questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  answer text,
  answered_by uuid references public.profiles(id) on delete set null,
  answered_at timestamptz,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_questions_status_check check (status in ('open', 'answered', 'closed'))
);

create index if not exists product_questions_product_id_idx on public.product_questions(product_id);
create index if not exists product_questions_vendor_id_idx on public.product_questions(vendor_id);

drop trigger if exists product_questions_set_updated_at on public.product_questions;
create trigger product_questions_set_updated_at
before update on public.product_questions
for each row execute function public.set_updated_at();

-- =====================================================
-- 12. PRODUCT REVIEWS
-- =====================================================
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, customer_id, order_item_id)
);

create index if not exists product_reviews_product_id_idx on public.product_reviews(product_id);

drop trigger if exists product_reviews_set_updated_at on public.product_reviews;
create trigger product_reviews_set_updated_at
before update on public.product_reviews
for each row execute function public.set_updated_at();

-- =====================================================
-- 13. SUPPORT CASES
-- =====================================================
create table if not exists public.support_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid references public.profiles(id) on delete set null,
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  category text not null,
  subject text not null,
  description text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  resolution text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_cases_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint support_cases_status_check check (status in ('open', 'waiting_for_vendor', 'waiting_for_customer', 'escalated', 'resolved', 'closed'))
);

create index if not exists support_cases_customer_id_idx on public.support_cases(customer_id);
create index if not exists support_cases_vendor_id_idx on public.support_cases(vendor_id);
create index if not exists support_cases_status_idx on public.support_cases(status);

drop trigger if exists support_cases_set_updated_at on public.support_cases;
create trigger support_cases_set_updated_at
before update on public.support_cases
for each row execute function public.set_updated_at();

create table if not exists public.support_case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.support_cases(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  constraint support_case_messages_sender_role_check check (sender_role in ('customer', 'vendor', 'admin'))
);

create index if not exists support_case_messages_case_id_idx on public.support_case_messages(case_id);

-- =====================================================
-- 14. STORAGE BUCKET
-- =====================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = true;

-- =====================================================
-- 15. ENABLE RLS
-- =====================================================
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.user_profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.product_questions enable row level security;
alter table public.product_reviews enable row level security;
alter table public.product_images enable row level security;
alter table public.support_cases enable row level security;
alter table public.support_case_messages enable row level security;

-- =====================================================
-- 16. DROP OLD POLICIES
-- =====================================================
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

drop policy if exists "Users can view own vendor record" on public.vendors;
drop policy if exists "Users can insert own vendor record" on public.vendors;
drop policy if exists "Users can update own vendor record" on public.vendors;
drop policy if exists "Admins can view all vendors" on public.vendors;
drop policy if exists "Admins can update all vendors" on public.vendors;

drop policy if exists "Users can view own profile details" on public.user_profiles;
drop policy if exists "Users can manage own profile details" on public.user_profiles;

drop policy if exists "Users can manage own cart" on public.cart_items;

drop policy if exists "Customers can view own orders" on public.orders;
drop policy if exists "Customers can insert own orders" on public.orders;
drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Admins can update all orders" on public.orders;

drop policy if exists "Customers can view own order items" on public.order_items;
drop policy if exists "Customers can insert own order items" on public.order_items;
drop policy if exists "Vendors can view their order items" on public.order_items;
drop policy if exists "Vendors can update their order items" on public.order_items;
drop policy if exists "Admins can manage all order items" on public.order_items;

drop policy if exists "Anyone can view questions" on public.product_questions;
drop policy if exists "Customers can ask product questions" on public.product_questions;
drop policy if exists "Vendors and admins can answer questions" on public.product_questions;

drop policy if exists "Anyone can view published reviews" on public.product_reviews;
drop policy if exists "Customers can manage own reviews" on public.product_reviews;
drop policy if exists "Admins can manage all reviews" on public.product_reviews;

drop policy if exists "Participants can view support cases" on public.support_cases;
drop policy if exists "Customers can create support cases" on public.support_cases;
drop policy if exists "Vendors and admins can update support cases" on public.support_cases;

drop policy if exists "Participants can view case messages" on public.support_case_messages;
drop policy if exists "Participants can create case messages" on public.support_case_messages;

drop policy if exists "Anyone can view categories" on public.categories;
drop policy if exists "Admins can manage categories" on public.categories;

drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Authenticated users can insert own products" on public.products;
drop policy if exists "Authenticated users can update own products" on public.products;
drop policy if exists "Authenticated users can delete own products" on public.products;
drop policy if exists "Admins can manage all products" on public.products;

drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;

-- =====================================================
-- 17. PROFILES POLICIES
-- =====================================================
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles
for select
using (public.is_admin());

create policy "Admins can update all profiles"
on public.profiles
for update
using (public.is_admin());

-- =====================================================
-- 18. VENDORS POLICIES
-- =====================================================
create policy "Users can view own vendor record"
on public.vendors
for select
using (auth.uid() = user_id);

create policy "Users can insert own vendor record"
on public.vendors
for insert
with check (auth.uid() = user_id);

create policy "Users can update own vendor record"
on public.vendors
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins can view all vendors"
on public.vendors
for select
using (public.is_admin());

create policy "Admins can update all vendors"
on public.vendors
for update
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- 19. USER PROFILE POLICIES
-- =====================================================
create policy "Users can view own profile details"
on public.user_profiles
for select
using (auth.uid() = user_id);

create policy "Users can manage own profile details"
on public.user_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =====================================================
-- 20. CART POLICIES
-- =====================================================
create policy "Users can manage own cart"
on public.cart_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =====================================================
-- 21. ORDER POLICIES
-- =====================================================
create policy "Customers can view own orders"
on public.orders
for select
using (auth.uid() = customer_id);

create policy "Customers can insert own orders"
on public.orders
for insert
with check (auth.uid() = customer_id);

create policy "Admins can view all orders"
on public.orders
for select
using (public.is_admin());

create policy "Admins can update all orders"
on public.orders
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Customers can view own order items"
on public.order_items
for select
using (auth.uid() = customer_id);

create policy "Customers can insert own order items"
on public.order_items
for insert
with check (auth.uid() = customer_id);

create policy "Vendors can view their order items"
on public.order_items
for select
using (auth.uid() = vendor_id);

create policy "Vendors can update their order items"
on public.order_items
for update
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);

create policy "Admins can manage all order items"
on public.order_items
for all
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- 22. PRODUCT QUESTIONS / REVIEWS POLICIES
-- =====================================================
create policy "Anyone can view questions"
on public.product_questions
for select
using (true);

create policy "Customers can ask product questions"
on public.product_questions
for insert
with check (auth.uid() = customer_id);

create policy "Vendors and admins can answer questions"
on public.product_questions
for update
using (
  auth.uid() = vendor_id
  or public.is_admin()
)
with check (
  auth.uid() = vendor_id
  or public.is_admin()
);

create policy "Anyone can view published reviews"
on public.product_reviews
for select
using (status = 'published');

create policy "Customers can manage own reviews"
on public.product_reviews
for all
using (auth.uid() = customer_id)
with check (auth.uid() = customer_id);

create policy "Admins can manage all reviews"
on public.product_reviews
for all
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- 23. SUPPORT CASE POLICIES
-- =====================================================
create policy "Participants can view support cases"
on public.support_cases
for select
using (
  auth.uid() = customer_id
  or auth.uid() = vendor_id
  or auth.uid() = assigned_admin_id
  or public.is_admin()
);

create policy "Customers can create support cases"
on public.support_cases
for insert
with check (auth.uid() = customer_id);

create policy "Vendors and admins can update support cases"
on public.support_cases
for update
using (
  auth.uid() = vendor_id
  or auth.uid() = customer_id
  or public.is_admin()
)
with check (
  auth.uid() = vendor_id
  or auth.uid() = customer_id
  or public.is_admin()
);

create policy "Participants can view case messages"
on public.support_case_messages
for select
using (
  exists (
    select 1
    from public.support_cases
    where support_cases.id = support_case_messages.case_id
      and (
        support_cases.customer_id = auth.uid()
        or support_cases.vendor_id = auth.uid()
        or support_cases.assigned_admin_id = auth.uid()
        or public.is_admin()
      )
  )
);

create policy "Participants can create case messages"
on public.support_case_messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.support_cases
    where support_cases.id = support_case_messages.case_id
      and (
        support_cases.customer_id = auth.uid()
        or support_cases.vendor_id = auth.uid()
        or support_cases.assigned_admin_id = auth.uid()
        or public.is_admin()
      )
  )
);

-- =====================================================
-- 24. CATEGORY POLICIES
-- =====================================================
create policy "Anyone can view categories"
on public.categories
for select
using (true);

create policy "Admins can manage categories"
on public.categories
for all
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- 25. PRODUCT POLICIES
-- =====================================================
create policy "Anyone can view products"
on public.products
for select
using (true);

create policy "Authenticated users can insert own products"
on public.products
for insert
with check (auth.uid() = vendor_id);

create policy "Authenticated users can update own products"
on public.products
for update
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);

create policy "Authenticated users can delete own products"
on public.products
for delete
using (auth.uid() = vendor_id);

create policy "Admins can manage all products"
on public.products
for all
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- 25.1 PRODUCT IMAGES POLICIES
-- =====================================================
create policy "Anyone can view product images"
on public.product_images
for select
using (true);

create policy "Vendors can manage own product images"
on public.product_images
for all
using (
  exists (
    select 1 from public.products
    where id = product_images.product_id
    and vendor_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.products
    where id = product_images.product_id
    and vendor_id = auth.uid()
  )
);

create policy "Admins can manage all product images"
on public.product_images
for all
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- 26. STORAGE POLICIES
-- =====================================================
create policy "Public can view product images"
on storage.objects
for select
using (bucket_id = 'product-images');

create policy "Authenticated users can upload product images"
on storage.objects
for insert
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can update product images"
on storage.objects
for update
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can delete product images"
on storage.objects
for delete
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

-- =====================================================
-- ADMIN PROMOTION (Helper)
-- =====================================================
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}' WHERE id = '79e52fca-a987-4375-ae0f-36982029484a';
INSERT INTO public.profiles (id, email, role) VALUES ('79e52fca-a987-4375-ae0f-36982029484a', 'varunud96@gmail.com', 'admin') ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- =====================================================
-- 27. VERIFY
-- =====================================================
select id, email, role from public.profiles order by created_at desc;
select id, user_id, store_name, business_category, status from public.vendors order by created_at desc;
select id, title, vendor_id, category_id from public.products order by created_at desc;
select id, name, slug from public.categories order by name;
select id, name, public from storage.buckets where id = 'product-images';

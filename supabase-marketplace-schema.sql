-- =====================================================
-- AURA MARKETPLACE DATABASE SETUP
-- profiles + vendors + categories + products + storage
-- =====================================================

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
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (id, email, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'role', 'customer')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- promote your current account to admin
insert into public.profiles (id, email, role)
values (
  '6fe718bf-aba8-49b4-aa6b-df9e26db2a5e',
  'varunud96@gmail.com',
  'admin'
)
on conflict (id) do update
set email = excluded.email,
    role = 'admin';

-- =====================================================
-- 2. VENDORS
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
    select 1
    from pg_constraint
    where conname = 'vendors_reviewed_by_fkey'
  ) then
    alter table public.vendors
      add constraint vendors_reviewed_by_fkey
      foreign key (reviewed_by) references public.profiles(id) on delete set null;
  end if;
end $$;

create unique index if not exists vendors_user_id_key
on public.vendors(user_id);

-- =====================================================
-- 3. CATEGORIES
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
-- 4. PRODUCTS
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

-- =====================================================
-- 5. CUSTOMER PROFILES
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
for each row
execute function public.set_updated_at();

-- =====================================================
-- 6. USER ADDRESSES
-- =====================================================
create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_addresses_user_id_idx on public.user_addresses(user_id);

drop trigger if exists user_addresses_set_updated_at on public.user_addresses;
create trigger user_addresses_set_updated_at
before update on public.user_addresses
for each row
execute function public.set_updated_at();

-- =====================================================
-- 7. CARTS
-- =====================================================
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_status_check check (status in ('active', 'converted', 'abandoned'))
);

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
before update on public.carts
for each row
execute function public.set_updated_at();

-- =====================================================
-- 8. CART
-- =====================================================
create table if not exists public.cart_items (
  cart_id uuid references public.carts(id) on delete cascade,
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

alter table public.cart_items add column if not exists cart_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cart_items_cart_id_fkey'
  ) then
    alter table public.cart_items
      add constraint cart_items_cart_id_fkey
      foreign key (cart_id) references public.carts(id) on delete cascade;
  end if;
end $$;

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row
execute function public.set_updated_at();

-- =====================================================
-- 9. WISHLISTS
-- =====================================================
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists wishlists_user_id_idx on public.wishlists(user_id);

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
for each row
execute function public.set_updated_at();

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
for each row
execute function public.set_updated_at();

-- =====================================================
-- 8. PRODUCT QUESTIONS AND REVIEWS
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
for each row
execute function public.set_updated_at();

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
for each row
execute function public.set_updated_at();

-- =====================================================
-- 9. SUPPORT CASES
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
for each row
execute function public.set_updated_at();

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
-- 10. STORAGE BUCKET
-- =====================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = true;

-- =====================================================
-- 11. ENABLE RLS
-- =====================================================
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.product_questions enable row level security;
alter table public.product_reviews enable row level security;
alter table public.support_cases enable row level security;
alter table public.support_case_messages enable row level security;

-- =====================================================
-- 12. DROP OLD POLICIES IF EXISTS
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
drop policy if exists "Users can view own addresses" on public.user_addresses;
drop policy if exists "Users can manage own addresses" on public.user_addresses;

drop policy if exists "Users can view own cart" on public.carts;
drop policy if exists "Users can manage own cart container" on public.carts;
drop policy if exists "Users can manage own cart" on public.cart_items;
drop policy if exists "Users can manage own wishlist" on public.wishlists;

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
-- 13. PROFILES POLICIES
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
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- 14. VENDORS POLICIES
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
-- 15. USER PROFILE POLICIES
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
-- 16. ADDRESS POLICIES
-- =====================================================
create policy "Users can view own addresses"
on public.user_addresses
for select
using (auth.uid() = user_id);

create policy "Users can manage own addresses"
on public.user_addresses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =====================================================
-- 17. CART POLICIES
-- =====================================================
create policy "Users can view own cart"
on public.carts
for select
using (auth.uid() = user_id);

create policy "Users can manage own cart container"
on public.carts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own cart"
on public.cart_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =====================================================
-- 18. WISHLIST POLICIES
-- =====================================================
create policy "Users can manage own wishlist"
on public.wishlists
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =====================================================
-- 19. ORDER POLICIES
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
-- 18. PRODUCT QUESTION AND REVIEW POLICIES
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
-- 19. SUPPORT CASE POLICIES
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
-- 20. CATEGORIES POLICIES
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
-- 21. PRODUCTS POLICIES
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
-- 22. STORAGE POLICIES
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
-- 23. VERIFY
-- =====================================================
select id, email, role from public.profiles;
select id, name, slug from public.categories order by name;
select id, name, public from storage.buckets where id = 'product-images';

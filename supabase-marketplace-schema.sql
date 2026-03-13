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
alter table public.products add column if not exists avg_rating numeric(2,1) default 0.0;
alter table public.products add column if not exists review_count integer default 0;
alter table public.products add column if not exists rating_distribution jsonb default '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb;
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
  avatar_url text,
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
  media_urls jsonb default '[]'::jsonb,
  helpful_count integer not null default 0,
  unhelpful_count integer not null default 0,
  is_verified boolean not null default false,
  weighted_score numeric(4,2),
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, customer_id)
);

-- Table for helpful/unhelpful votes
create table if not exists public.review_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote_type text not null check (vote_type in ('helpful', 'unhelpful')),
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

alter table public.review_votes enable row level security;

-- trigger function for product aggregates
create or replace function public.update_product_review_aggregates()
returns trigger
language plpgsql
security definer
as $$
declare
  p_id uuid;
begin
  if (tg_op = 'DELETE') then p_id = old.product_id;
  else p_id = new.product_id;
  end if;

  update public.products
  set 
    avg_rating = (select coalesce(avg(rating), 0) from public.product_reviews where product_id = p_id and status = 'published'),
    review_count = (select count(*) from public.product_reviews where product_id = p_id and status = 'published'),
    rating_distribution = (
      select jsonb_object_agg(rating::text, count)
      from (
        select rating, count(*) as count
        from public.product_reviews
        where product_id = p_id and status = 'published'
        group by rating
      ) t
    )
  where id = p_id;

  return null;
end;
$$;

drop trigger if exists on_review_changed on public.product_reviews;
create trigger on_review_changed
after insert or update or delete on public.product_reviews
for each row execute function public.update_product_review_aggregates();

-- trigger function for helpful counts
create or replace function public.update_review_vote_counts()
returns trigger
language plpgsql
security definer
as $$
declare
  r_id uuid;
begin
  if (tg_op = 'DELETE') then r_id = old.review_id;
  else r_id = new.review_id;
  end if;

  update public.product_reviews
  set 
    helpful_count = (select count(*) from public.review_votes where review_id = r_id and vote_type = 'helpful'),
    unhelpful_count = (select count(*) from public.review_votes where review_id = r_id and vote_type = 'unhelpful')
  where id = r_id;

  return null;
end;
$$;

drop trigger if exists on_vote_changed on public.review_votes;
create trigger on_vote_changed
after insert or update or delete on public.review_votes
for each row execute function public.update_review_vote_counts();

-- Create table for reporting abusive reviews
create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

alter table public.review_reports enable row level security;

-- Enable Realtime for reviews and votes

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
  constraint support_cases_status_check check (status in ('open', 'waiting_for_vendor', 'waiting_for_customer', 'under_review', 'escalated', 'resolved', 'closed'))
);

-- =====================================================
-- 13.0.1 SUPPORT CASE ACTIVITIES (Timeline)
-- =====================================================
create table if not exists public.support_case_activities (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.support_cases(id) on delete cascade,
  type text not null,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists support_case_activities_case_id_idx on public.support_case_activities(case_id);
alter table public.support_case_activities enable row level security;


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
  attachments jsonb not null default '[]'::jsonb,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  constraint support_case_messages_sender_role_check check (sender_role in ('customer', 'vendor', 'admin'))
);

create index if not exists support_case_messages_case_id_idx on public.support_case_messages(case_id);

-- =====================================================
-- 13.1 USER ADDRESSES
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

alter table public.user_addresses enable row level security;

-- =====================================================
-- 13.2 WISHLISTS
-- =====================================================
create table if not exists public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlists enable row level security;

-- =====================================================
-- 13.3 NOTIFICATIONS
-- =====================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- =====================================================
-- 13.4 PAYMENT METHODS
-- =====================================================
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  provider text,
  last4 text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

-- =====================================================
-- 13.5 ACCOUNT ACTIVITIES
-- =====================================================
create table if not exists public.account_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  description text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.account_activities enable row level security;

-- =====================================================
-- 13.6 KNOWLEDGE BASE (SUPPORT ARTICLES)
-- =====================================================
create table if not exists public.support_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  category text not null,
  tags text[] default '{}',
  is_published boolean not null default true,
  view_count integer not null default 0,
  helpful_count integer not null default 0,
  unhelpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Full-text search index for search functionality
alter table public.support_articles add column if not exists fts tsvector generated always as (to_tsvector('english', title || ' ' || content || ' ' || category)) stored;
create index if not exists support_articles_fts_idx on public.support_articles using gin(fts);

alter table public.support_articles enable row level security;

-- =====================================================
-- 13.7 SUPPORT FEEDBACK (CSAT)
-- =====================================================
create table if not exists public.support_feedback (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.support_cases(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.support_feedback enable row level security;

-- =====================================================
-- 13.8 VENDOR DISPUTES / CASES
-- =====================================================
create table if not exists public.vendor_cases (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.support_cases(id) on delete cascade,
  vendor_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  vendor_response text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_cases_status_check check (status in ('pending', 'responded', 'escalated', 'resolved'))
);

alter table public.vendor_cases enable row level security;

-- =====================================================
-- 13.9 SUPPORT AGENTS
-- =====================================================
create table if not exists public.support_agents (
  id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null,
  status text not null default 'offline', -- online, busy, offline
  active_cases_count integer not null default 0,
  max_cases_capacity integer not null default 10,
  rating numeric(3,2) default 5.0,
  last_assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_agents_status_check check (status in ('online', 'busy', 'offline'))
);

alter table public.support_agents enable row level security;

-- =====================================================
-- 13.10 SUPPORT CONVERSATIONS (LIVE CHAT)
-- =====================================================
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.support_agents(id) on delete set null,
  status text not null default 'active', -- active, closed, pending_ai, waiting_agent
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_conversations_status_check check (status in ('active', 'closed', 'pending_ai', 'waiting_agent'))
);

alter table public.support_conversations enable row level security;


-- =====================================================
-- 14. STORAGE BUCKET
-- =====================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = true;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = true;

insert into storage.buckets (id, name, public)
values ('support-evidence', 'support-evidence', true)
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

drop policy if exists "Participants can view case activities" on public.support_case_activities;

drop policy if exists "Anyone can view categories" on public.categories;
drop policy if exists "Admins can manage categories" on public.categories;

drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Authenticated users can insert own products" on public.products;
drop policy if exists "Authenticated users can update own products" on public.products;
drop policy if exists "Authenticated users can delete own products" on public.products;
drop policy if exists "Admins can manage all products" on public.products;

drop policy if exists "Anyone can view product images" on public.product_images;
drop policy if exists "Vendors can manage own product images" on public.product_images;
drop policy if exists "Admins can manage all product images" on public.product_images;

drop policy if exists "Users can manage own addresses" on public.user_addresses;
drop policy if exists "Users can manage own wishlist" on public.wishlists;
drop policy if exists "Users can manage own notifications" on public.notifications;
drop policy if exists "Users can manage own payment methods" on public.payment_methods;
drop policy if exists "Users can view own activities" on public.account_activities;

drop policy if exists "Anyone can view review votes" on public.review_votes;
drop policy if exists "Authenticated users can vote" on public.review_votes;
drop policy if exists "Users can delete own votes" on public.review_votes;

drop policy if exists "Admins can view reports" on public.review_reports;
drop policy if exists "Authenticated users can report" on public.review_reports;

drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;

-- Support ecosystem drops
drop policy if exists "Anyone can view published articles" on public.support_articles;
drop policy if exists "Admins can manage articles" on public.support_articles;
drop policy if exists "Customers can manage own feedback" on public.support_feedback;
drop policy if exists "Admins can view feedback" on public.support_feedback;
drop policy if exists "Vendors can view own cases" on public.vendor_cases;
drop policy if exists "Vendors can update own cases" on public.vendor_cases;
drop policy if exists "Admins can manage vendor cases" on public.vendor_cases;
drop policy if exists "Users can view own conversations" on public.support_conversations;
drop policy if exists "Agents can manage conversations" on public.support_conversations;

-- Support Agent drops
drop policy if exists "Everyone can view online agents" on public.support_agents;
drop policy if exists "Admins can manage agents" on public.support_agents;

-- Support Case drops
drop policy if exists "Participants can view support cases" on public.support_cases;
drop policy if exists "Customers can create support cases" on public.support_cases;
drop policy if exists "Vendors and admins can update support cases" on public.support_cases;
drop policy if exists "Participants can view case messages" on public.support_case_messages;
drop policy if exists "Participants can create case messages" on public.support_case_messages;
drop policy if exists "Participants can view case activities" on public.support_case_activities;

-- Storage drops
drop policy if exists "Public can view support evidence" on storage.objects;
drop policy if exists "Authenticated users can upload support evidence" on storage.objects;
drop policy if exists "Public can view avatars" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;

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
-- 19. SUPPORT ECOSYSTEM POLICIES
-- =====================================================

-- Support Articles (KB)
create policy "Anyone can view published articles"
on public.support_articles for select
using (is_published = true);

create policy "Admins can manage articles"
on public.support_articles for all
using (public.is_admin())
with check (public.is_admin());

-- Support Feedback (CSAT)
create policy "Customers can manage own feedback"
on public.support_feedback for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins can view feedback"
on public.support_feedback for select
using (public.is_admin());

-- Vendor Cases
create policy "Vendors can view own cases"
on public.vendor_cases for select
using (auth.uid() = vendor_id);

create policy "Vendors can update own cases"
on public.vendor_cases for update
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);

create policy "Admins can manage vendor cases"
on public.vendor_cases for all
using (public.is_admin())
with check (public.is_admin());

-- Support Conversations
create policy "Users can view own conversations"
on public.support_conversations for select
using (auth.uid() = customer_id);

create policy "Agents can manage conversations"
on public.support_conversations for all
using (public.is_admin() or auth.uid() = agent_id);

-- Support Agents
create policy "Everyone can view online agents"
on public.support_agents for select
using (true);

create policy "Admins can manage agents"
on public.support_agents for all
using (public.is_admin())
with check (public.is_admin());

-- Support Cases
create policy "Participants can view support cases"
on public.support_cases for select
using (auth.uid() = customer_id or auth.uid() = vendor_id or public.is_admin());

create policy "Customers can create support cases"
on public.support_cases for insert
with check (auth.uid() = customer_id);

create policy "Vendors and admins can update support cases"
on public.support_cases for update
using (auth.uid() = vendor_id or public.is_admin())
with check (auth.uid() = vendor_id or public.is_admin());

-- Support Case Messages
create policy "Participants can view case messages"
on public.support_case_messages for select
using (
  exists (
    select 1 from public.support_cases
    where id = support_case_messages.case_id
    and (customer_id = auth.uid() or vendor_id = auth.uid() or public.is_admin())
  )
);

create policy "Participants can create case messages"
on public.support_case_messages for insert
with check (
  exists (
    select 1 from public.support_cases
    where id = support_case_messages.case_id
    and (customer_id = auth.uid() or vendor_id = auth.uid() or public.is_admin())
  )
);

-- Support Case Activities
create policy "Participants can view case activities"
on public.support_case_activities for select
using (
  exists (
    select 1 from public.support_cases
    where id = support_case_activities.case_id
    and (customer_id = auth.uid() or vendor_id = auth.uid() or public.is_admin())
  )
);

-- =====================================================
-- 20. SEED DATA: SUPPORT ARTICLES
-- =====================================================
insert into public.support_articles (title, slug, content, category, tags)
values
  ('How to Track Your Order', 'track-order', 'You can track your order by visiting the Accounts page and clicking on the Orders tab. Each order-item provides live shipment updates and tracking numbers where available.', 'Shipping', '{shipping, tracking, orders}'),
  ('Return and Refund Policy', 'return-refund-policy', 'Aura provides a trust-backed return policy. If an item is damaged or not as described, you can open a support case through the Customer Care workspace within 7 days of delivery.', 'Refunds', '{refunds, returns, policy}'),
  ('Contacting a Seller', 'contact-seller', 'For product-specific questions, use the "Ask a Question" feature on the product page. For order issues, open a support case which will notify the vendor directly.', 'Communication', '{vendors, contact, help}'),
  ('Aura Protection for Customers', 'aura-protection', 'Our protection plan ensures that your payments are held securely until delivery is confirmed. We moderate disputes to ensure both customers and vendors are treated fairly.', 'Security', '{security, trust, protection}')
on conflict (slug) do nothing;


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
-- 19.1 ADDRESSES / WISHLIST / NOTIFICATIONS
-- =====================================================
create policy "Users can manage own addresses"
on public.user_addresses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own wishlist"
on public.wishlists
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own notifications"
on public.notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own payment methods"
on public.payment_methods
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can view own activities"
on public.account_activities
for select
using (auth.uid() = user_id);

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
-- 22.1 REVIEW VOTES AND REPORTS
-- =====================================================
create policy "Anyone can view review votes"
on public.review_votes
for select
using (true);

create policy "Authenticated users can vote"
on public.review_votes
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own votes"
on public.review_votes
for delete
using (auth.uid() = user_id);

create policy "Admins can view reports"
on public.review_reports
for select
using (public.is_admin());

create policy "Authenticated users can report"
on public.review_reports
for insert
with check (auth.uid() = reporter_id);


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

-- Support Evidence Policies
create policy "Public can view support evidence"
on storage.objects for select
using (bucket_id = 'support-evidence');

create policy "Authenticated users can upload support evidence"
on storage.objects for insert
with check (
  bucket_id = 'support-evidence'
  and auth.role() = 'authenticated'
);

-- Avatar Policies
create policy "Public can view avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);

-- =====================================================
-- ADMIN PROMOTION (Helper)
-- =====================================================
do $$
begin
  -- Update auth.users metadata
  update auth.users 
  set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}' 
  where email = 'varunud96@gmail.com';

  -- Update public.profiles role
  update public.profiles 
  set role = 'admin' 
  where email = 'varunud96@gmail.com';
end $$;

-- =====================================================
-- 26. ENABLE REALTIME
-- =====================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.product_reviews;
alter publication supabase_realtime add table public.review_votes;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.support_case_messages;
alter publication supabase_realtime add table public.support_conversations;

-- =====================================================
-- 27. VERIFY
-- =====================================================
select id, email, role from public.profiles order by created_at desc;
select id, user_id, store_name, business_category, status from public.vendors order by created_at desc;
select id, title, vendor_id, category_id from public.products order by created_at desc;
select id, name, slug from public.categories order by name;
select id, name, public from storage.buckets where id = 'product-images';

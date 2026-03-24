-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null default '',
  full_name text not null default '',
  avatar_url text,
  role text not null default 'buyer'
    check (role in ('buyer', 'seller', 'admin')),
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public user profiles, one per auth.users row';

-- ============================================================
-- Helper: check if the current user is an admin
-- Must be created after profiles table exists
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Categories
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,               -- icon identifier (e.g. Tabler icon name)
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'Product categories with optional hierarchy';

create index idx_categories_slug on public.categories(slug);
create index idx_categories_parent on public.categories(parent_id);

-- ============================================================
-- Products
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) not null,
  title text not null,
  description text not null default '',
  price numeric(10,2) not null default 0
    check (price >= 0),
  images text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'inactive', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Marketplace product/service listings';

-- B-tree indexes for filtering & joins
create index idx_products_seller on public.products(seller_id);
create index idx_products_category on public.products(category_id);
create index idx_products_status on public.products(status);
create index idx_products_price on public.products(price);
create index idx_products_created on public.products(created_at desc);

-- Composite index: active products sorted by newest (the most common query)
create index idx_products_active_recent
  on public.products(status, created_at desc)
  where status = 'active';

-- Full-text search index on title + description
alter table public.products
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index idx_products_search on public.products using gin(search_vector);

-- GIN index on tags array for @> (contains) queries
create index idx_products_tags on public.products using gin(tags);

-- ============================================================
-- Orders
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  message text,
  total_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is 'Purchase/request records between buyers and sellers';

create index idx_orders_buyer on public.orders(buyer_id);
create index idx_orders_seller on public.orders(seller_id);
create index idx_orders_product on public.orders(product_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created on public.orders(created_at desc);

-- ============================================================
-- Auto-update updated_at timestamps
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- ---------- Profiles ----------

-- Anyone (including anon) can read profiles
create policy "profiles.select: public read"
  on public.profiles for select
  using (true);

-- Users can update their own profile
create policy "profiles.update: own"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can update any profile (e.g. change roles)
create policy "profiles.update: admin"
  on public.profiles for update
  using (public.is_admin());

-- ---------- Categories ----------

-- Anyone can read categories
create policy "categories.select: public read"
  on public.categories for select
  using (true);

-- Only admins can manage categories
create policy "categories.insert: admin"
  on public.categories for insert
  with check (public.is_admin());

create policy "categories.update: admin"
  on public.categories for update
  using (public.is_admin());

create policy "categories.delete: admin"
  on public.categories for delete
  using (public.is_admin());

-- ---------- Products ----------

-- Anyone can see active products; sellers see their own (any status); admins see all
create policy "products.select: active or own or admin"
  on public.products for select
  using (
    status = 'active'
    or seller_id = auth.uid()
    or public.is_admin()
  );

-- Authenticated users can create products (must be the seller)
create policy "products.insert: authenticated as seller"
  on public.products for insert
  with check (
    auth.uid() = seller_id
  );

-- Only the seller can update their own products; admins can update any
create policy "products.update: own or admin"
  on public.products for update
  using (
    auth.uid() = seller_id
    or public.is_admin()
  );

-- Only the seller can delete their own products; admins can delete any
create policy "products.delete: own or admin"
  on public.products for delete
  using (
    auth.uid() = seller_id
    or public.is_admin()
  );

-- ---------- Orders ----------

-- Users see orders where they are buyer or seller; admins see all
create policy "orders.select: own or admin"
  on public.orders for select
  using (
    auth.uid() = buyer_id
    or auth.uid() = seller_id
    or public.is_admin()
  );

-- Authenticated users can create orders (must be the buyer)
create policy "orders.insert: authenticated as buyer"
  on public.orders for insert
  with check (
    auth.uid() = buyer_id
  );

-- Buyer or seller can update order status; admins can update any
create policy "orders.update: participant or admin"
  on public.orders for update
  using (
    auth.uid() = buyer_id
    or auth.uid() = seller_id
    or public.is_admin()
  );

-- ============================================================
-- Seed default categories
-- ============================================================
insert into public.categories (name, slug, description, icon) values
  ('Electronics',     'electronics',     'Electronic devices and gadgets',        'IconDevices'),
  ('Software',        'software',        'Software licenses and subscriptions',   'IconCode'),
  ('Services',        'services',        'Professional services',                 'IconBriefcase'),
  ('Office Supplies', 'office-supplies', 'Office equipment and supplies',         'IconPencil'),
  ('Training',        'training',        'Training courses and materials',        'IconSchool'),
  ('Other',           'other',           'Miscellaneous items',                   'IconDots');

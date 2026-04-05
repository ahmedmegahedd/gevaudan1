-- ============================================================
-- LUXE STORE — Generic E-Commerce Schema
-- White-label template: swap storeConfig to reuse for any client
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- PROFILES (admin users only — linked to Supabase Auth)
-- ────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

-- Auto-create profile row when an auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- CATEGORIES
-- ────────────────────────────────────────────────────────────
create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- PRODUCTS
-- ────────────────────────────────────────────────────────────
create table public.products (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  price       numeric(10, 2) not null check (price >= 0),
  images      text[] not null default '{}',
  category_id uuid references public.categories(id) on delete set null,
  -- variants: generic key→values map, e.g. {"size": ["S","M","L"], "color": ["Black","White"]}
  variants    jsonb not null default '{}',
  stock       integer not null default 0 check (stock >= 0),
  is_active   boolean not null default true,
  is_featured boolean not null default false,
  created_at  timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_is_active_idx   on public.products(is_active);
create index products_is_featured_idx on public.products(is_featured);

-- ────────────────────────────────────────────────────────────
-- ORDERS (guest checkout — no user account needed)
-- ────────────────────────────────────────────────────────────
create table public.orders (
  id               uuid primary key default uuid_generate_v4(),
  -- { name: string, phone: string }
  customer_info    jsonb not null,
  -- { city: string, address: string, notes?: string }
  delivery_address jsonb not null,
  -- Array of { product_id, name, price, quantity, variant?: Record<string,string> }
  items            jsonb not null,
  subtotal         numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee     numeric(10, 2) not null check (delivery_fee >= 0),
  total            numeric(10, 2) not null check (total >= 0),
  status           text not null default 'pending'
                     check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  created_at       timestamptz not null default now()
);

create index orders_status_idx     on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES: only admins can read/write their own profile
create policy "Admin can manage own profile"
  on public.profiles for all
  using (public.is_admin() and id = auth.uid())
  with check (public.is_admin() and id = auth.uid());

-- CATEGORIES: public read; admin full access
create policy "Public read categories"
  on public.categories for select
  using (true);

create policy "Admin manages categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- PRODUCTS: public read active products; admin full access
create policy "Public read active products"
  on public.products for select
  using (is_active = true);

create policy "Admin manages products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ORDERS: anyone can insert (guest checkout); only admin can select/update/delete
create policy "Anyone can place an order"
  on public.orders for insert
  with check (true);

create policy "Admin manages orders"
  on public.orders for select
  using (public.is_admin());

create policy "Admin updates orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin deletes orders"
  on public.orders for delete
  using (public.is_admin());

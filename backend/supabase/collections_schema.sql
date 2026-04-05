-- ============================================================
-- COLLECTIONS — run this in Supabase SQL Editor
-- after the main schema.sql has been applied
-- ============================================================

-- Collections table
create table public.collections (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  description   text,
  cover_image   text,
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index collections_display_order_idx on public.collections(display_order);

-- Junction: products in a collection with ordering
create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  display_order integer not null default 0,
  primary key (collection_id, product_id)
);

create index collection_products_collection_idx on public.collection_products(collection_id);

-- RLS
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;

-- Public: only active collections visible
create policy "Public read active collections"
  on public.collections for select
  using (is_active = true);

-- Admin: full access (is_admin() checks profiles table for role='admin')
create policy "Admin manages collections"
  on public.collections for all
  using (public.is_admin())
  with check (public.is_admin());

-- Collection products: public can read (to show products in collection)
create policy "Public read collection products"
  on public.collection_products for select
  using (true);

-- Admin: full access to junction table
create policy "Admin manages collection products"
  on public.collection_products for all
  using (public.is_admin())
  with check (public.is_admin());

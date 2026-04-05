-- ============================================================
-- LUXE STORE — Seed Data
-- Run this AFTER schema.sql to populate the store with sample data
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- CATEGORIES
-- ────────────────────────────────────────────────────────────
insert into public.categories (name, slug, is_active) values
  ('Dresses',     'dresses',     true),
  ('Tops',        'tops',        true),
  ('Bottoms',     'bottoms',     true),
  ('Accessories', 'accessories', true);

-- ────────────────────────────────────────────────────────────
-- PRODUCTS (3 sample products — update image URLs before going live)
-- ────────────────────────────────────────────────────────────

-- Product 1: Silk Evening Dress (Dresses category)
insert into public.products (
  name, slug, description, price, images, category_id,
  variants, stock, is_active, is_featured
)
select
  'Silk Evening Dress',
  'silk-evening-dress',
  'An elegant silk evening dress with a flowing silhouette. Perfect for special occasions and formal events.',
  1200.00,
  array[
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800'
  ],
  c.id,
  '{"size": ["XS", "S", "M", "L", "XL"], "color": ["Black", "Ivory", "Navy"]}',
  25,
  true,
  true
from public.categories c where c.slug = 'dresses';

-- Product 2: Linen Crop Top (Tops category)
insert into public.products (
  name, slug, description, price, images, category_id,
  variants, stock, is_active, is_featured
)
select
  'Linen Crop Top',
  'linen-crop-top',
  'A lightweight linen crop top with a relaxed fit. Effortlessly stylish for everyday wear.',
  350.00,
  array[
    'https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=800',
    'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800'
  ],
  c.id,
  '{"size": ["XS", "S", "M", "L", "XL"], "color": ["White", "Beige", "Black"]}',
  40,
  true,
  true
from public.categories c where c.slug = 'tops';

-- Product 3: Gold Chain Necklace (Accessories category)
insert into public.products (
  name, slug, description, price, images, category_id,
  variants, stock, is_active, is_featured
)
select
  'Gold Chain Necklace',
  'gold-chain-necklace',
  'A delicate 18k gold-plated chain necklace. Minimalist design that pairs beautifully with any outfit.',
  480.00,
  array[
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'
  ],
  c.id,
  '{"length": ["40cm", "45cm", "50cm"]}',
  60,
  true,
  true
from public.categories c where c.slug = 'accessories';

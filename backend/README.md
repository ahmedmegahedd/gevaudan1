# Backend — Supabase Setup Guide

This directory contains all database configuration for Luxe Store.

## Directory Structure

```
backend/
├── supabase/
│   └── schema.sql     # Full database schema with RLS policies
└── seed/
    └── seed.sql       # Sample categories and products for first run
```

---

## Step-by-Step Supabase Setup

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name, password, and region
3. Wait for the project to be provisioned (~2 minutes)

### Step 2 — Run the schema

1. In your Supabase dashboard → **SQL Editor** → **New query**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

This creates:
- `profiles` — admin users linked to Supabase Auth
- `categories` — product categories with slugs
- `products` — products with JSONB variants, images array, and full inventory fields
- `orders` — guest orders (no customer login required)
- All Row Level Security (RLS) policies
- A trigger to auto-create a profile when an auth user is created

### Step 3 — Seed sample data (optional but recommended)

1. In **SQL Editor** → **New query**
2. Paste the contents of `seed/seed.sql`
3. Click **Run**

This inserts:
- 4 categories: Dresses, Tops, Bottoms, Accessories
- 3 sample products with placeholder Unsplash images

> **Note:** Replace the Unsplash image URLs with your actual product images before going live. You can do this from the Admin panel at `/admin/products`.

### Step 4 — Create the admin user

1. Supabase dashboard → **Authentication** → **Users** → **Add user**
2. Enter admin email and a strong password
3. Copy the user's UUID from the Users list
4. In **SQL Editor**, run:

```sql
insert into public.profiles (id, full_name, role)
values ('<paste-user-uuid-here>', 'Admin Name', 'admin');
```

The admin login page is at `/admin/login`. Customers never see any login UI.

### Step 5 — Create the storage bucket

1. Supabase dashboard → **Storage** → **New bucket**
2. **Bucket name:** `product-images`
3. Set visibility to **Public**
4. Under **Allowed MIME types**, add:
   - `image/jpeg`
   - `image/png`
   - `image/webp`
5. Set **Max upload size** to `5 MB`

### Step 6 — Get your API keys

From your Supabase dashboard → **Settings** → **API**:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret!) |

Copy these into `frontend/.env.local`.

---

## Environment Variables

Create `frontend/.env.local` from `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

> **Warning:** Never commit `.env.local` to version control. `SUPABASE_SERVICE_ROLE_KEY` has full database access and must be kept secret.

---

## Database Schema Overview

### `profiles`
Admin users only. Linked 1:1 to Supabase Auth users. The `role` field must be `'admin'` to access the admin panel.

### `categories`
Product categories with a URL-safe `slug`. Used for filtering in the shop.

### `products`
Full product catalog. Key fields:
- `images` — text array of public URLs (from Supabase Storage)
- `variants` — JSONB map, e.g. `{"size": ["S","M","L"], "color": ["Black","White"]}`
- `is_active` — controls visibility in the shop
- `is_featured` — shows on homepage

### `orders`
Guest checkout orders. No customer account needed.
- `customer_info` — `{name, phone}`
- `delivery_address` — `{city, address, notes?}`
- `items` — array of `{product_id, name, price, quantity, variant?}`
- `status` — `pending | confirmed | delivered | cancelled`

### RLS Policies Summary
| Table | Public | Admin |
|-------|--------|-------|
| `profiles` | — | Read/Write own row |
| `categories` | Read | Full access |
| `products` | Read active | Full access |
| `orders` | Insert (guest checkout) | Read/Update/Delete |

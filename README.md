# Luxe Store — White-Label E-Commerce Template

A production-ready Next.js 14 e-commerce template built for rapid client deployment. Swap one config file to rebrand the entire store.

## Monorepo Structure

```
luxe-store/
├── frontend/          # Next.js app (everything the browser sees)
└── backend/           # Supabase config, schema, and seed data
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **Styling:** Tailwind CSS + CSS custom properties
- **State:** Zustand (cart + toasts)
- **Forms:** React Hook Form + Zod
- **Fonts:** next/font/google

---

## Quick Start

### 1. Set up the backend

See [`backend/README.md`](backend/README.md) for complete Supabase setup instructions:
1. Create a Supabase project
2. Run `backend/supabase/schema.sql`
3. Run `backend/seed/seed.sql` (optional sample data)
4. Create admin user
5. Create `product-images` storage bucket

### 2. Set up the frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in your Supabase keys in .env.local
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).
Admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## White-Label Client Onboarding Checklist

When deploying for a new client, work through this checklist top to bottom:

### Brand & Config
- [ ] Edit `frontend/src/config/store.config.ts`:
  - [ ] `brand.name` — client's brand name
  - [ ] `brand.tagline` — tagline shown on hero and meta
  - [ ] `brand.whatsapp` — WhatsApp number for order confirmations
  - [ ] `brand.logo` — path to logo file in `frontend/public/`
  - [ ] `contact.email` — contact email shown in footer
  - [ ] `contact.instagram` — Instagram handle (with `@`)
  - [ ] `contact.facebook` — Facebook page name
  - [ ] `theme.primaryColor` — main brand color (hex)
  - [ ] `theme.accentColor` — accent / highlight color (hex)
  - [ ] `theme.fontHeading` — Google Font name for headings
  - [ ] `theme.fontBody` — Google Font name for body text
  - [ ] `delivery.cities` — array of cities you deliver to
  - [ ] `delivery.fee` — delivery fee amount
  - [ ] `delivery.freeAbove` — order value for free delivery
  - [ ] `delivery.currency` — currency code (e.g. `"EGP"`, `"USD"`)
- [ ] If fonts changed: update font imports in `frontend/src/app/layout.tsx`
- [ ] Replace `frontend/public/logo.png` with the client's logo

### Supabase (new project per client)
- [ ] Create a new Supabase project
- [ ] Run `backend/supabase/schema.sql` in SQL Editor
- [ ] Run `backend/seed/seed.sql` for sample data (optional)
- [ ] Create admin user in Authentication → Users
- [ ] Insert admin profile:
  ```sql
  insert into public.profiles (id, full_name, role)
  values ('<user-uuid>', 'Admin Name', 'admin');
  ```
- [ ] Create `product-images` storage bucket (public, 5MB limit)

### Environment
- [ ] Create `frontend/.env.local` from `frontend/.env.example`
- [ ] Fill in `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Fill in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Fill in `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain

### Products & Content
- [ ] Log in to `/admin` and add product categories
- [ ] Add products with images, prices, and variants
- [ ] Mark hero products as **Featured** to show on homepage

### Deployment (Vercel)
- [ ] Push to GitHub
- [ ] Connect repo in Vercel dashboard
- [ ] Set root directory to `frontend`
- [ ] Add all environment variables from `.env.local`
- [ ] Deploy

**Total time to deploy a new client: ~15–20 minutes.**

---

## Architecture Notes

### White-Label Design
The core rule: no brand name, color, font, price, or city is ever hardcoded in any component. Every value flows from `storeConfig`. Components read CSS variables (`var(--color-primary)`, `var(--font-heading)`) injected at runtime from `storeConfig.theme`.

### Guest-Only Customer Flow
Customers never create accounts or log in. The entire purchase flow is:
```
/ → /shop → /shop/[slug] → /cart → /checkout → /order-confirmation/[id]
```
Orders are identified by customer name + phone only. Payment is cash on delivery. The admin calls to confirm.

### Route Groups
The `(shop)` route group wraps all customer-facing pages (homepage, shop, cart, checkout, order-confirmation). This keeps them organizationally separate from `/admin` routes without affecting URLs.

### Admin Section
- Protected at both middleware level and layout level
- Auth check: Supabase session + `profiles.role = 'admin'`
- Login page: `/admin/login`
- Products: full CRUD with image upload (max 5 images, 5MB each)
- Orders: inline status updates with real-time toast feedback

### Order Statuses
| Status | Meaning |
|--------|---------|
| `pending` | Just placed, not yet reviewed |
| `confirmed` | Admin called and confirmed |
| `delivered` | Order delivered to customer |
| `cancelled` | Cancelled for any reason |

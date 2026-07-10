# GemOps production deploy checklist

Use this when standing up or updating the Supabase project behind [gemops.vercel.app](https://gemops.vercel.app).

## 1. Vercel environment variables

Set in **Project → Settings → Environment Variables**:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key from Supabase |
| `NEXT_PUBLIC_STORE_NAME` | Your store name (e.g. `GemOps`) |
| `NEXT_PUBLIC_STORE_TAGLINE` | Tagline on hub + customizer |
| `NEXT_PUBLIC_APP_URL` | `https://gemops.vercel.app` |

Redeploy after changing env vars.

## 2. Supabase SQL migrations (existing project)

Run **once**, in order, in the Supabase **SQL Editor**.  
Do **not** re-run full `schema.sql` on a live database.

1. **`supabase/schema.sql`** — only on a **brand-new** project (creates tables, seed rows, RLS).
2. **`supabase/product-templates.sql`** — bracelet/anklet/necklace layouts, length options, hide dog collar in customizer.
3. **`supabase/bracelet-template.sql`** — bracelet template row if missing.
4. **`supabase/ar-metadata.sql`** — `orders.sizing_metadata` JSONB column.
5. **`supabase/seed-prices.sql`** — `unit_cost_cents` on seed components.
6. **`supabase/phase5-payments.sql`** — payment columns on orders (if not already applied).
7. **`supabase/admin-policies.sql`** — staff RLS policies (if using authenticated `/pos` and `/admin`).

## 3. Staff login

1. Supabase → **Authentication → Users → Add user** (email + password).
2. Visit `/login`, then `/pos` and `/admin`.

Without Supabase env vars, the app runs in **dev mode** (in-memory orders, no login).

## 4. Demo rehearsal (Faisal pilot)

Three surfaces, one order:

| Device | URL | Role |
|--------|-----|------|
| Phone | `/customize` | Customer designs + finalizes |
| Laptop | `/pos` | Cashier marks paid |
| Laptop | `/admin` | Studio assembly script + print |

Single-device walkthrough: `/demo`.

## 5. Cache

After deploy, use a hard refresh or incognito if the customizer looks stale (old jewelry types or missing controls).

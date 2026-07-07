# GemOps

B2B2C phygital jewelry configurator — MVP Iteration 1.

## Stack

- **Next.js 15** (App Router)
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL + Realtime)
- **@splinetool/react-spline** (3D placeholder sphere)

## Directory Structure

```
GemOps/
├── supabase/
│   └── schema.sql              # Flexible components + templates + orders schema
├── src/
│   ├── app/
│   │   ├── api/orders/         # Order create + status updates
│   │   ├── customize/          # View 1: Customer Customizer (mobile-first)
│   │   ├── pos/                # View 2: Retailer POS
│   │   ├── admin/              # View 3: GemOps Admin
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx            # Workspace launcher
│   ├── components/
│   │   └── customizer/         # Spline viewer, slot strip, palette, checkout
│   ├── lib/
│   │   ├── constants.ts        # Seed data, order code, assembly script
│   │   └── supabase/           # Browser + server clients
│   └── types/
│       ├── database.ts         # Domain types
│       └── supabase.ts         # Generated-style DB types
├── .env.example
└── package.json
```

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add your Supabase URL + anon key (optional for local UI dev)
npm run dev
```

Open [http://localhost:3000/customize](http://localhost:3000/customize)

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy project URL + anon key into `.env.local`

The customizer works **without** Supabase using in-memory seed data. Orders persist once Supabase is configured.

## Views

| Route | Role | Status |
|-------|------|--------|
| `/customize` | Customer | ✅ MVP complete |
| `/pos` | Retailer cashier | ✅ Live queue |
| `/admin` | Studio logistics | ✅ Assembly script + component CRUD |

## Architecture Notes

- **`components`** table (not `beads`) with `component_type` + `configuration_rules` JSONB
- **`design_templates`** define slot counts and future per-slot behavior rules
- **`orders.slot_layout`** stores a frozen JSON snapshot at finalize time
- Assembly script: `START -> 5x Onyx -> 1x Spacer -> END`

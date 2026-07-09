-- GemOps MVP Schema
-- Flexible component architecture for beads today, horology & mixed assemblies tomorrow.
-- Run in Supabase SQL Editor after creating your project.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Components (replaces a narrow "beads" table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.components (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  component_type  TEXT NOT NULL CHECK (
    component_type IN (
      'bead',
      'clasp',
      'spacer',
      'charm',
      'watch_case',
      'watch_dial',
      'watch_strap',
      'watch_movement'
    )
  ),
  sku             TEXT UNIQUE,
  display_color   TEXT NOT NULL DEFAULT '#9ca3af',
  spline_asset_url TEXT,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  -- Per-component rules: allowed pairings, size constraints, slot compatibility, etc.
  configuration_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_components_type ON public.components (component_type);
CREATE INDEX IF NOT EXISTS idx_components_active ON public.components (is_active) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Design Templates (slot layouts: Classic Strand, Double Strand, future watch builds)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.design_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  slot_count      INTEGER NOT NULL CHECK (slot_count > 0),
  -- Template-level slot behavior: fixed slots, allowed types per index, assembly order, etc.
  configuration_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Example configuration_rules shape:
-- {
--   "layout": "linear",
--   "slots": [
--     { "index": 0, "role": "clasp_anchor", "allowed_types": ["clasp"], "required": true },
--     { "index": 1, "role": "bead", "allowed_types": ["bead", "spacer"], "required": false }
--   ],
--   "assembly_direction": "left_to_right"
-- }

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code          TEXT UNIQUE NOT NULL,
  design_template_id  UUID NOT NULL REFERENCES public.design_templates(id),
  -- Frozen snapshot: [{ "slot_index": 0, "component_id": "...", "name": "Onyx", "type": "bead" }, ...]
  slot_layout         JSONB NOT NULL DEFAULT '[]'::jsonb,
  status              TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN ('pending_payment', 'paid', 'in_studio', 'completed', 'cancelled')
  ),
  assembly_script     TEXT,
  total_slot_count    INTEGER NOT NULL,
  filled_slot_count   INTEGER NOT NULL DEFAULT 0,
  total_cents         INTEGER NOT NULL DEFAULT 0,
  payment_method      TEXT CHECK (
    payment_method IS NULL OR payment_method IN ('cash', 'card', 'other')
  ),
  amount_paid_cents   INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at             TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders (order_code);

-- ---------------------------------------------------------------------------
-- Order code generator: e.g. LUNA-104
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  prefixes TEXT[] := ARRAY['LUNA', 'ONYX', 'JADE', 'RUBY', 'OPAL', 'PEARL'];
  prefix   TEXT;
  suffix   INTEGER;
  candidate TEXT;
BEGIN
  LOOP
    prefix := prefixes[1 + floor(random() * array_length(prefixes, 1))::int];
    suffix := 100 + floor(random() * 900)::int;
    candidate := prefix || '-' || suffix::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

-- ---------------------------------------------------------------------------
-- Assembly script builder (60-second bench recipe)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.build_assembly_script(p_layout JSONB)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  segments TEXT[] := ARRAY[]::TEXT[];
  current_name TEXT;
  current_count INTEGER := 0;
  item RECORD;
  result TEXT;
BEGIN
  FOR item IN
    SELECT
      elem->>'name' AS name
    FROM jsonb_array_elements(p_layout) AS elem
    WHERE elem->>'component_id' IS NOT NULL
    ORDER BY (elem->>'slot_index')::int
  LOOP
    IF current_name IS NULL THEN
      current_name := item.name;
      current_count := 1;
    ELSIF item.name = current_name THEN
      current_count := current_count + 1;
    ELSE
      segments := array_append(segments, current_count || 'x ' || current_name);
      current_name := item.name;
      current_count := 1;
    END IF;
  END LOOP;

  IF current_name IS NOT NULL THEN
    segments := array_append(segments, current_count || 'x ' || current_name);
  END IF;

  IF array_length(segments, 1) IS NULL THEN
    RETURN 'START -> (empty) -> END';
  END IF;

  result := 'START -> ' || array_to_string(segments, ' -> ') || ' -> END';
  RETURN result;
END;
$$;

-- ---------------------------------------------------------------------------
-- Auto-update timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_components_updated ON public.components;
CREATE TRIGGER trg_components_updated
  BEFORE UPDATE ON public.components
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (MVP: open read for catalog; service role for writes)
-- ---------------------------------------------------------------------------
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active components"
  ON public.components FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin read all components"
  ON public.components FOR SELECT
  USING (true);

CREATE POLICY "Public read active templates"
  ON public.design_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update order status"
  ON public.orders FOR UPDATE
  USING (true);

-- Admin CRUD on components (MVP: anon key; tighten with auth roles in production)
CREATE POLICY "Admin insert components"
  ON public.components FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update components"
  ON public.components FOR UPDATE
  USING (true);

CREATE POLICY "Admin delete components"
  ON public.components FOR DELETE
  USING (true);

-- ---------------------------------------------------------------------------
-- Realtime for POS / Admin queues
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ---------------------------------------------------------------------------
-- Seed: MVP beads + design templates
-- ---------------------------------------------------------------------------
INSERT INTO public.design_templates (name, slug, description, slot_count, configuration_rules)
VALUES
  (
    'Classic Strand',
    'classic-24',
    'Single-strand bracelet, 24 bead slots',
    24,
    '{
      "layout": "linear",
      "assembly_direction": "left_to_right",
      "slots": []
    }'::jsonb
  ),
  (
    'Double Strand',
    'double-48',
    'Double-strand bracelet, 48 bead slots',
    48,
    '{
      "layout": "linear",
      "assembly_direction": "left_to_right",
      "slots": []
    }'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.components (name, component_type, sku, display_color, unit_cost_cents, configuration_rules)
VALUES
  ('Onyx',       'bead', 'BD-ONYX',   '#1a1a1a',  800, '{"finish": "matte", "diameter_mm": 8}'::jsonb),
  ('Moonstone',  'bead', 'BD-MOON',   '#e8e4f0', 1200, '{"finish": "glow",  "diameter_mm": 8}'::jsonb),
  ('Rose Quartz','bead', 'BD-ROSE',   '#f4c2c2',  900, '{"finish": "polish","diameter_mm": 8}'::jsonb),
  ('Lapis',      'bead', 'BD-LAPIS',  '#1e3a5f', 1100, '{"finish": "polish","diameter_mm": 8}'::jsonb),
  ('Citrine',    'bead', 'BD-CITR',   '#e4a82a', 1000, '{"finish": "faceted","diameter_mm": 8}'::jsonb),
  ('Spacer',     'spacer','SP-GLD',   '#c9a962',  300, '{"finish": "metal", "diameter_mm": 4}'::jsonb),
  ('Gold Clasp', 'clasp', 'CL-GOLD',  '#c9a962', 1500, '{"finish": "metal", "role": "closure"}'::jsonb)
ON CONFLICT (sku) DO NOTHING;

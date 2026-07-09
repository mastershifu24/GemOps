-- AR / size-confidence metadata on orders (run once on existing DB)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sizing_metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN public.orders.sizing_metadata IS
  'Wrist/neck measurements, length choice, and AR preview flags for size confidence';

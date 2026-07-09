-- Phase 5: order totals + payment recording
-- Run in Supabase SQL Editor on existing projects

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_cents INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (
    payment_method IS NULL OR payment_method IN ('cash', 'card', 'other')
  );

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER;

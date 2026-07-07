-- Run this in Supabase SQL Editor if admin can't see inactive components.
-- Safe to re-run (drops policy first if it exists).

DROP POLICY IF EXISTS "Admin read all components" ON public.components;

CREATE POLICY "Admin read all components"
  ON public.components FOR SELECT
  USING (true);

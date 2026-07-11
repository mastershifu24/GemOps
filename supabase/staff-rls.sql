-- Staff-only order queue + component admin (run once on existing projects)
-- After this migration:
--   • Customers finalize via POST /api/orders (service role on server)
--   • Staff read/update orders via authenticated session (/pos, /admin)
--   • Catalog reads stay public for active rows (customizer)

-- Orders -------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update order status" ON public.orders;

CREATE POLICY "Staff read orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Components ---------------------------------------------------------------
DROP POLICY IF EXISTS "Admin read all components" ON public.components;
DROP POLICY IF EXISTS "Admin insert components" ON public.components;
DROP POLICY IF EXISTS "Admin update components" ON public.components;
DROP POLICY IF EXISTS "Admin delete components" ON public.components;

CREATE POLICY "Staff read all components"
  ON public.components FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff insert components"
  ON public.components FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff update components"
  ON public.components FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Staff delete components"
  ON public.components FOR DELETE
  TO authenticated
  USING (true);

-- Public read active components/templates policies are unchanged.

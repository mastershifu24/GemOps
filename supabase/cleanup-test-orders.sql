-- One-time cleanup for test / backlog orders (run in Supabase SQL Editor)

-- Option A: Clear studio queue only — marks paid orders as done (same as Admin "Clear queue")
UPDATE public.orders
SET
  status = 'completed',
  completed_at = COALESCE(completed_at, now()),
  updated_at = now()
WHERE status = 'in_studio';

-- Option B: Also drop abandoned checkout queue (never paid)
-- UPDATE public.orders
-- SET status = 'cancelled', updated_at = now()
-- WHERE status = 'pending_payment';

-- Option C: Nuclear — delete ALL orders (cannot undo)
-- DELETE FROM public.orders;

-- Verify studio queue is empty:
-- SELECT order_code, status, total_cents, created_at
-- FROM public.orders
-- WHERE status = 'in_studio'
-- ORDER BY created_at DESC;

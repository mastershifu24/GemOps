-- Seed bead prices (matches src/lib/constants.ts SEED_COMPONENTS)
-- Run on existing projects where components were inserted without unit_cost_cents

UPDATE public.components SET unit_cost_cents = 800  WHERE sku = 'BD-ONYX';
UPDATE public.components SET unit_cost_cents = 1200 WHERE sku = 'BD-MOON';
UPDATE public.components SET unit_cost_cents = 900  WHERE sku = 'BD-ROSE';
UPDATE public.components SET unit_cost_cents = 1100 WHERE sku = 'BD-LAPIS';
UPDATE public.components SET unit_cost_cents = 1000 WHERE sku = 'BD-CITR';
UPDATE public.components SET unit_cost_cents = 300  WHERE sku = 'SP-GLD';
UPDATE public.components SET unit_cost_cents = 1500 WHERE sku = 'CL-GOLD';

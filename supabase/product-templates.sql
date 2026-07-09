-- Product templates: bracelet, necklace, dog collar (+ size options)
-- Run in Supabase SQL Editor on existing projects

UPDATE public.design_templates
SET
  name = 'Bracelet',
  description = 'Circular wrist bracelet',
  configuration_rules = '{
    "layout": "radial",
    "product_type": "bracelet",
    "fill_mode": "sequential",
    "assembly_direction": "left_to_right",
    "length_options": [
      { "label": "5.5\"", "slot_count": 10, "description": "Petite" },
      { "label": "6\"", "slot_count": 12, "description": "XS" },
      { "label": "6.5\"", "slot_count": 14, "description": "Small" },
      { "label": "7\"", "slot_count": 16, "description": "Medium", "default": true },
      { "label": "7.5\"", "slot_count": 18, "description": "Large" },
      { "label": "8\"", "slot_count": 20, "description": "XL" },
      { "label": "8.5\"", "slot_count": 22, "description": "XXL" },
      { "label": "9\"", "slot_count": 24, "description": "Wide" }
    ],
    "slots": []
  }'::jsonb
WHERE slug = 'bracelet-16';

INSERT INTO public.design_templates (name, slug, description, slot_count, configuration_rules)
VALUES
  (
    'Necklace',
    'necklace-18',
    'Beaded necklace on an arc',
    18,
    '{
      "layout": "arc",
      "product_type": "necklace",
      "fill_mode": "sequential",
      "assembly_direction": "left_to_right",
      "length_options": [
        { "label": "14\"", "slot_count": 14, "description": "Choker" },
        { "label": "16\"", "slot_count": 16, "description": "Short" },
        { "label": "18\"", "slot_count": 18, "description": "Princess", "default": true },
        { "label": "20\"", "slot_count": 20, "description": "Matinee" },
        { "label": "22\"", "slot_count": 22, "description": "Opera" },
        { "label": "24\"", "slot_count": 24, "description": "Rope" }
      ],
      "slots": []
    }'::jsonb
  ),
  (
    'Dog Collar',
    'dog-collar-16',
    'Beaded dog collar band',
    16,
    '{
      "layout": "radial",
      "product_type": "dog_collar",
      "fill_mode": "sequential",
      "assembly_direction": "left_to_right",
      "length_options": [
        { "label": "10\"", "slot_count": 12, "description": "XS" },
        { "label": "12\"", "slot_count": 14, "description": "Small" },
        { "label": "14\"", "slot_count": 16, "description": "Medium", "default": true },
        { "label": "16\"", "slot_count": 18, "description": "Large" },
        { "label": "18\"", "slot_count": 20, "description": "XL" },
        { "label": "20\"", "slot_count": 22, "description": "XXL" }
      ],
      "slots": []
    }'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.design_templates (name, slug, description, slot_count, configuration_rules)
VALUES (
  'Anklet',
  'anklet-14',
  'Circular anklet',
  14,
  '{
    "layout": "radial",
    "product_type": "anklet",
    "fill_mode": "sequential",
    "assembly_direction": "left_to_right",
    "length_options": [
      { "label": "8\"", "slot_count": 10, "description": "Petite" },
      { "label": "8.5\"", "slot_count": 12, "description": "Small" },
      { "label": "9\"", "slot_count": 14, "description": "Medium", "default": true },
      { "label": "9.5\"", "slot_count": 16, "description": "Large" },
      { "label": "10\"", "slot_count": 18, "description": "XL" }
    ],
    "slots": []
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.design_templates
SET configuration_rules = configuration_rules || '{"product_type": "strand"}'::jsonb
WHERE slug IN ('classic-24', 'double-48');

UPDATE public.design_templates
SET
  configuration_rules = jsonb_set(
    configuration_rules,
    '{layout}',
    '"radial"'
  ) || '{"fill_mode": "sequential"}'::jsonb
WHERE slug = 'classic-24';

UPDATE public.design_templates
SET
  configuration_rules = jsonb_set(
    configuration_rules,
    '{layout}',
    '"layered"'
  ) || '{"fill_mode": "sequential"}'::jsonb
WHERE slug = 'double-48';

UPDATE public.design_templates
SET is_active = false
WHERE slug = 'dog-collar-16';

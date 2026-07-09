-- Wrist length presets for bracelet template
-- Run in Supabase SQL Editor if Wrist Bracelet already exists without length_options

UPDATE public.design_templates
SET configuration_rules = '{
  "layout": "radial",
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

-- If bracelet template does not exist yet, insert it:
INSERT INTO public.design_templates (name, slug, description, slot_count, configuration_rules)
VALUES (
  'Wrist Bracelet',
  'bracelet-16',
  'Circular wrist bracelet with adjustable length',
  16,
  '{
    "layout": "radial",
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
)
ON CONFLICT (slug) DO NOTHING;

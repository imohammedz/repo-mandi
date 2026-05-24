ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "asset_configuration" text NOT NULL DEFAULT 'Complete Vehicle',
  ADD COLUMN IF NOT EXISTS "trailer_manufacturer" text,
  ADD COLUMN IF NOT EXISTS "trailer_manufacturing_month_year" text;

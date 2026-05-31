ALTER TABLE "vehicle_media"
  ADD COLUMN IF NOT EXISTS "original_file_name" text NOT NULL DEFAULT '';

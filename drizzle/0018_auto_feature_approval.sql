ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "featured_at" timestamp,
  ADD COLUMN IF NOT EXISTS "featured_expires_at" timestamp,
  ADD COLUMN IF NOT EXISTS "featured_by" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vehicles_featured_by_users_id_fk'
  ) THEN
    ALTER TABLE "vehicles"
      ADD CONSTRAINT "vehicles_featured_by_users_id_fk"
      FOREIGN KEY ("featured_by") REFERENCES "public"."users"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

ALTER TABLE "feature_requests"
  ADD COLUMN IF NOT EXISTS "requested_at" timestamp DEFAULT now() NOT NULL;

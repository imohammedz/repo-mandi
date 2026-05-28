DO $$ BEGIN
 CREATE TYPE "public"."listing_mode" AS ENUM('NORMAL', 'BULK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."asset_structure" AS ENUM('STANDALONE', 'DETACHABLE', 'EQUIPMENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."detachable_type" AS ENUM('PRIME_MOVER', 'TRAILER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "listing_mode" "listing_mode" DEFAULT 'NORMAL' NOT NULL;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "asset_structure" "asset_structure";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "detachable_type" "detachable_type";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "asset_category" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "body_application_type" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "is_registered" boolean;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "bs_norm" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "transmission" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "axle_configuration" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "horsepower" integer;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "odometer_reading" integer;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "hour_meter_reading" integer;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "body_length" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "payload_capacity" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "body_attached" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "body_condition" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "machine_serial_number" text;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "battery_available" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "key_available" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "tyres_included" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "rims_discs_included" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "battery_included" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "cabin_available" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "engine_available" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "documents_available" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "remarks" text;

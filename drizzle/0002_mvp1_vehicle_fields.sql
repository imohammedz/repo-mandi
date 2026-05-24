DO $$ BEGIN
  CREATE TYPE "listing_type" AS ENUM ('REGULAR', 'REPO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "km_meter_status" AS ENUM ('WORKING', 'NOT_WORKING', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "running_condition" AS ENUM ('RUNNING', 'NOT_RUNNING', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "engine_condition" AS ENUM ('GOOD', 'AVERAGE', 'NEEDS_WORK', 'NOT_CHECKED', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "yes_no_unknown" AS ENUM ('YES', 'NO', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "road_safe_status" AS ENUM ('ROAD_SAFE', 'NOT_ROAD_SAFE', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "tyre_condition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'AROUND_50', 'POOR', 'MIXED', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "vehicle_media_type" AS ENUM ('PHOTO', 'VIDEO', 'DOCUMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "vehicle_media_category" AS ENUM ('FRONT', 'BACK', 'SIDE', 'INTERIOR', 'WALKAROUND', 'ENGINE_STARTUP', 'INSPECTION_REPORT', 'RC', 'INSURANCE', 'FITNESS', 'PERMIT', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "noc_status" AS ENUM ('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "availability_status" AS ENUM ('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "vehicle_type" ADD VALUE IF NOT EXISTS 'Mini Truck';
ALTER TYPE "vehicle_type" ADD VALUE IF NOT EXISTS 'LCV (Light Commercial Vehicle)';
ALTER TYPE "vehicle_type" ADD VALUE IF NOT EXISTS 'MCV (Medium Commercial Vehicle)';
ALTER TYPE "vehicle_type" ADD VALUE IF NOT EXISTS 'HCV (Heavy Commercial Vehicle)';
ALTER TYPE "vehicle_type" ADD VALUE IF NOT EXISTS 'Container Truck';
ALTER TYPE "vehicle_type" ADD VALUE IF NOT EXISTS 'Tanker';
ALTER TYPE "repo_status" ADD VALUE IF NOT EXISTS 'Yard Stock';
ALTER TYPE "repo_status" ADD VALUE IF NOT EXISTS 'Auction Upcoming';
ALTER TYPE "repo_status" ADD VALUE IF NOT EXISTS 'Under Settlement';
ALTER TYPE "condition" ADD VALUE IF NOT EXISTS 'Unknown';

ALTER TABLE "vehicles"
  ALTER COLUMN "finance_company" SET DEFAULT '',
  ALTER COLUMN "km_driven" DROP NOT NULL;

ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "listing_type" "listing_type" NOT NULL DEFAULT 'REPO',
  ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "vehicle_sub_type" text,
  ADD COLUMN IF NOT EXISTS "vehicle_registration_number" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "km_meter_status" "km_meter_status" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "running_condition" "running_condition" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "number_of_axles" integer,
  ADD COLUMN IF NOT EXISTS "body_type" text,
  ADD COLUMN IF NOT EXISTS "body_dimensions" text,
  ADD COLUMN IF NOT EXISTS "trailer_type" text,
  ADD COLUMN IF NOT EXISTS "trailer_length" text,
  ADD COLUMN IF NOT EXISTS "suspension_type" text,
  ADD COLUMN IF NOT EXISTS "tyre_inspection_report" "availability_status",
  ADD COLUMN IF NOT EXISTS "tyre_count" integer,
  ADD COLUMN IF NOT EXISTS "current_tyre_count" integer,
  ADD COLUMN IF NOT EXISTS "tyre_condition" "tyre_condition",
  ADD COLUMN IF NOT EXISTS "vehicle_or_yard_location" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "front_photo" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "back_photo" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "side_photo" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "interior_photo" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "walkaround_video" text,
  ADD COLUMN IF NOT EXISTS "engine_startup_video" text,
  ADD COLUMN IF NOT EXISTS "expected_price" numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "alternate_contact_number" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "business_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "gstin" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "engine_condition" "engine_condition",
  ADD COLUMN IF NOT EXISTS "needs_towing" "yes_no_unknown",
  ADD COLUMN IF NOT EXISTS "road_safe_status" "road_safe_status",
  ADD COLUMN IF NOT EXISTS "yard_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "yard_contact" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "tax_due" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "challans" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "insurance_expiry" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "fitness_expiry" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "permit_expiry" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "noc_status" "noc_status",
  ADD COLUMN IF NOT EXISTS "engine_number" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "chassis_number" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "trailer_number" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "gvw_tonnes" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "gps_installed" "yes_no_unknown",
  ADD COLUMN IF NOT EXISTS "abs" "yes_no_unknown",
  ADD COLUMN IF NOT EXISTS "fleet_management_software_available" "availability_status";

UPDATE "vehicles"
SET
  "listing_type" = CASE
    WHEN "finance_company" IS NULL OR TRIM("finance_company") = '' THEN 'REGULAR'::listing_type
    ELSE 'REPO'::listing_type
  END,
  "status" = CASE
    WHEN "listing_status" IN ('VERIFIED', 'SOLD') THEN 'APPROVED'
    WHEN "listing_status" = 'REJECTED' THEN 'REJECTED'
    ELSE 'PENDING'
  END,
  "running_condition" = CASE
    WHEN "condition" = 'Running' THEN 'RUNNING'::running_condition
    WHEN "condition" = 'Non-running' THEN 'NOT_RUNNING'::running_condition
    ELSE 'UNKNOWN'::running_condition
  END,
  "km_meter_status" = CASE WHEN COALESCE("km_driven", 0) > 0 THEN 'WORKING'::km_meter_status ELSE 'UNKNOWN'::km_meter_status END,
  "vehicle_or_yard_location" = COALESCE(NULLIF("vehicle_or_yard_location", ''), "yard_location", ''),
  "front_photo" = COALESCE(NULLIF("front_photo", ''), "image", ''),
  "back_photo" = COALESCE(NULLIF("back_photo", ''), "image", ''),
  "side_photo" = COALESCE(NULLIF("side_photo", ''), "image", ''),
  "interior_photo" = COALESCE(NULLIF("interior_photo", ''), "image", ''),
  "expected_price" = COALESCE(NULLIF("expected_price", 0), "price")
WHERE true;

CREATE TABLE IF NOT EXISTS "vehicle_media" (
  "id" serial PRIMARY KEY NOT NULL,
  "vehicle_id" varchar(100) NOT NULL,
  "type" "vehicle_media_type" NOT NULL,
  "category" "vehicle_media_category" NOT NULL,
  "custom_name" text,
  "url" text NOT NULL,
  "mime_type" text NOT NULL DEFAULT '',
  "created_at" timestamp NOT NULL DEFAULT now()
);

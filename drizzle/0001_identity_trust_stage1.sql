DO $$ BEGIN
  CREATE TYPE "account_type" AS ENUM ('BUYER', 'SELLER', 'BANK_PARTNER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "seller_role_enum" AS ENUM ('BROKER', 'DEALER', 'YARD_OWNER', 'RECOVERY_AGENT', 'TRUCK_OWNER', 'FLEET_OWNER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "bank_role_enum" AS ENUM ('BANK_MANAGER', 'COLLECTION_AGENT', 'RECOVERY_OFFICER', 'BRANCH_ADMIN', 'NBFC_PARTNER', 'BANK_ADMIN', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "verification_status" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "lead_source" AS ENUM ('CALL', 'WHATSAPP', 'REQUEST_DETAILS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TYPE "listing_status" RENAME VALUE 'Pending' TO 'PENDING';
ALTER TYPE "listing_status" RENAME VALUE 'Verified' TO 'VERIFIED';
ALTER TYPE "listing_status" RENAME VALUE 'Rejected' TO 'REJECTED';
ALTER TYPE "listing_status" RENAME VALUE 'Sold' TO 'SOLD';
ALTER TYPE "listing_status" ADD VALUE IF NOT EXISTS 'BANK_PENDING_REVIEW';
ALTER TYPE "listing_status" ADD VALUE IF NOT EXISTS 'SUBMITTED_TO_REPOMANDI';

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "full_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "email" varchar(255),
  ADD COLUMN IF NOT EXISTS "account_type" "account_type" NOT NULL DEFAULT 'BUYER',
  ADD COLUMN IF NOT EXISTS "seller_role" "seller_role_enum",
  ADD COLUMN IF NOT EXISTS "bank_role" "bank_role_enum",
  ADD COLUMN IF NOT EXISTS "business_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "institution_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "branch_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "employee_id" varchar(100),
  ADD COLUMN IF NOT EXISTS "city" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "state" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "is_profile_complete" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_verified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  ADD COLUMN IF NOT EXISTS "trust_score" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "joined_since" timestamp NOT NULL DEFAULT now();

ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "seller_id" integer,
  ADD COLUMN IF NOT EXISTS "created_by_user_id" integer,
  ADD COLUMN IF NOT EXISTS "bank_institution_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "branch_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  ADD COLUMN IF NOT EXISTS "is_published" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rc_verified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "photos_verified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "yard_verified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "seller_verified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "missing_photos" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "price_too_low" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "duplicate_registration" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "new_seller" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "missing_yard_location" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rejection_reason" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "verified_by" integer,
  ADD COLUMN IF NOT EXISTS "verified_at" timestamp;

UPDATE "vehicles"
SET
  "is_published" = CASE WHEN "listing_status" = 'VERIFIED' THEN true ELSE false END,
  "verification_status" = CASE
    WHEN "listing_status" = 'VERIFIED' THEN 'VERIFIED'::verification_status
    WHEN "listing_status" = 'REJECTED' THEN 'REJECTED'::verification_status
    ELSE 'PENDING_VERIFICATION'::verification_status
  END
WHERE true;

UPDATE "vehicles"
SET
  "rc_verified" = POSITION('RC Verified' IN COALESCE(array_to_string("verified_badges", ','), '')) > 0,
  "photos_verified" = POSITION('Photos Verified' IN COALESCE(array_to_string("verified_badges", ','), '')) > 0,
  "yard_verified" = POSITION('Yard Verified' IN COALESCE(array_to_string("verified_badges", ','), '')) > 0
WHERE true;

CREATE TABLE IF NOT EXISTS "leads" (
  "id" serial PRIMARY KEY NOT NULL,
  "vehicle_id" varchar(100) NOT NULL,
  "seller_id" integer NOT NULL,
  "buyer_name" text,
  "buyer_phone" varchar(20),
  "source" "lead_source" NOT NULL,
  "message" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'insurance_inquiry_status'
  ) THEN
    CREATE TYPE "public"."insurance_inquiry_status" AS ENUM('NEW', 'CONTACTED', 'CLOSED', 'REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "insurance_inquiries" (
  "id" serial PRIMARY KEY NOT NULL,
  "vehicle_id" varchar(100) NOT NULL,
  "seller_id" integer,
  "buyer_name" text NOT NULL,
  "buyer_phone" varchar(20) NOT NULL,
  "phone_verified" boolean DEFAULT false NOT NULL,
  "requirement_text" text NOT NULL,
  "listing_title" text NOT NULL,
  "insurance_valid_till" date,
  "vehicle_snapshot" jsonb NOT NULL,
  "status" "insurance_inquiry_status" DEFAULT 'NEW' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

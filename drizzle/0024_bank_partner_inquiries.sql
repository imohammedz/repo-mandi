DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'bank_partner_inquiry_status'
  ) THEN
    CREATE TYPE "public"."bank_partner_inquiry_status" AS ENUM('NEW', 'CONTACTED', 'CLOSED', 'REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "bank_partner_inquiries" (
  "id" serial PRIMARY KEY NOT NULL,
  "bank_name" text NOT NULL,
  "branch_name" text NOT NULL,
  "branch_location" text NOT NULL,
  "contact_person_name" text NOT NULL,
  "contact_number" varchar(20) NOT NULL,
  "bank_email" varchar(320) NOT NULL,
  "designation" text NOT NULL,
  "message" text,
  "status" "bank_partner_inquiry_status" DEFAULT 'NEW' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

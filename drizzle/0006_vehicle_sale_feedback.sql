ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "sold_at" timestamp;

DO $$
BEGIN
  CREATE TYPE "public"."buyer_contact_method" AS ENUM(
    'PHONE_CALL',
    'WHATSAPP',
    'DIRECT_VISIT',
    'EXISTING_CONTACT',
    'REQUEST_DETAILS',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."time_to_sell" AS ENUM(
    'LESS_THAN_1_WEEK',
    'ONE_TO_TWO_WEEKS',
    'TWO_TO_FOUR_WEEKS',
    'MORE_THAN_1_MONTH'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "vehicle_sale_feedback" (
  "id" serial PRIMARY KEY,
  "vehicle_id" varchar(100) NOT NULL,
  "seller_id" integer NOT NULL,
  "sold_through_platform" boolean,
  "buyer_contact_method" "buyer_contact_method",
  "time_to_sell" "time_to_sell",
  "feedback" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "vehicle_sale_feedback_vehicle_id_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id")
    REFERENCES "public"."vehicles"("id")
    ON DELETE cascade
    ON UPDATE no action,
  CONSTRAINT "vehicle_sale_feedback_seller_id_users_id_fk"
    FOREIGN KEY ("seller_id")
    REFERENCES "public"."users"("id")
    ON DELETE cascade
    ON UPDATE no action
);

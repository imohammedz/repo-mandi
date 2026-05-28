ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'LEFT_SIDE';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'RIGHT_SIDE';
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "left_side_photo" text DEFAULT '' NOT NULL;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "right_side_photo" text DEFAULT '' NOT NULL;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "alternate_contact_number_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "ac_cabin" "yes_no_unknown";
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "vehicle_media" ADD COLUMN IF NOT EXISTS "size_bytes" integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_verified_phones" (
  "id" serial PRIMARY KEY NOT NULL,
  "seller_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "phone" varchar(20) NOT NULL,
  "verified_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "seller_verified_phones_seller_phone_unique"
ON "seller_verified_phones" ("seller_id", "phone");

CREATE TABLE IF NOT EXISTS "feature_coupons" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(100) NOT NULL UNIQUE,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "max_uses" integer,
  "used_count" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp,
  "starts_at" timestamp,
  "per_seller_limit" integer,
  "per_listing_limit" integer,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "feature_coupons_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "feature_coupon_usages" (
  "id" serial PRIMARY KEY NOT NULL,
  "coupon_id" integer NOT NULL,
  "vehicle_id" varchar(100) NOT NULL,
  "seller_id" integer NOT NULL,
  "used_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "feature_coupon_usages_coupon_id_fk"
    FOREIGN KEY ("coupon_id") REFERENCES "public"."feature_coupons"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "feature_coupon_usages_vehicle_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "feature_coupon_usages_seller_id_fk"
    FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);

-- Seed initial coupon
INSERT INTO "feature_coupons" ("code", "description", "is_active", "max_uses", "used_count", "expires_at")
VALUES ('NEWRMFREE', 'New RepoMandi free featured listing coupon', true, 100, 0, NULL)
ON CONFLICT ("code") DO NOTHING;

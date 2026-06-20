ALTER TABLE "feature_coupons"
ADD COLUMN IF NOT EXISTS "duration_days" integer DEFAULT 30 NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "feature_coupon_usages_coupon_vehicle_unique"
ON "feature_coupon_usages" ("coupon_id", "vehicle_id");

INSERT INTO "feature_coupons" (
  "code",
  "description",
  "is_active",
  "max_uses",
  "used_count",
  "expires_at",
  "duration_days"
)
VALUES (
  'NEWRMFREE',
  'New RepoMandi free featured listing coupon',
  true,
  100,
  0,
  NULL,
  30
)
ON CONFLICT ("code") DO UPDATE
SET
  "description" = EXCLUDED."description",
  "is_active" = EXCLUDED."is_active",
  "max_uses" = EXCLUDED."max_uses",
  "expires_at" = EXCLUDED."expires_at",
  "duration_days" = EXCLUDED."duration_days",
  "updated_at" = now();

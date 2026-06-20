-- Keep 30 days as the default featured duration so new/existing coupons
-- stay aligned with the application's DEFAULT_FEATURE_DURATION_DAYS fallback.
ALTER TABLE "feature_coupons"
ADD COLUMN IF NOT EXISTS "duration_days" integer DEFAULT 30 NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "feature_coupon_usages_coupon_vehicle_unique"
ON "feature_coupon_usages" ("coupon_id", "vehicle_id");

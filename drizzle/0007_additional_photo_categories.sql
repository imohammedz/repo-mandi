-- Add new photo category values to the vehicle_media_category enum.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so each
-- statement is issued individually with IF NOT EXISTS for idempotency.

ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'TYRES';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'ENGINE';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'CABIN';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'CHASSIS';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'SUSPENSION';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'AXLES';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'DASHBOARD';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'DAMAGE';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'TRAILER_BODY';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'LOAD_BODY';
ALTER TYPE "public"."vehicle_media_category" ADD VALUE IF NOT EXISTS 'HYDRAULIC_SYSTEM';

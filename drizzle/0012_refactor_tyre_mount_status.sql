DO $$ BEGIN
 CREATE TYPE "public"."tyre_mount_status" AS ENUM('ON_DISC', 'WITH_TYRES', 'WITHOUT_DISC_AND_TYRES', 'PARTIAL', 'UNKNOWN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."tyre_mount_status" ADD VALUE IF NOT EXISTS 'WITH_TYRES';
--> statement-breakpoint
ALTER TYPE "public"."tyre_mount_status" ADD VALUE IF NOT EXISTS 'WITHOUT_DISC_AND_TYRES';
--> statement-breakpoint
ALTER TYPE "public"."tyre_mount_status" ADD VALUE IF NOT EXISTS 'UNKNOWN';
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "total_tyres" integer;
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "tyre_mount_status" "tyre_mount_status";
--> statement-breakpoint
UPDATE "vehicles"
SET "tyre_mount_status" = CASE
  WHEN "tyre_mount_status"::text = 'TYRES_ONLY' THEN 'WITH_TYRES'::tyre_mount_status
  WHEN "tyre_mount_status"::text = 'NO_TYRES' THEN 'WITHOUT_DISC_AND_TYRES'::tyre_mount_status
  ELSE "tyre_mount_status"
END
WHERE "tyre_mount_status"::text IN ('TYRES_ONLY', 'NO_TYRES');

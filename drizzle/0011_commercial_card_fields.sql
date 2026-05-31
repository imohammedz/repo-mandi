DO $$ BEGIN
 CREATE TYPE "public"."transfer_type" AS ENUM('RC_TRANSFER', 'RTO_NOC', 'OPEN_NOC', 'UNKNOWN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tyre_mount_status" AS ENUM('ON_DISC', 'TYRES_ONLY', 'NO_TYRES', 'PARTIAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "transfer_type" "transfer_type";
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "total_tyres" integer;
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "tyre_mount_status" "tyre_mount_status";
--> statement-breakpoint
UPDATE "vehicles"
SET "transfer_type" = CASE "noc_status"
  WHEN 'AVAILABLE' THEN 'RC_TRANSFER'::transfer_type
  WHEN 'NOT_AVAILABLE' THEN 'UNKNOWN'::transfer_type
  WHEN 'UNKNOWN' THEN 'UNKNOWN'::transfer_type
  ELSE "transfer_type"
END
WHERE "transfer_type" IS NULL;
--> statement-breakpoint
UPDATE "vehicles"
SET "total_tyres" = COALESCE("total_tyres", "tyre_count", "current_tyre_count")
WHERE "total_tyres" IS NULL;

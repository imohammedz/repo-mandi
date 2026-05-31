DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tyre_mount_status') THEN
  CREATE TYPE "public"."tyre_mount_status" AS ENUM('ON_DISC', 'WITH_TYRES', 'WITHOUT_DISC_AND_TYRES', 'PARTIAL', 'UNKNOWN');
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
  SELECT 1
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typname = 'tyre_mount_status' AND e.enumlabel = 'TYRES_ONLY'
 ) THEN
  ALTER TYPE "public"."tyre_mount_status" RENAME VALUE 'TYRES_ONLY' TO 'WITH_TYRES';
 END IF;
 IF EXISTS (
  SELECT 1
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typname = 'tyre_mount_status' AND e.enumlabel = 'NO_TYRES'
 ) THEN
  ALTER TYPE "public"."tyre_mount_status" RENAME VALUE 'NO_TYRES' TO 'WITHOUT_DISC_AND_TYRES';
 END IF;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."tyre_mount_status" ADD VALUE IF NOT EXISTS 'UNKNOWN';
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "total_tyres" integer;
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "tyre_mount_status" "tyre_mount_status";

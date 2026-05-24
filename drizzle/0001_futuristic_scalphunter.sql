CREATE TYPE "public"."availability_status" AS ENUM('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."engine_condition" AS ENUM('GOOD', 'AVERAGE', 'NEEDS_WORK', 'NOT_CHECKED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."km_meter_status" AS ENUM('WORKING', 'NOT_WORKING', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('REGULAR', 'REPO');--> statement-breakpoint
CREATE TYPE "public"."vehicle_media_category" AS ENUM('FRONT', 'BACK', 'SIDE', 'INTERIOR', 'WALKAROUND', 'ENGINE_STARTUP', 'INSPECTION_REPORT', 'RC', 'INSURANCE', 'FITNESS', 'PERMIT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."vehicle_media_type" AS ENUM('PHOTO', 'VIDEO', 'DOCUMENT');--> statement-breakpoint
CREATE TYPE "public"."noc_status" AS ENUM('AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."road_safe_status" AS ENUM('ROAD_SAFE', 'NOT_ROAD_SAFE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."running_condition" AS ENUM('RUNNING', 'NOT_RUNNING', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."tyre_condition" AS ENUM('NEW', 'GOOD', 'FAIR', 'AROUND_50', 'POOR', 'MIXED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."yes_no_unknown" AS ENUM('YES', 'NO', 'UNKNOWN');--> statement-breakpoint
ALTER TYPE "public"."condition" ADD VALUE 'Unknown';--> statement-breakpoint
ALTER TYPE "public"."repo_status" ADD VALUE 'Yard Stock' BEFORE 'Auction Live';--> statement-breakpoint
ALTER TYPE "public"."repo_status" ADD VALUE 'Auction Upcoming' BEFORE 'Ready For Sale';--> statement-breakpoint
ALTER TYPE "public"."repo_status" ADD VALUE 'Under Settlement';--> statement-breakpoint
ALTER TYPE "public"."vehicle_type" ADD VALUE 'Mini Truck' BEFORE 'Truck';--> statement-breakpoint
ALTER TYPE "public"."vehicle_type" ADD VALUE 'LCV (Light Commercial Vehicle)' BEFORE 'Truck';--> statement-breakpoint
ALTER TYPE "public"."vehicle_type" ADD VALUE 'MCV (Medium Commercial Vehicle)' BEFORE 'Truck';--> statement-breakpoint
ALTER TYPE "public"."vehicle_type" ADD VALUE 'HCV (Heavy Commercial Vehicle)' BEFORE 'Truck';--> statement-breakpoint
ALTER TYPE "public"."vehicle_type" ADD VALUE 'Container Truck' BEFORE 'Truck';--> statement-breakpoint
ALTER TYPE "public"."vehicle_type" ADD VALUE 'Tanker' BEFORE 'Truck';--> statement-breakpoint
CREATE TABLE "vehicle_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(100) NOT NULL,
	"type" "vehicle_media_type" NOT NULL,
	"category" "vehicle_media_category" NOT NULL,
	"custom_name" text,
	"url" text NOT NULL,
	"mime_type" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "km_driven" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "km_driven" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "finance_company" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "listing_type" "listing_type" DEFAULT 'REPO' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "status" varchar(50) DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "vehicle_sub_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "vehicle_registration_number" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "km_meter_status" "km_meter_status" DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "running_condition" "running_condition" DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "number_of_axles" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "body_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "body_dimensions" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "trailer_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "trailer_length" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "suspension_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tyre_inspection_report" "availability_status";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tyre_count" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "current_tyre_count" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tyre_condition" "tyre_condition";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "vehicle_or_yard_location" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "front_photo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "back_photo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "side_photo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "interior_photo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "walkaround_video" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_startup_video" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "expected_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "alternate_contact_number" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "business_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "gstin" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_condition" "engine_condition";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "needs_towing" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "road_safe_status" "road_safe_status";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "yard_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "yard_contact" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tax_due" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "challans" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "insurance_expiry" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "fitness_expiry" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "permit_expiry" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "noc_status" "noc_status";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_number" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "chassis_number" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "trailer_number" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "gvw_tonnes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "gps_installed" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "abs" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "fleet_management_software_available" "availability_status";
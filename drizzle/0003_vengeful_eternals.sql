CREATE TYPE "public"."asset_structure" AS ENUM('STANDALONE', 'DETACHABLE', 'EQUIPMENT');--> statement-breakpoint
CREATE TYPE "public"."buyer_contact_method" AS ENUM('PHONE_CALL', 'WHATSAPP', 'DIRECT_VISIT', 'EXISTING_CONTACT', 'REQUEST_DETAILS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."detachable_type" AS ENUM('PRIME_MOVER', 'TRAILER');--> statement-breakpoint
CREATE TYPE "public"."finance_inquiry_status" AS ENUM('NEW', 'CONTACTED', 'CLOSED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."insurance_inquiry_status" AS ENUM('NEW', 'CONTACTED', 'CLOSED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."listing_mode" AS ENUM('NORMAL', 'BULK');--> statement-breakpoint
CREATE TYPE "public"."time_to_sell" AS ENUM('LESS_THAN_1_WEEK', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS', 'MORE_THAN_1_MONTH');--> statement-breakpoint
CREATE TYPE "public"."transfer_type" AS ENUM('RC_TRANSFER', 'RTO_NOC', 'OPEN_NOC', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."tyre_mount_status" AS ENUM('ON_DISC', 'WITH_TYRES', 'WITHOUT_DISC_AND_TYRES', 'PARTIAL', 'UNKNOWN');--> statement-breakpoint
ALTER TYPE "public"."engine_condition" ADD VALUE 'EXCELLENT' BEFORE 'GOOD';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'LEFT_SIDE' BEFORE 'INTERIOR';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'RIGHT_SIDE' BEFORE 'INTERIOR';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'TYRES';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'ENGINE';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'CABIN';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'CHASSIS';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'SUSPENSION';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'AXLES';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'DASHBOARD';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'DAMAGE';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'TRAILER_BODY';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'LOAD_BODY';--> statement-breakpoint
ALTER TYPE "public"."vehicle_media_category" ADD VALUE 'HYDRAULIC_SYSTEM';--> statement-breakpoint
ALTER TYPE "public"."vehicle_type" ADD VALUE 'Equipment';--> statement-breakpoint
CREATE TABLE "feature_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(100) NOT NULL,
	"seller_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"note" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(100) NOT NULL,
	"seller_id" integer,
	"buyer_name" text NOT NULL,
	"buyer_phone" varchar(20) NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"requirement_text" text NOT NULL,
	"listing_title" text NOT NULL,
	"listing_price" integer,
	"estimated_emi" integer,
	"loan_amount" integer,
	"down_payment_amount" integer,
	"interest_rate" numeric(5, 2) DEFAULT '12.00' NOT NULL,
	"tenure_months" integer DEFAULT 36 NOT NULL,
	"vehicle_snapshot" jsonb NOT NULL,
	"status" "finance_inquiry_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(100) NOT NULL,
	"seller_id" integer,
	"buyer_name" text NOT NULL,
	"buyer_phone" varchar(20) NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"requirement_text" text NOT NULL,
	"listing_title" text NOT NULL,
	"insurance_valid_till" date,
	"vehicle_snapshot" jsonb NOT NULL,
	"status" "insurance_inquiry_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"code_hash" text NOT NULL,
	"purpose" varchar(50) DEFAULT 'login' NOT NULL,
	"provider" varchar(20) DEFAULT 'WHATSAPP' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vehicle_id" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_verified_phones" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"phone" varchar(20) NOT NULL,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_sale_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(100) NOT NULL,
	"seller_id" integer NOT NULL,
	"sold_through_platform" boolean,
	"buyer_contact_method" "buyer_contact_method",
	"time_to_sell" time_to_sell,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_media" ADD COLUMN "original_file_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_media" ADD COLUMN "size_bytes" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "listing_mode" "listing_mode" DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "asset_structure" "asset_structure";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "detachable_type" "detachable_type";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "asset_category" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "body_application_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "is_registered" boolean;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "bs_norm" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "transmission" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "axle_configuration" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "horsepower" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "odometer_reading" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "hour_meter_reading" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "body_length" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "payload_capacity" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "body_attached" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "body_condition" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "total_tyres" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tyre_mount_status" "tyre_mount_status";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "left_side_photo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "right_side_photo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "alternate_contact_number_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "transfer_type" "transfer_type";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "machine_serial_number" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "battery_available" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "key_available" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "ac_cabin" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tyres_included" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "rims_discs_included" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "battery_included" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "cabin_available" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_available" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "documents_available" "yes_no_unknown";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "remarks" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "insurance_validity" date;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "permit_validity" date;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "fitness_status" date;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tax_validity" date;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "parking_due" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "featured_at" timestamp;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "featured_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "featured_by" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "sold_at" timestamp;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_verified_phones" ADD CONSTRAINT "seller_verified_phones_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_sale_feedback" ADD CONSTRAINT "vehicle_sale_feedback_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_sale_feedback" ADD CONSTRAINT "vehicle_sale_feedback_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_listings_user_vehicle_unique" ON "saved_listings" USING btree ("user_id","vehicle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seller_verified_phones_seller_phone_unique" ON "seller_verified_phones" USING btree ("seller_id","phone");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_featured_by_users_id_fk" FOREIGN KEY ("featured_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
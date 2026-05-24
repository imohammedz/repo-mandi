CREATE TYPE "public"."account_type" AS ENUM('BUYER', 'SELLER', 'BANK_PARTNER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."bank_role_enum" AS ENUM('BANK_MANAGER', 'COLLECTION_AGENT', 'RECOVERY_OFFICER', 'BRANCH_ADMIN', 'NBFC_PARTNER', 'BANK_ADMIN', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('Running', 'Non-running');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('Diesel', 'CNG');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('CALL', 'WHATSAPP', 'REQUEST_DETAILS');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED', 'SOLD', 'BANK_PENDING_REVIEW', 'SUBMITTED_TO_REPOMANDI');--> statement-breakpoint
CREATE TYPE "public"."repo_status" AS ENUM('Bank Seized', 'Auction Live', 'Ready For Sale');--> statement-breakpoint
CREATE TYPE "public"."seller_role_enum" AS ENUM('BROKER', 'DEALER', 'YARD_OWNER', 'RECOVERY_AGENT', 'TRUCK_OWNER', 'FLEET_OWNER');--> statement-breakpoint
CREATE TYPE "public"."seller_type" AS ENUM('Bank Agent', 'Yard Partner');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('Truck', 'Tipper', 'Pickup', 'Bus', 'Trailer', 'Tractor');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(100) NOT NULL,
	"seller_id" integer NOT NULL,
	"buyer_name" text,
	"buyer_phone" varchar(20),
	"source" "lead_source" NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"role" varchar(50),
	"full_name" text DEFAULT '' NOT NULL,
	"email" varchar(255),
	"account_type" "account_type" DEFAULT 'BUYER' NOT NULL,
	"seller_role" "seller_role_enum",
	"bank_role" "bank_role_enum",
	"business_name" text DEFAULT '' NOT NULL,
	"institution_name" text DEFAULT '' NOT NULL,
	"branch_name" text DEFAULT '' NOT NULL,
	"employee_id" varchar(100),
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"is_profile_complete" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_status" "verification_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"trust_score" integer DEFAULT 0 NOT NULL,
	"joined_since" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"seller_id" integer,
	"created_by_user_id" integer,
	"title" text NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"km_driven" integer DEFAULT 0 NOT NULL,
	"fuel_type" "fuel_type" DEFAULT 'Diesel' NOT NULL,
	"axle_type" text DEFAULT '' NOT NULL,
	"registration_state" text DEFAULT '' NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"gallery" text[] DEFAULT '{}' NOT NULL,
	"finance_company" text NOT NULL,
	"bank_institution_name" text DEFAULT '' NOT NULL,
	"branch_name" text DEFAULT '' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"reserve_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"repo_status" "repo_status" DEFAULT 'Ready For Sale' NOT NULL,
	"seller_type" "seller_type" DEFAULT 'Bank Agent' NOT NULL,
	"seller_name" text DEFAULT '' NOT NULL,
	"seller_role" text DEFAULT '' NOT NULL,
	"seller_phone" text DEFAULT '' NOT NULL,
	"condition" "condition" DEFAULT 'Running' NOT NULL,
	"condition_notes" text DEFAULT '' NOT NULL,
	"accident_notes" text DEFAULT '' NOT NULL,
	"auction_date" text DEFAULT '' NOT NULL,
	"yard_location" text DEFAULT '' NOT NULL,
	"verified_badges" text[] DEFAULT '{}' NOT NULL,
	"inspection_notes" text[] DEFAULT '{}' NOT NULL,
	"inquiries" integer DEFAULT 0 NOT NULL,
	"listing_status" "listing_status" DEFAULT 'PENDING' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"rc_verified" boolean DEFAULT false NOT NULL,
	"photos_verified" boolean DEFAULT false NOT NULL,
	"yard_verified" boolean DEFAULT false NOT NULL,
	"seller_verified" boolean DEFAULT false NOT NULL,
	"missing_photos" boolean DEFAULT false NOT NULL,
	"price_too_low" boolean DEFAULT false NOT NULL,
	"duplicate_registration" boolean DEFAULT false NOT NULL,
	"new_seller" boolean DEFAULT false NOT NULL,
	"missing_yard_location" boolean DEFAULT false NOT NULL,
	"rejection_reason" text DEFAULT '' NOT NULL,
	"verified_by" integer,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

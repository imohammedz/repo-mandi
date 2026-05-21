CREATE TYPE "vehicle_type" AS ENUM ('Truck', 'Tipper', 'Pickup', 'Bus', 'Trailer', 'Tractor');
CREATE TYPE "fuel_type" AS ENUM ('Diesel', 'CNG');
CREATE TYPE "condition" AS ENUM ('Running', 'Non-running');
CREATE TYPE "repo_status" AS ENUM ('Bank Seized', 'Auction Live', 'Ready For Sale');
CREATE TYPE "seller_type" AS ENUM ('Bank Agent', 'Yard Partner');
CREATE TYPE "listing_status" AS ENUM ('Pending', 'Verified', 'Rejected', 'Sold');

CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "phone" varchar(20) NOT NULL UNIQUE,
  "role" varchar(50),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "vehicles" (
  "id" varchar(100) PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "type" "vehicle_type" NOT NULL,
  "brand" text NOT NULL,
  "model" text NOT NULL,
  "year" integer NOT NULL,
  "km_driven" integer NOT NULL DEFAULT 0,
  "fuel_type" "fuel_type" NOT NULL DEFAULT 'Diesel',
  "axle_type" text NOT NULL DEFAULT '',
  "registration_state" text NOT NULL DEFAULT '',
  "city" text NOT NULL,
  "state" text NOT NULL,
  "image" text NOT NULL DEFAULT '',
  "gallery" text[] NOT NULL DEFAULT '{}',
  "finance_company" text NOT NULL,
  "price" numeric(12, 2) NOT NULL,
  "reserve_price" numeric(12, 2) NOT NULL DEFAULT 0,
  "repo_status" "repo_status" NOT NULL DEFAULT 'Ready For Sale',
  "seller_type" "seller_type" NOT NULL DEFAULT 'Bank Agent',
  "seller_name" text NOT NULL DEFAULT '',
  "seller_role" text NOT NULL DEFAULT '',
  "seller_phone" text NOT NULL DEFAULT '',
  "condition" "condition" NOT NULL DEFAULT 'Running',
  "condition_notes" text NOT NULL DEFAULT '',
  "accident_notes" text NOT NULL DEFAULT '',
  "auction_date" text NOT NULL DEFAULT '',
  "yard_location" text NOT NULL DEFAULT '',
  "verified_badges" text[] NOT NULL DEFAULT '{}',
  "inspection_notes" text[] NOT NULL DEFAULT '{}',
  "inquiries" integer NOT NULL DEFAULT 0,
  "listing_status" "listing_status" NOT NULL DEFAULT 'Pending',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

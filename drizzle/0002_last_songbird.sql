ALTER TABLE "vehicles" ADD COLUMN "asset_configuration" text DEFAULT 'Complete Vehicle' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "trailer_manufacturer" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "trailer_manufacturing_month_year" text;
CREATE TABLE "feature_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(100) NOT NULL,
	"seller_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_requests_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "feature_requests_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);

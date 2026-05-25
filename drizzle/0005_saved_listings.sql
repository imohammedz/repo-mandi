CREATE TABLE IF NOT EXISTS "saved_listings" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "vehicle_id" varchar(100) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "saved_listings_user_id_users_id_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "public"."users"("id")
    ON DELETE cascade
    ON UPDATE no action,
  CONSTRAINT "saved_listings_vehicle_id_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id")
    REFERENCES "public"."vehicles"("id")
    ON DELETE cascade
    ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "saved_listings_user_vehicle_unique"
  ON "saved_listings" ("user_id", "vehicle_id");

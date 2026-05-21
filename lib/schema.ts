import {
  pgTable,
  text,
  integer,
  numeric,
  varchar,
  timestamp,
  pgEnum,
  serial,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "Truck",
  "Tipper",
  "Pickup",
  "Bus",
  "Trailer",
  "Tractor",
]);

export const fuelTypeEnum = pgEnum("fuel_type", ["Diesel", "CNG"]);

export const conditionEnum = pgEnum("condition", ["Running", "Non-running"]);

export const repoStatusEnum = pgEnum("repo_status", [
  "Bank Seized",
  "Auction Live",
  "Ready For Sale",
]);

export const sellerTypeEnum = pgEnum("seller_type", [
  "Bank Agent",
  "Yard Partner",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "Pending",
  "Verified",
  "Rejected",
  "Sold",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  role: varchar("role", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: varchar("id", { length: 100 }).primaryKey(),
  title: text("title").notNull(),
  type: vehicleTypeEnum("type").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  kmDriven: integer("km_driven").notNull().default(0),
  fuelType: fuelTypeEnum("fuel_type").notNull().default("Diesel"),
  axleType: text("axle_type").notNull().default(""),
  registrationState: text("registration_state").notNull().default(""),
  city: text("city").notNull(),
  state: text("state").notNull(),
  image: text("image").notNull().default(""),
  gallery: text("gallery").array().notNull().default([]),
  financeCompany: text("finance_company").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  reservePrice: numeric("reserve_price", { precision: 12, scale: 2 }).notNull().default("0"),
  repoStatus: repoStatusEnum("repo_status").notNull().default("Ready For Sale"),
  sellerType: sellerTypeEnum("seller_type").notNull().default("Bank Agent"),
  sellerName: text("seller_name").notNull().default(""),
  sellerRole: text("seller_role").notNull().default(""),
  sellerPhone: text("seller_phone").notNull().default(""),
  condition: conditionEnum("condition").notNull().default("Running"),
  conditionNotes: text("condition_notes").notNull().default(""),
  accidentNotes: text("accident_notes").notNull().default(""),
  auctionDate: text("auction_date").notNull().default(""),
  yardLocation: text("yard_location").notNull().default(""),
  verifiedBadges: text("verified_badges").array().notNull().default([]),
  inspectionNotes: text("inspection_notes").array().notNull().default([]),
  inquiries: integer("inquiries").notNull().default(0),
  listingStatus: listingStatusEnum("listing_status").notNull().default("Pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type DbVehicle = typeof vehicles.$inferSelect;
export type DbVehicleInsert = typeof vehicles.$inferInsert;
export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;

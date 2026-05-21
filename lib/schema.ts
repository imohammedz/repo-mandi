import {
  pgTable,
  text,
  integer,
  numeric,
  varchar,
  timestamp,
  pgEnum,
  serial,
  boolean,
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
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "SOLD",
  "BANK_PENDING_REVIEW",
  "SUBMITTED_TO_REPOMANDI",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "BUYER",
  "SELLER",
  "BANK_PARTNER",
  "ADMIN",
]);

export const sellerRoleEnum = pgEnum("seller_role_enum", [
  "BROKER",
  "DEALER",
  "YARD_OWNER",
  "RECOVERY_AGENT",
  "TRUCK_OWNER",
  "FLEET_OWNER",
]);

export const bankRoleEnum = pgEnum("bank_role_enum", [
  "BANK_MANAGER",
  "COLLECTION_AGENT",
  "RECOVERY_OFFICER",
  "BRANCH_ADMIN",
  "NBFC_PARTNER",
  "BANK_ADMIN",
  "VIEWER",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "CALL",
  "WHATSAPP",
  "REQUEST_DETAILS",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  role: varchar("role", { length: 50 }), // legacy field
  fullName: text("full_name").notNull().default(""),
  email: varchar("email", { length: 255 }),
  accountType: accountTypeEnum("account_type").notNull().default("BUYER"),
  sellerRole: sellerRoleEnum("seller_role"),
  bankRole: bankRoleEnum("bank_role"),
  businessName: text("business_name").notNull().default(""),
  institutionName: text("institution_name").notNull().default(""),
  branchName: text("branch_name").notNull().default(""),
  employeeId: varchar("employee_id", { length: 100 }),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  isProfileComplete: boolean("is_profile_complete").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("PENDING_VERIFICATION"),
  trustScore: integer("trust_score").notNull().default(0),
  joinedSince: timestamp("joined_since").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: varchar("id", { length: 100 }).primaryKey(),
  sellerId: integer("seller_id"),
  createdByUserId: integer("created_by_user_id"),
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
  bankInstitutionName: text("bank_institution_name").notNull().default(""),
  branchName: text("branch_name").notNull().default(""),
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
  listingStatus: listingStatusEnum("listing_status").notNull().default("PENDING"),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("PENDING_VERIFICATION"),
  isPublished: boolean("is_published").notNull().default(false),
  rcVerified: boolean("rc_verified").notNull().default(false),
  photosVerified: boolean("photos_verified").notNull().default(false),
  yardVerified: boolean("yard_verified").notNull().default(false),
  sellerVerified: boolean("seller_verified").notNull().default(false),
  missingPhotos: boolean("missing_photos").notNull().default(false),
  priceTooLow: boolean("price_too_low").notNull().default(false),
  duplicateRegistration: boolean("duplicate_registration").notNull().default(false),
  newSeller: boolean("new_seller").notNull().default(false),
  missingYardLocation: boolean("missing_yard_location").notNull().default(false),
  rejectionReason: text("rejection_reason").notNull().default(""),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 100 }).notNull(),
  sellerId: integer("seller_id").notNull(),
  buyerName: text("buyer_name"),
  buyerPhone: varchar("buyer_phone", { length: 20 }),
  source: leadSourceEnum("source").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type DbVehicle = typeof vehicles.$inferSelect;
export type DbVehicleInsert = typeof vehicles.$inferInsert;
export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;
export type DbLead = typeof leads.$inferSelect;
export type DbLeadInsert = typeof leads.$inferInsert;

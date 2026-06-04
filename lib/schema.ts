import {
  pgTable,
  text,
  integer,
  numeric,
  varchar,
  timestamp,
  date,
  pgEnum,
  serial,
  boolean,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "Mini Truck",
  "LCV (Light Commercial Vehicle)",
  "MCV (Medium Commercial Vehicle)",
  "HCV (Heavy Commercial Vehicle)",
  "Container Truck",
  "Tanker",
  "Truck",
  "Tipper",
  "Pickup",
  "Bus",
  "Trailer",
  "Tractor",
  "Equipment",
]);

export const fuelTypeEnum = pgEnum("fuel_type", ["Diesel", "CNG"]);

export const conditionEnum = pgEnum("condition", ["Running", "Non-running", "Unknown"]);

export const repoStatusEnum = pgEnum("repo_status", [
  "Bank Seized",
  "Yard Stock",
  "Auction Live",
  "Auction Upcoming",
  "Ready For Sale",
  "Under Settlement",
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

export const buyerContactMethodEnum = pgEnum("buyer_contact_method", [
  "PHONE_CALL",
  "WHATSAPP",
  "DIRECT_VISIT",
  "EXISTING_CONTACT",
  "REQUEST_DETAILS",
  "OTHER",
]);

export const financeInquiryStatusEnum = pgEnum("finance_inquiry_status", [
  "NEW",
  "CONTACTED",
  "CLOSED",
  "REJECTED",
]);

export const timeToSellEnum = pgEnum("time_to_sell", [
  "LESS_THAN_1_WEEK",
  "ONE_TO_TWO_WEEKS",
  "TWO_TO_FOUR_WEEKS",
  "MORE_THAN_1_MONTH",
]);

export const listingTypeEnum = pgEnum("listing_type", [
  "REGULAR",
  "REPO",
]);

export const listingModeEnum = pgEnum("listing_mode", [
  "NORMAL",
  "BULK",
]);

export const assetStructureEnum = pgEnum("asset_structure", [
  "STANDALONE",
  "DETACHABLE",
  "EQUIPMENT",
]);

export const detachableTypeEnum = pgEnum("detachable_type", [
  "PRIME_MOVER",
  "TRAILER",
]);

export const kmMeterStatusEnum = pgEnum("km_meter_status", [
  "WORKING",
  "NOT_WORKING",
  "UNKNOWN",
]);

export const runningConditionEnum = pgEnum("running_condition", [
  "RUNNING",
  "NOT_RUNNING",
  "UNKNOWN",
]);

export const engineConditionEnum = pgEnum("engine_condition", [
  "EXCELLENT",
  "GOOD",
  "AVERAGE",
  "NEEDS_WORK",
  "NOT_CHECKED",
  "UNKNOWN",
]);

export const yesNoUnknownEnum = pgEnum("yes_no_unknown", [
  "YES",
  "NO",
  "UNKNOWN",
]);

export const roadSafeStatusEnum = pgEnum("road_safe_status", [
  "ROAD_SAFE",
  "NOT_ROAD_SAFE",
  "UNKNOWN",
]);

export const tyreConditionEnum = pgEnum("tyre_condition", [
  "NEW",
  "GOOD",
  "FAIR",
  "AROUND_50",
  "POOR",
  "MIXED",
  "UNKNOWN",
]);

export const tyreMountStatusEnum = pgEnum("tyre_mount_status", [
  "ON_DISC",
  "WITH_TYRES",
  "WITHOUT_DISC_AND_TYRES",
  "PARTIAL",
  "UNKNOWN",
]);

export const mediaTypeEnum = pgEnum("vehicle_media_type", [
  "PHOTO",
  "VIDEO",
  "DOCUMENT",
]);

export const mediaCategoryEnum = pgEnum("vehicle_media_category", [
  "FRONT",
  "BACK",
  "SIDE",
  "LEFT_SIDE",
  "RIGHT_SIDE",
  "INTERIOR",
  "WALKAROUND",
  "ENGINE_STARTUP",
  "INSPECTION_REPORT",
  "RC",
  "INSURANCE",
  "FITNESS",
  "PERMIT",
  "OTHER",
  "TYRES",
  "ENGINE",
  "CABIN",
  "CHASSIS",
  "SUSPENSION",
  "AXLES",
  "DASHBOARD",
  "DAMAGE",
  "TRAILER_BODY",
  "LOAD_BODY",
  "HYDRAULIC_SYSTEM",
]);

export const nocStatusEnum = pgEnum("noc_status", [
  "AVAILABLE",
  "NOT_AVAILABLE",
  "UNKNOWN",
]);

export const transferTypeEnum = pgEnum("transfer_type", [
  "RC_TRANSFER",
  "RTO_NOC",
  "OPEN_NOC",
  "UNKNOWN",
]);

export const availabilityStatusEnum = pgEnum("availability_status", [
  "AVAILABLE",
  "NOT_AVAILABLE",
  "UNKNOWN",
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
  listingType: listingTypeEnum("listing_type").notNull().default("REPO"),
  listingMode: listingModeEnum("listing_mode").notNull().default("NORMAL"),
  assetConfiguration: text("asset_configuration").notNull().default("Complete Vehicle"),
  assetStructure: assetStructureEnum("asset_structure"),
  detachableType: detachableTypeEnum("detachable_type"),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  title: text("title").notNull(),
  type: vehicleTypeEnum("type").notNull(),
  assetCategory: text("asset_category"),
  vehicleSubType: text("vehicle_sub_type"),
  bodyApplicationType: text("body_application_type"),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  isRegistered: boolean("is_registered"),
  vehicleRegistrationNumber: text("vehicle_registration_number").notNull().default(""),
  kmDriven: integer("km_driven"),
  kmMeterStatus: kmMeterStatusEnum("km_meter_status").notNull().default("UNKNOWN"),
  runningCondition: runningConditionEnum("running_condition").notNull().default("UNKNOWN"),
  fuelType: fuelTypeEnum("fuel_type").notNull().default("Diesel"),
  bsNorm: text("bs_norm"),
  transmission: text("transmission"),
  axleConfiguration: text("axle_configuration"),
  horsepower: integer("horsepower"),
  odometerReading: integer("odometer_reading"),
  hourMeterReading: integer("hour_meter_reading"),
  axleType: text("axle_type").notNull().default(""),
  numberOfAxles: integer("number_of_axles"),
  bodyType: text("body_type"),
  bodyLength: text("body_length"),
  bodyDimensions: text("body_dimensions"),
  payloadCapacity: text("payload_capacity"),
  bodyAttached: yesNoUnknownEnum("body_attached"),
  bodyCondition: text("body_condition"),
  trailerType: text("trailer_type"),
  trailerLength: text("trailer_length"),
  trailerManufacturer: text("trailer_manufacturer"),
  trailerManufacturingMonthYear: text("trailer_manufacturing_month_year"),
  suspensionType: text("suspension_type"),
  tyreInspectionReport: availabilityStatusEnum("tyre_inspection_report"),
  totalTyres: integer("total_tyres"),
  tyreCount: integer("tyre_count"),
  currentTyreCount: integer("current_tyre_count"),
  tyreMountStatus: tyreMountStatusEnum("tyre_mount_status"),
  tyreCondition: tyreConditionEnum("tyre_condition"),
  registrationState: text("registration_state").notNull().default(""),
  city: text("city").notNull(),
  state: text("state").notNull(),
  vehicleOrYardLocation: text("vehicle_or_yard_location").notNull().default(""),
  image: text("image").notNull().default(""),
  gallery: text("gallery").array().notNull().default([]),
  frontPhoto: text("front_photo").notNull().default(""),
  backPhoto: text("back_photo").notNull().default(""),
  sidePhoto: text("side_photo").notNull().default(""),
  leftSidePhoto: text("left_side_photo").notNull().default(""),
  rightSidePhoto: text("right_side_photo").notNull().default(""),
  interiorPhoto: text("interior_photo").notNull().default(""),
  walkaroundVideo: text("walkaround_video"),
  engineStartUpVideo: text("engine_startup_video"),
  financeCompany: text("finance_company").notNull().default(""),
  bankInstitutionName: text("bank_institution_name").notNull().default(""),
  branchName: text("branch_name").notNull().default(""),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  expectedPrice: numeric("expected_price", { precision: 12, scale: 2 }).notNull().default("0"),
  reservePrice: numeric("reserve_price", { precision: 12, scale: 2 }).notNull().default("0"),
  repoStatus: repoStatusEnum("repo_status").notNull().default("Ready For Sale"),
  sellerType: sellerTypeEnum("seller_type").notNull().default("Bank Agent"),
  sellerName: text("seller_name").notNull().default(""),
  sellerRole: text("seller_role").notNull().default(""),
  sellerPhone: text("seller_phone").notNull().default(""),
  alternateContactNumber: text("alternate_contact_number").notNull().default(""),
  alternateContactNumberVerified: boolean("alternate_contact_number_verified").notNull().default(false),
  businessName: text("business_name").notNull().default(""),
  gstin: text("gstin").notNull().default(""),
  condition: conditionEnum("condition").notNull().default("Running"),
  conditionNotes: text("condition_notes").notNull().default(""),
  engineCondition: engineConditionEnum("engine_condition"),
  needsTowing: yesNoUnknownEnum("needs_towing"),
  roadSafeStatus: roadSafeStatusEnum("road_safe_status"),
  accidentNotes: text("accident_notes").notNull().default(""),
  auctionDate: text("auction_date").notNull().default(""),
  yardName: text("yard_name").notNull().default(""),
  yardContact: text("yard_contact").notNull().default(""),
  yardLocation: text("yard_location").notNull().default(""),
  taxDue: text("tax_due").notNull().default(""),
  challans: text("challans").notNull().default(""),
  insuranceExpiry: text("insurance_expiry").notNull().default(""),
  fitnessExpiry: text("fitness_expiry").notNull().default(""),
  permitExpiry: text("permit_expiry").notNull().default(""),
  transferType: transferTypeEnum("transfer_type"),
  nocStatus: nocStatusEnum("noc_status"),
  machineSerialNumber: text("machine_serial_number"),
  engineNumber: text("engine_number").notNull().default(""),
  chassisNumber: text("chassis_number").notNull().default(""),
  trailerNumber: text("trailer_number").notNull().default(""),
  gvwTonnes: text("gvw_tonnes").notNull().default(""),
  gpsInstalled: yesNoUnknownEnum("gps_installed"),
  abs: yesNoUnknownEnum("abs"),
  batteryAvailable: yesNoUnknownEnum("battery_available"),
  keyAvailable: yesNoUnknownEnum("key_available"),
  acCabin: yesNoUnknownEnum("ac_cabin"),
  tyresIncluded: yesNoUnknownEnum("tyres_included"),
  rimsDiscsIncluded: yesNoUnknownEnum("rims_discs_included"),
  batteryIncluded: yesNoUnknownEnum("battery_included"),
  cabinAvailable: yesNoUnknownEnum("cabin_available"),
  engineAvailable: yesNoUnknownEnum("engine_available"),
  documentsAvailable: yesNoUnknownEnum("documents_available"),
  remarks: text("remarks"),
  fleetManagementSoftwareAvailable: availabilityStatusEnum("fleet_management_software_available"),
  insuranceValidity: date("insurance_validity", { mode: "string" }),
  permitValidity: date("permit_validity", { mode: "string" }),
  fitnessStatus: date("fitness_status", { mode: "string" }),
  taxValidity: date("tax_validity", { mode: "string" }),
  parkingDue: integer("parking_due").default(0),
  verifiedBadges: text("verified_badges").array().notNull().default([]),
  inspectionNotes: text("inspection_notes").array().notNull().default([]),
  inquiries: integer("inquiries").notNull().default(0),
  listingStatus: listingStatusEnum("listing_status").notNull().default("PENDING"),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("PENDING_VERIFICATION"),
  isPublished: boolean("is_published").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredAt: timestamp("featured_at"),
  featuredExpiresAt: timestamp("featured_expires_at"),
  featuredBy: integer("featured_by").references(() => users.id, { onDelete: "set null" }),
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
  soldAt: timestamp("sold_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicleMedia = pgTable("vehicle_media", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 100 }).notNull(),
  type: mediaTypeEnum("type").notNull(),
  category: mediaCategoryEnum("category").notNull(),
  customName: text("custom_name"),
  url: text("url").notNull(),
  originalFileName: text("original_file_name").notNull().default(""),
  mimeType: text("mime_type").notNull().default(""),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerVerifiedPhones = pgTable(
  "seller_verified_phones",
  {
    id: serial("id").primaryKey(),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phone: varchar("phone", { length: 20 }).notNull(),
    verifiedAt: timestamp("verified_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sellerPhoneUnique: uniqueIndex("seller_verified_phones_seller_phone_unique").on(
      table.sellerId,
      table.phone
    ),
  })
);

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 100 }).notNull(),
  sellerId: integer("seller_id").notNull(),
  buyerName: text("buyer_name"),
  buyerPhone: varchar("buyer_phone", { length: 20 }),
  source: leadSourceEnum("source").notNull(),
  message: text("message"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financeInquiries = pgTable("finance_inquiries", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 100 }).notNull(),
  sellerId: integer("seller_id"),
  buyerName: text("buyer_name").notNull(),
  buyerPhone: varchar("buyer_phone", { length: 20 }).notNull(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  requirementText: text("requirement_text").notNull(),
  listingTitle: text("listing_title").notNull(),
  listingPrice: integer("listing_price"),
  estimatedEmi: integer("estimated_emi"),
  loanAmount: integer("loan_amount"),
  downPaymentAmount: integer("down_payment_amount"),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull().default("12.00"),
  tenureMonths: integer("tenure_months").notNull().default(36),
  vehicleSnapshot: jsonb("vehicle_snapshot")
    .$type<{
      title: string;
      brand: string | null;
      model: string | null;
      year: number | null;
      listingType: string | null;
      assetStructure: string | null;
      assetCategory: string | null;
      bodyApplicationType: string | null;
      price: number | null;
      location: string | null;
      sellerName: string | null;
      sellerPhone: string | null;
    }>()
    .notNull(),
  status: financeInquiryStatusEnum("status").notNull().default("NEW"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicleSaleFeedback = pgTable("vehicle_sale_feedback", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 100 })
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  soldThroughPlatform: boolean("sold_through_platform"),
  buyerContactMethod: buyerContactMethodEnum("buyer_contact_method"),
  timeToSell: timeToSellEnum("time_to_sell"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedListings = pgTable(
  "saved_listings",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      // Saved records should be removed if the owning user is deleted.
      .references(() => users.id, { onDelete: "cascade" }),
    vehicleId: varchar("vehicle_id", { length: 100 })
      .notNull()
      // Saved records should be removed if the listing itself is deleted.
      .references(() => vehicles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userVehicleUnique: uniqueIndex("saved_listings_user_vehicle_unique").on(
      table.userId,
      table.vehicleId
    ),
  })
);

export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  codeHash: text("code_hash").notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull().default("login"),
  provider: varchar("provider", { length: 20 }).notNull().default("WHATSAPP"),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const featureRequests = pgTable("feature_requests", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 100 })
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  note: text("note"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type DbVehicle = typeof vehicles.$inferSelect;
export type DbVehicleInsert = typeof vehicles.$inferInsert;
export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;
export type DbLead = typeof leads.$inferSelect;
export type DbLeadInsert = typeof leads.$inferInsert;
export type DbFinanceInquiry = typeof financeInquiries.$inferSelect;
export type DbFinanceInquiryInsert = typeof financeInquiries.$inferInsert;
export type DbVehicleSaleFeedback = typeof vehicleSaleFeedback.$inferSelect;
export type DbVehicleSaleFeedbackInsert = typeof vehicleSaleFeedback.$inferInsert;
export type DbVehicleMedia = typeof vehicleMedia.$inferSelect;
export type DbVehicleMediaInsert = typeof vehicleMedia.$inferInsert;
export type DbSellerVerifiedPhone = typeof sellerVerifiedPhones.$inferSelect;
export type DbSellerVerifiedPhoneInsert = typeof sellerVerifiedPhones.$inferInsert;
export type DbSavedListing = typeof savedListings.$inferSelect;
export type DbSavedListingInsert = typeof savedListings.$inferInsert;
export type DbPlatformSetting = typeof platformSettings.$inferSelect;
export type DbOtpCode = typeof otpCodes.$inferSelect;
export type DbOtpCodeInsert = typeof otpCodes.$inferInsert;
export type DbFeatureRequest = typeof featureRequests.$inferSelect;
export type DbFeatureRequestInsert = typeof featureRequests.$inferInsert;

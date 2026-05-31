-- Create new enums for documentation details
CREATE TYPE "validity_status" AS ENUM ('VALID', 'EXPIRED', 'UNKNOWN');
CREATE TYPE "tax_validity_status" AS ENUM ('PAID', 'DUE', 'UNKNOWN');
CREATE TYPE "parking_due_status" AS ENUM ('NO_DUE', 'DUE', 'UNKNOWN');

-- Add documentation detail columns to vehicles table
ALTER TABLE "vehicles"
  ADD COLUMN "insurance_validity" "validity_status",
  ADD COLUMN "permit_validity" "validity_status",
  ADD COLUMN "fitness_status" "validity_status",
  ADD COLUMN "tax_validity" "tax_validity_status",
  ADD COLUMN "parking_due" "parking_due_status";

ALTER TABLE "vehicles"
  ALTER COLUMN "insurance_validity" DROP DEFAULT,
  ALTER COLUMN "permit_validity" DROP DEFAULT,
  ALTER COLUMN "fitness_status" DROP DEFAULT,
  ALTER COLUMN "tax_validity" DROP DEFAULT,
  ALTER COLUMN "parking_due" DROP DEFAULT;

UPDATE "vehicles"
SET "insurance_validity" = NULL
WHERE "insurance_validity" IS NOT NULL
  AND "insurance_validity"::text !~ '^\d{4}-\d{2}-\d{2}$';

ALTER TABLE "vehicles"
  ALTER COLUMN "insurance_validity" TYPE date
  USING "insurance_validity"::text::date;

UPDATE "vehicles"
SET "permit_validity" = NULL
WHERE "permit_validity" IS NOT NULL
  AND "permit_validity"::text !~ '^\d{4}-\d{2}-\d{2}$';

ALTER TABLE "vehicles"
  ALTER COLUMN "permit_validity" TYPE date
  USING "permit_validity"::text::date;

UPDATE "vehicles"
SET "fitness_status" = NULL
WHERE "fitness_status" IS NOT NULL
  AND "fitness_status"::text !~ '^\d{4}-\d{2}-\d{2}$';

ALTER TABLE "vehicles"
  ALTER COLUMN "fitness_status" TYPE date
  USING "fitness_status"::text::date;

UPDATE "vehicles"
SET "tax_validity" = NULL
WHERE "tax_validity" IS NOT NULL
  AND "tax_validity"::text !~ '^\d{4}-\d{2}-\d{2}$';

ALTER TABLE "vehicles"
  ALTER COLUMN "tax_validity" TYPE date
  USING "tax_validity"::text::date;

ALTER TABLE "vehicles"
  ALTER COLUMN "parking_due" TYPE text
  USING "parking_due"::text;

UPDATE "vehicles"
SET "parking_due" = CASE
  WHEN "parking_due" IN ('NO_DUE', 'UNKNOWN', 'DUE') THEN '0'
  WHEN "parking_due" ~ '^\d+$' THEN "parking_due"
  ELSE '0'
END;

ALTER TABLE "vehicles"
  ALTER COLUMN "parking_due" TYPE integer
  USING "parking_due"::integer,
  ALTER COLUMN "parking_due" SET DEFAULT 0;

DROP TYPE IF EXISTS "validity_status";
DROP TYPE IF EXISTS "tax_validity_status";
DROP TYPE IF EXISTS "parking_due_status";

ALTER TABLE "vehicles"
  ALTER COLUMN "insurance_validity" TYPE date USING (
    CASE
      WHEN "insurance_validity" IS NULL THEN NULL
      WHEN "insurance_validity"::text ~ '^\d{4}-\d{2}-\d{2}$' THEN "insurance_validity"::text::date
      ELSE NULL
    END
  ),
  ALTER COLUMN "permit_validity" TYPE date USING (
    CASE
      WHEN "permit_validity" IS NULL THEN NULL
      WHEN "permit_validity"::text ~ '^\d{4}-\d{2}-\d{2}$' THEN "permit_validity"::text::date
      ELSE NULL
    END
  ),
  ALTER COLUMN "fitness_status" TYPE date USING (
    CASE
      WHEN "fitness_status" IS NULL THEN NULL
      WHEN "fitness_status"::text ~ '^\d{4}-\d{2}-\d{2}$' THEN "fitness_status"::text::date
      ELSE NULL
    END
  ),
  ALTER COLUMN "tax_validity" TYPE date USING (
    CASE
      WHEN "tax_validity" IS NULL THEN NULL
      WHEN "tax_validity"::text ~ '^\d{4}-\d{2}-\d{2}$' THEN "tax_validity"::text::date
      ELSE NULL
    END
  ),
  ALTER COLUMN "parking_due" TYPE integer USING (
    CASE
      WHEN "parking_due" IS NULL THEN NULL
      WHEN "parking_due"::text = 'NO_DUE' THEN 0
      WHEN "parking_due"::text = 'DUE' THEN 0
      WHEN "parking_due"::text ~ '^\d+$' THEN "parking_due"::text::integer
      ELSE NULL
    END
  );

DROP TYPE IF EXISTS "validity_status";
DROP TYPE IF EXISTS "tax_validity_status";
DROP TYPE IF EXISTS "parking_due_status";

CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "phone" varchar(20) NOT NULL,
  "code_hash" text NOT NULL,
  "purpose" varchar(50) NOT NULL DEFAULT 'login',
  "provider" varchar(20) NOT NULL DEFAULT 'WHATSAPP',
  "expires_at" timestamp NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "consumed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

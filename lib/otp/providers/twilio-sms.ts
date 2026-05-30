import twilio from "twilio";

export const TWILIO_SMS_PROVIDER = "TWILIO_SMS" as const;

export function checkTwilioEnv(): { ok: true } | { ok: false; missing: string[] } {
  const required = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}

function getTwilioClient() {
  const env = checkTwilioEnv();
  if (!env.ok) {
    const error = new Error("Twilio SMS is not configured.");
    Object.assign(error, { code: "TWILIO_NOT_CONFIGURED", missing: env.missing });
    throw error;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

function isTrialUnverifiedNumberError(error: unknown): boolean {
  const err = error as { code?: number; message?: string };
  const message = String(err?.message ?? "").toLowerCase();
  if (err?.code === 21608) return true;
  return message.includes("trial") && (message.includes("unverified") || message.includes("verified"));
}

export async function sendTwilioOtp(phoneE164: string): Promise<void> {
  const client = getTwilioClient();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

  try {
    await client.verify.v2.services(serviceSid).verifications.create({
      to: phoneE164,
      channel: "sms",
    });
  } catch (error) {
    if (isTrialUnverifiedNumberError(error)) {
      const trialError = new Error(
        "This number may need to be verified in Twilio while using a trial account."
      );
      Object.assign(trialError, { code: "TWILIO_TRIAL_NUMBER_UNVERIFIED" });
      throw trialError;
    }
    throw error;
  }
}

export async function verifyTwilioOtp(phoneE164: string, code: string): Promise<boolean> {
  const client = getTwilioClient();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;
  const check = await client.verify.v2.services(serviceSid).verificationChecks.create({
    to: phoneE164,
    code: code.trim(),
  });
  return check.status === "approved";
}

export function isLeadOtpVerificationEnabled() {
  return process.env.LEAD_OTP_ENABLED === "true";
}

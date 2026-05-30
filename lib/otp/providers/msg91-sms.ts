/**
 * MSG91 SMS OTP provider adapter.
 *
 * The MSG91 SMS flow is widget-based: the client-side MSG91 widget handles OTP
 * delivery and the server only verifies the resulting access token via
 * /api/auth/msg91/verify.  There is no server-side "send" step for this
 * provider — the widget opens in the browser and sends the SMS automatically.
 *
 * This module exists as an explicit part of the provider registry so the OTP
 * service layer can document and enforce which provider is active, without
 * needing to special-case MSG91 everywhere.
 */

export const MSG91_SMS_PROVIDER = "MSG91_SMS" as const;

/**
 * Returns an error explaining that MSG91 SMS uses the widget flow.
 * The login page renders `<Msg91LoginForm>` when this provider is active;
 * calling sendOtp/verifyOtp directly is not supported.
 */
export function sendOtp(): never {
  throw new Error(
    "MSG91 SMS OTP is delivered via the client-side MSG91 widget. " +
      "Use the Msg91LoginForm component which calls /api/auth/msg91/verify."
  );
}

export function verifyOtp(): never {
  throw new Error(
    "MSG91 SMS OTP verification is handled by /api/auth/msg91/verify, " +
      "not by the server-side OTP service."
  );
}

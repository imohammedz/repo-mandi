import { db } from "@/lib/db";
import { bankPartnerInquiries } from "@/lib/schema";
import { normalizeToE164 } from "@/lib/otp/phone";
import { enforceRateLimit, getClientIp, isSameOriginRequest } from "@/lib/rate-limit";
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const SENSITIVE_DATA_PATTERN =
  /\b(otp|password|passcode|pin|cvv|account number|customer account|net banking|netbanking|ifsc|credit card|debit card|card number|expiry|aadhaar|pan number|pan card|secret)\b/i;

const MAX_TEXT_LENGTH = 160;
const MAX_OPTIONAL_MESSAGE_LENGTH = 1000;

const isValidBankEmail = (value: string) => {
  if (!value || value.length > 320 || value.includes(" ")) return false;

  const parts = value.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) return false;
  if (domainPart.startsWith(".") || domainPart.endsWith(".") || !domainPart.includes(".")) return false;

  return true;
};

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return Response.json({ message: "Invalid request origin." }, { status: 403 });
    }

    const ip = getClientIp(request);
    const ipRateLimit = enforceRateLimit({
      key: `bank-inquiries:create:ip:${ip}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipRateLimit.ok) {
      return Response.json(
        { message: "Too many bank inquiry requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipRateLimit.retryAfterSeconds) } },
      );
    }

    const body = (await request.json()) as {
      bankName?: string;
      branchName?: string;
      branchLocation?: string;
      contactPersonName?: string;
      contactNumber?: string;
      bankEmail?: string;
      designation?: string;
      message?: string;
    };

    const bankName = body.bankName?.trim() ?? "";
    const branchName = body.branchName?.trim() ?? "";
    const branchLocation = body.branchLocation?.trim() ?? "";
    const contactPersonName = body.contactPersonName?.trim() ?? "";
    const designation = body.designation?.trim() ?? "";
    const bankEmail = body.bankEmail?.trim().toLowerCase() ?? "";
    const message = body.message?.trim() ?? "";

    if (
      !bankName ||
      !branchName ||
      !branchLocation ||
      !contactPersonName ||
      !designation ||
      !body.contactNumber ||
      !bankEmail
    ) {
      return Response.json(
        {
          message:
            "bankName, branchName, branchLocation, contactPersonName, contactNumber, bankEmail and designation are required.",
        },
        { status: 400 },
      );
    }

    if (
      bankName.length > MAX_TEXT_LENGTH ||
      branchName.length > MAX_TEXT_LENGTH ||
      branchLocation.length > MAX_TEXT_LENGTH ||
      contactPersonName.length > MAX_TEXT_LENGTH ||
      designation.length > MAX_TEXT_LENGTH
    ) {
      return Response.json({ message: `Input fields must be ${MAX_TEXT_LENGTH} characters or less.` }, { status: 400 });
    }

    const contactNumber = normalizeToE164(body.contactNumber);
    if (!contactNumber || !E164_PATTERN.test(contactNumber)) {
      return Response.json({ message: "Enter a valid contact number." }, { status: 400 });
    }

    if (!isValidBankEmail(bankEmail)) {
      return Response.json({ message: "Enter a valid bank email." }, { status: 400 });
    }

    if (message.length > MAX_OPTIONAL_MESSAGE_LENGTH) {
      return Response.json(
        { message: `Message must be ${MAX_OPTIONAL_MESSAGE_LENGTH} characters or less.` },
        { status: 400 },
      );
    }

    const combinedText = `${bankName} ${branchName} ${branchLocation} ${contactPersonName} ${contactNumber} ${designation} ${bankEmail} ${message}`;
    if (SENSITIVE_DATA_PATTERN.test(combinedText)) {
      return Response.json(
        {
          message:
            "Please remove sensitive banking credentials, OTPs, passwords, account details, or payment details from your inquiry.",
        },
        { status: 400 },
      );
    }

    const [inserted] = await db
      .insert(bankPartnerInquiries)
      .values({
        bankName,
        branchName,
        branchLocation,
        contactPersonName,
        contactNumber,
        bankEmail,
        designation,
        message: message || null,
        status: "NEW",
      })
      .returning();

    return Response.json(inserted, { status: 201 });
  } catch (error) {
    console.error("POST /api/bank-inquiries failed", error);
    return Response.json({ message: "Failed to submit bank inquiry." }, { status: 500 });
  }
}

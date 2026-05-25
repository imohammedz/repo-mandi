"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AuthVerifyResponse } from "@/app/auth/types";

// These NEXT_PUBLIC_ vars are inlined at build time for client components.
const MSG91_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID ?? "";
const MSG91_WIDGET_TOKEN = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN ?? "";

type Msg91LoginFormProps = {
  title: string;
  subtitle: string;
  intent?: "default" | "admin";
  backHref?: string;
  initialPhone?: string;
};

type Msg91InitConfig = {
  widgetId: string;
  tokenAuth: string;
  identifier: string;
  exposeMethods?: boolean;
  captchaRenderId?: string;
  success?: (payload: unknown) => void;
  failure?: (payload: unknown) => void;
};

declare global {
  interface Window {
    initSendOTP?: (config: Msg91InitConfig) => void;
  }
}

const REDIRECT_ERROR_MESSAGE = "Unable to finish login right now. Please try again.";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function looksLikeMsg91Token(value: string) {
  return value.length >= 20 && !/\s/.test(value);
}

function extractMsg91Token(payload: unknown) {
  console.log("[MSG91] Widget success payload:", payload);
  const roots = [getObject(payload), getObject(getObject(payload)?.data)];
  for (const root of roots) {
    if (!root) continue;
    for (const key of ["access-token", "accessToken", "token"]) {
      const candidate = getString(root[key]);
      if (candidate) {
        console.log(`[MSG91] Found token in field '${key}':`, candidate.slice(0, 8) + "...");
        return candidate;
      }
    }
    const messageToken = getString(root.message);
    if (messageToken && looksLikeMsg91Token(messageToken)) {
      console.log("[MSG91] Using message field as token");
      return messageToken;
    }
  }
  console.warn("[MSG91] Could not extract access token from payload:", JSON.stringify(payload));
  return null;
}

function extractErrorMessage(payload: unknown) {
  const roots = [getObject(payload), getObject(getObject(payload)?.error), getObject(getObject(payload)?.data)];
  for (const root of roots) {
    if (!root) continue;
    for (const key of ["message", "error", "details", "type"]) {
      const candidate = getString(root[key]);
      if (candidate) return candidate;
    }
  }
  return null;
}

async function waitForMsg91Widget(timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (typeof window !== "undefined" && typeof window.initSendOTP === "function") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("OTP service is unavailable right now. Please try again.");
}

let msg91ScriptLoadPromise: Promise<void> | null = null;

function loadMsg91ScriptWithFallback() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OTP service is unavailable right now. Please try again."));
  }
  if (typeof window.initSendOTP === "function") {
    console.log("[MSG91] Widget already loaded.");
    return Promise.resolve();
  }
  if (msg91ScriptLoadPromise) {
    console.log("[MSG91] Script load already in progress, reusing promise.");
    return msg91ScriptLoadPromise;
  }

  const urls = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];
  console.log("[MSG91] Starting script load with fallback:", urls);

  msg91ScriptLoadPromise = new Promise<void>((resolve, reject) => {
    const attempt = (index: number) => {
      if (index >= urls.length) {
        console.error("[MSG91] All script URLs failed to load.");
        reject(new Error("Unable to load OTP widget. Please check your network and try again."));
        return;
      }

      console.log(`[MSG91] Attempting to load script from: ${urls[index]}`);
      const script = document.createElement("script");
      script.src = urls[index];
      script.async = true;
      script.onload = () => {
        console.log(`[MSG91] Script loaded from: ${urls[index]}, waiting for initSendOTP...`);
        waitForMsg91Widget(6000)
          .then(() => {
            console.log("[MSG91] initSendOTP is ready.");
            resolve();
          })
          .catch((err: unknown) => {
            console.warn(`[MSG91] initSendOTP not found after load from ${urls[index]}, trying fallback.`, err);
            attempt(index + 1);
          });
      };
      script.onerror = (err) => {
        console.warn(`[MSG91] Script failed to load from: ${urls[index]}`, err);
        attempt(index + 1);
      };
      document.head.appendChild(script);
    };

    attempt(0);
  }).catch((error: unknown) => {
    msg91ScriptLoadPromise = null;
    const err = error instanceof Error ? error : new Error("Unable to load OTP widget right now.");
    console.error("[MSG91] Script load failed:", err.message);
    throw err;
  });

  return msg91ScriptLoadPromise;
}

export default function Msg91LoginForm({
  title,
  subtitle,
  intent = "default",
  backHref,
  initialPhone = "",
}: Msg91LoginFormProps) {
  const router = useRouter();
  const [mobile, setMobile] = useState(initialPhone);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!MSG91_WIDGET_ID || !MSG91_WIDGET_TOKEN) {
      console.error(
        "[MSG91] Missing env vars: NEXT_PUBLIC_MSG91_WIDGET_ID and/or NEXT_PUBLIC_MSG91_WIDGET_TOKEN are not set."
      );
    } else {
      console.log("[MSG91] Widget env vars present. ID:", MSG91_WIDGET_ID);
    }

    const load = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) return;

        const data = (await response.json()) as {
          user?: { accountType?: "BUYER" | "SELLER" | "BANK_PARTNER" | "ADMIN"; isProfileComplete?: boolean };
        };

        if (!data.user) return;

        if (intent === "admin") {
          if (data.user.accountType === "ADMIN") {
            router.replace("/admin/dashboard");
          }
          return;
        }

        if (!data.user.isProfileComplete) {
          router.replace("/onboarding");
          return;
        }
        if (data.user.accountType === "SELLER") router.replace("/seller/dashboard");
        else if (data.user.accountType === "BANK_PARTNER") router.replace("/bank/dashboard");
        else if (data.user.accountType === "ADMIN") router.replace("/admin/dashboard");
        else router.replace("/vehicles");
      } catch {
        // ignore
      }
    };

    void load();
  }, [intent, router]);

  const redirectAfterAuth = (data: AuthVerifyResponse) => {
    if (intent === "admin") {
      router.replace("/admin/dashboard");
      return;
    }

    if (data.needsOnboarding || !data.user?.isProfileComplete) {
      router.replace("/onboarding");
    } else if (data.user.accountType === "SELLER") {
      router.replace("/seller/dashboard");
    } else if (data.user.accountType === "BANK_PARTNER") {
      router.replace("/bank/dashboard");
    } else if (data.user.accountType === "ADMIN") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/vehicles");
    }
  };

  const handleContinue = async () => {
    const phone = mobile.replace(/\D/g, "").slice(0, 10);
    if (phone.length !== 10 || submitting) return;

    if (!MSG91_WIDGET_ID || !MSG91_WIDGET_TOKEN) {
      setError("OTP service is not configured. Contact support.");
      console.error("[MSG91] Cannot open widget: missing NEXT_PUBLIC_MSG91_WIDGET_ID or NEXT_PUBLIC_MSG91_WIDGET_TOKEN");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await loadMsg91ScriptWithFallback();

      console.log("[MSG91] Calling initSendOTP with identifier:", `91${phone}`);
      window.initSendOTP?.({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_WIDGET_TOKEN,
        identifier: `91${phone}`,
        exposeMethods: false,
        captchaRenderId: "",
        success: (payload) => {
          const verifiedToken = extractMsg91Token(payload);
          if (!verifiedToken) {
            setError("Failed to read verification token from MSG91.");
            setSubmitting(false);
            return;
          }

          setSubmitting(true);
          void (async () => {
            try {
              console.log("[MSG91] Sending token to /api/auth/msg91/verify...");
              const response = await fetch("/api/auth/msg91/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone,
                  accessToken: verifiedToken,
                  intent: intent === "admin" ? "admin" : undefined,
                }),
              });

              const data = (await response.json()) as AuthVerifyResponse;
              console.log("[MSG91] Verify API response:", response.status, data);

              if (!response.ok) {
                setError(data.message ?? "OTP verification failed. Please try again.");
                return;
              }

              if (intent === "admin" && data.user?.accountType !== "ADMIN") {
                setError("This phone number is not authorized for admin access.");
                return;
              }

              redirectAfterAuth(data);
            } catch (err) {
              console.error("[MSG91] Verify API error:", err);
              setError(REDIRECT_ERROR_MESSAGE);
            } finally {
              setSubmitting(false);
            }
          })();
        },
        failure: (payload) => {
          console.warn("[MSG91] Widget failure callback:", payload);
          setError(extractErrorMessage(payload) ?? "OTP verification failed. Please try again.");
          setSubmitting(false);
        },
      });
    } catch (err) {
      console.error("[MSG91] handleContinue error:", err);
      setError(err instanceof Error ? err.message : "Unable to open OTP widget right now. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-10">
      {backHref ? (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      ) : null}

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Mobile Number</span>
        <div className="flex">
          <span className="inline-flex min-h-12 items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="98XXXXXXXX"
            value={mobile}
            onChange={(event) => setMobile(event.target.value.replace(/\D/g, ""))}
            className="min-h-12 w-full rounded-r-xl border border-slate-200 bg-white px-4 text-base outline-none placeholder:text-slate-400"
          />
        </div>
      </label>

      <button
        onClick={handleContinue}
        disabled={mobile.length !== 10 || submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Opening OTP..." : "Continue"}
      </button>

      <p className="text-center text-xs text-slate-500">
        After you continue, the MSG91 OTP widget will open and verify your number.
      </p>

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
    </main>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import OnboardingClient from "./onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (user.isProfileComplete) {
    if (user.accountType === "SELLER") redirect("/seller/dashboard");
    if (user.accountType === "BANK_PARTNER") redirect("/bank/dashboard");
    if (user.accountType === "ADMIN") redirect("/admin/dashboard");
    redirect("/vehicles");
  }

  return (
    <OnboardingClient
      currentUser={{
        accountType: user.accountType,
        fullName: user.fullName,
        email: user.email,
        sellerRole: user.sellerRole,
        bankRole: user.bankRole,
        city: user.city,
        state: user.state,
        businessName: user.businessName,
        institutionName: user.institutionName,
        branchName: user.branchName,
        employeeId: user.employeeId,
      }}
    />
  );
}


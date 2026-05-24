import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import BankTeamClient from "./team-client";

export const dynamic = "force-dynamic";

export default async function BankTeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.accountType !== "BANK_PARTNER" && user.accountType !== "ADMIN") redirect("/");
  if (user.accountType === "BANK_PARTNER" && !["BANK_ADMIN", "BRANCH_ADMIN", "BANK_MANAGER"].includes(user.bankRole ?? "")) {
    redirect("/bank/dashboard");
  }

  return <BankTeamClient />;
}


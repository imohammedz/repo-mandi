import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminBanksClient from "./banks-client";

export const dynamic = "force-dynamic";

export default async function AdminBanksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.accountType !== "ADMIN") redirect("/admin/login");
  return <AdminBanksClient />;
}

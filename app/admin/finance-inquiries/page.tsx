import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { financeInquiries } from "@/lib/schema";
import FinanceInquiriesClient from "./finance-inquiries-client";

export const dynamic = "force-dynamic";

export default async function AdminFinanceInquiriesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const rows = await db.select().from(financeInquiries).orderBy(desc(financeInquiries.createdAt));
  return <FinanceInquiriesClient initialRows={rows} />;
}

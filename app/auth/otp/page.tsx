import { redirect } from "next/navigation";

export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const params = await searchParams;
  const phone = (params.phone ?? "").replace(/\D/g, "").slice(0, 10);
  redirect(`/auth/login${phone ? `?phone=${encodeURIComponent(phone)}` : ""}`);
}

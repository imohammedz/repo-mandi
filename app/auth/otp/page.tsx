import OtpClientPage from "./otp-client";

export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const params = await searchParams;
  const phone = (params.phone ?? "").replace(/\D/g, "").slice(0, 10);

  return <OtpClientPage phone={phone} />;
}

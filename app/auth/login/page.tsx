import Msg91LoginForm from "@/components/auth/msg91-login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const params = await searchParams;
  const initialPhone = (params.phone ?? "").replace(/\D/g, "").slice(0, 10);

  return (
    <Msg91LoginForm
      title="List Your Vehicle"
      subtitle="Sell repossessed commercial vehicles faster."
      backHref="/sell"
      initialPhone={initialPhone}
    />
  );
}

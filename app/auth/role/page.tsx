import RoleClientPage from "./role-client";

export default async function RolePage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const params = await searchParams;
  const phone = (params.phone ?? "").replace(/\D/g, "").slice(0, 10);

  return <RoleClientPage phone={phone} />;
}

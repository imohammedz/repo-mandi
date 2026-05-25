import Msg91LoginForm from "@/components/auth/msg91-login-form";

export default function AdminLoginPage() {
  return (
    <Msg91LoginForm
      title="Admin Login"
      subtitle="Enter your approved admin number."
      intent="admin"
      widgetId={process.env.NEXT_PUBLIC_MSG91_WIDGET_ID ?? ""}
      widgetToken={process.env.MSG91_WIDGET_TOKEN ?? ""}
    />
  );
}

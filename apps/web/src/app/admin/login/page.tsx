import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { adminFetch } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const response = await adminFetch("/v1/admin/me");
  if (response.ok) {
    redirect("/admin");
  }
  return <AdminLoginForm />;
}

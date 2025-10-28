import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/get-admin-session";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2 border-b border-[var(--divider)] pb-6">
        <p className="text-xs uppercase tracking-[0.32em] text-white/55">
          Admin console
        </p>
        <h1 className="text-3xl font-semibold text-white">Welcome</h1>
        <p className="text-sm text-white/65">
          Signed in as{" "}
          <span className="font-medium text-white">
            {session.email ?? session.uid}
          </span>
          . Upload new assets, manage metadata, and keep the catalog current.
        </p>
      </header>

      <AdminDashboard />
    </div>
  );
}

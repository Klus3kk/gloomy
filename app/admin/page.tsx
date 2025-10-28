import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/get-admin-session";

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
          . This area will host upload management, metadata editing, and QuickDrop monitoring.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-medium text-white">Next steps</h2>
        <ul className="mt-4 space-y-3 text-sm text-white/70">
          <li>• Build the upload workflow backed by Firebase Storage.</li>
          <li>• Surface file metadata from Firestore with admin-only filters.</li>
          <li>• Add QuickDrop analytics and manual link revocation controls.</li>
        </ul>
      </section>
    </div>
  );
}

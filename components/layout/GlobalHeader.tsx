"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";

const NavLink = ({
  href,
  label,
}: {
  href: string;
  label: string;
}) => (
  <Link
    href={href}
    className="rounded-md px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
  >
    {label}
  </Link>
);

export const GlobalHeader = () => {
  const { user, isAdmin, loading, signIn, signOut, error } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--divider)] bg-[var(--base)]/96">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--divider)] text-sm font-semibold tracking-[0.3em] text-white/80">
            GL
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
              Gloomy
            </p>
            <p className="text-sm font-medium text-white">File Delivery Hub</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <NavLink href="/downloads" label="Downloads" />
          <NavLink href="/about" label="About" />
          <NavLink href="/quickdrop" label="QuickDrop" />
          {isAdmin ? <NavLink href="/admin" label="Admin" /> : null}
        </nav>

        <div className="flex items-center gap-3">
          {error ? (
            <p className="text-xs text-rose-300">{error}</p>
          ) : null}
          {loading ? (
            <span className="text-xs text-white/60">Loading…</span>
          ) : user ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-md border border-[var(--divider)] px-4 py-2 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="rounded-md border border-[var(--divider)] px-4 py-2 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

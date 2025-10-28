import Link from "next/link";

export const GlobalFooter = () => (
  <footer className="border-t border-[var(--divider)] bg-[var(--base)]/96 py-8">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
      <p>&copy; {new Date().getFullYear()} ClueSec. Secure file delivery platform.</p>
      <div className="flex gap-5">
        <Link href="/privacy" className="transition hover:text-white">
          Privacy
        </Link>
        <Link href="/terms" className="transition hover:text-white">
          Terms
        </Link>
        <a href="mailto:hello@gloomy.app" className="transition hover:text-white">
          Contact
        </a>
      </div>
    </div>
  </footer>
);

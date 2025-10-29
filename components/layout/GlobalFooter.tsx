import Link from "next/link";

export const GlobalFooter = () => (
  <footer className="border-t border-white/10 bg-transparent py-6">
    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-[11px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
      <p>&copy; {new Date().getFullYear()} Built by ClueSec</p>
      <div className="flex gap-4">
        <a href="mailto:lukaszbielaszewskibiz@gmail.com" className="transition hover:text-white">
          Contact
        </a>
      </div>
    </div>
  </footer>
);

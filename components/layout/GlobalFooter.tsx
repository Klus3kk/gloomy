const GithubIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="currentColor"
    className="opacity-75"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58 0-.28-.01-1.02-.02-2-3.34.73-4.04-1.61-4.04-1.61-.54-1.37-1.32-1.74-1.32-1.74-1.08-.74.08-.73.08-.73 1.19.09 1.82 1.22 1.82 1.22 1.06 1.81 2.79 1.29 3.47.99.11-.77.42-1.29.76-1.59-2.67-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23.96-.27 1.99-.41 3.01-.42 1.02.01 2.05.15 3.01.42 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.61-5.48 5.91.43.37.81 1.1.81 2.22 0 1.6-.02 2.88-.02 3.28 0 .32.22.7.82.58C20.57 21.79 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
  </svg>
);

export const GlobalFooter = () => (
  <footer className="border-t border-white/10 bg-transparent py-6">
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 text-[11px] text-white/55 sm:flex-row sm:justify-between sm:text-xs">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
        <a
          href="https://github.com/Klus3kk"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-white/70 transition hover:text-white"
        >
          <GithubIcon />
          <span className="font-medium text-white/80">Klus3kk</span>
        </a>
        <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden="true" />
        <span className="text-white/60">
          © {new Date().getFullYear()} All rights reserved.
        </span>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <a
          href="mailto:lukaszbielaszewskibiz@gmail.com"
          className="transition hover:text-white"
        >
          Contact
        </a>
      </div>
    </div>
  </footer>
);

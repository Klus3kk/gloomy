export default function AboutPage() {
  return (
    <div className="flex w-full flex-col items-center gap-12 px-4 py-16 sm:px-6">
      <section className="flex w-full max-w-3xl flex-col items-center gap-4 border-b border-[var(--divider)] pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.32em] text-white/55">
          Why it exists
        </p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          Gloomy
        </h1>
        <p className="max-w-3xl text-sm text-white/70 sm:text-base">
          The goal: ship files without dumping them into anonymous storage, keep
          passwords predictable, and make the UI feel like a calm explorer view.
          Building it meant plenty of evenings spent polishing the little
          details: from hover states to the QuickDrop countdown.
        </p>
      </section>

      <section className="grid w-full max-w-3xl gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/55">
            Vision
          </h3>
          <p className="mt-3 text-sm text-white/70">
            Build a download experience that feels handcrafted: minimal friction
            for teammates, intentional guardrails for sensitive artefacts, and a
            look that reflects the care invested in the products those files
            represent.
          </p>
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6 text-left text-sm text-white/70">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/55">
            Under the hood
          </h3>
          <p>
            Next.js, Firebase auth/storage, and Cloudflare at the edge.
            QuickDrop relies on anonymous uploads with signed URLs, and the
            pipeline keeps linting, tests, and Snyk scans on schedule without
            shouting about it in the UI.
          </p>
        </aside>
      </section>
    </div>
  );
}

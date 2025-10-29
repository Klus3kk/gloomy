export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <section className="space-y-4 border-b border-[var(--divider)] pb-8">
        <p className="text-xs uppercase tracking-[0.32em] text-white/55">
          Why it exists
        </p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">Gloomy</h1>
        <p className="max-w-3xl text-sm text-white/70 sm:text-base">
          Gloomy is a private hub for deliveries on gloomyclue.com. The goal: ship files
          without dumping them into anonymous storage, keep passwords predictable, and make
          the UI feel like a calm explorer view. Building it meant plenty of evenings spent
          polishing details - from hover states to the QuickDrop countdown.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <aside className="flex flex-col gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6 text-sm text-white/70">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/55">Under the hood</h3>
          <p>
            Next.js, Firebase auth/storage, and Cloudflare at the edge. QuickDrop uses
            anonymous auth + signed URLs. Tests, linting, and Snyk run on every push.
            That&#39;s the essentials; the rest is polish.
          </p>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/55">Vision</h3>
          <p className="mt-3 text-sm text-white/70">
            Build a download experience that feels handcrafted: minimal friction for 
            teammates, intentional guardrails for sensitive artefacts, and a look that
            reflects the care invested in the products those files represent.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/55">Contact</h3>
          <p className="mt-3 text-sm text-white/70">
            Need access? Curious about the stack? Ping me via the contact route on
            gloomyclue.com. The repo stays private on purpose, but I am always open to
            comparing notes with people who care about the same details.
          </p>
        </div>
      </section>
    </div>
  );
}

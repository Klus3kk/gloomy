export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <section className="space-y-4 border-b border-[var(--divider)] pb-8">
        <p className="text-xs uppercase tracking-[0.32em] text-white/55">
          Why I built it
        </p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">Gloomy</h1>
        <p className="max-w-3xl text-sm text-white/70 sm:text-base">
          Gloomy is the platform I wanted while shipping internal builds—fast to navigate,
          respectful of passwords, and shaped like the explorer views I live in all day.
          Every screen you see here is the product of evenings spent polishing the little
          things: hover states, signed URLs, Cloudflare rules, even the QuickDrop countdown.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-medium text-white">What matters to me</h2>
          <ul className="space-y-4 text-sm text-white/70">
            <li>
              <span className="text-white">Curated catalogue:</span> every asset carries
              metadata, version context, and search-friendly tags so releases never vanish
              into a shared drive abyss.
            </li>
            <li>
              <span className="text-white">Adaptive protection:</span> hashed passwords,
              signed URLs, Cloudflare WAF, and Firebase rules keep private builds gated
              without making teammates jump through hoops.
            </li>
            <li>
              <span className="text-white">QuickDrop tempo:</span> single-use, 60-second
              links with QR codes for those “can you send me that now?” moments.
            </li>
            <li>
              <span className="text-white">Observable operations:</span> unit tests, CI
              linting, and Snyk scans run on every push—no disposable scripts, no half-baked
              pipelines.
            </li>
          </ul>
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6 text-sm text-white/70">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/55">
            Stack Highlights
          </h3>
          <ul className="space-y-3">
            <li>Next.js App Router with a custom dark theme and p5.js ambience.</li>
            <li>Firebase Auth (GitHub + anonymous) and Admin SDK for server authority.</li>
            <li>Firestore metadata + Storage buckets riding behind Cloudflare + CloudFront.</li>
            <li>Node test runner, ESLint, and Snyk stitched into GitHub Actions.</li>
          </ul>
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
            gloomyclue.com. The repo stays private on purpose, but I’m always open to
            comparing notes with people who care about the same details.
          </p>
        </div>
      </section>
    </div>
  );
}

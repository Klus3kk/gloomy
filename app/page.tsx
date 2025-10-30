"use client";
import Link from "next/link";
import { useEffect } from "react";

const focusPoints = [
  {
    title: "Catalog discipline",
    detail: "Categories, ownership, and visibility are first-class fields so teams can find the right artifact quickly.",
  },
  {
    title: "Access patterns",
    detail: "Role-based upload, passwords when required, and signed URLs for every download keep the flow predictable.",
  },
  {
    title: "Fast handoffs",
    detail: "QuickDrop creates a single-use link for 25 MB payloads - ideal for short-lived sharing during reviews.",
  },
];


export default function Home() {
  useEffect(() => {
    const canvas = document.getElementById("particles") as HTMLCanvasElement | null;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let particlesArray: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
    }[] = [];
    let canvasWidth = canvas.width;
    let canvasHeight = canvas.height;

    const updateCanvasSize = () => {
      canvasWidth = canvas.width = window.innerWidth;
      canvasHeight = canvas.height = window.innerHeight;
      particlesArray = [];
      createParticles();
    };

    const createParticles = () => {
      for (let i = 0; i < 120; i += 1) {
        particlesArray.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          size: Math.random() * 3 + 0.5,
          speedX: Math.random() * 1 - 0.5,
          speedY: Math.random() * 1 - 0.5,
        });
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      particlesArray.forEach((particle) => {
        const p = particle;
        p.x += p.speedX * 0.6;
        p.y += p.speedY * 0.6;

        if (p.x > canvasWidth) p.x = 0;
        if (p.x < 0) p.x = canvasWidth;
        if (p.y > canvasHeight) p.y = 0;
        if (p.y < 0) p.y = canvasHeight;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.fill();
      });
      requestAnimationFrame(animateParticles);
    };

    updateCanvasSize();
    createParticles();
    animateParticles();

    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  return (
    <div className="relative flex flex-col gap-16">
      <section className="relative border-b border-[var(--divider)] py-20 sm:py-24">
        <canvas
          id="particles"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-4 sm:gap-16 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="stack-gap text-center md:text-left">
            <header className="stack-gap">
              <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                Precision file distribution
              </p>
              <h1 className="hero-title max-w-2xl text-balance">
                Ship builds and assets with the same care you put into creating them.
              </h1>
              <p className="hero-subtitle max-w-xl text-balance">
                Gloomy keeps binaries, documentation and design artifacts discoverable, governed and ready to share. Focus on the release - let the platform handle access and delivery.
              </p>
            </header>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
              <Link href="/downloads" className="btn w-full sm:w-auto">
                Browse downloads
              </Link>
              <Link
                href="/quickdrop"
                className="inline-flex items-center justify-center rounded-md border border-[var(--divider)] px-5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white w-full sm:w-auto"
              >
                Open QuickDrop
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <dl className="stack-gap rounded-md border border-[var(--divider)] px-4 py-3 text-left">
                <dt className="text-[11px] uppercase tracking-[0.28em] text-white/50">Source of truth</dt>
                <dd className="text-sm text-white/70">
                  Catalogue entries stay searchable and tagged instead of being tossed into anonymous folders.
                </dd>
              </dl>
              <dl className="stack-gap rounded-md border border-[var(--divider)] px-4 py-3 text-left">
                <dt className="text-[11px] uppercase tracking-[0.28em] text-white/50">Password aware</dt>
                <dd className="text-sm text-white/70">
                  Passphrases hash on the client, and every download route verifies before issuing a signed URL.
                </dd>
              </dl>
              <dl className="stack-gap rounded-md border border-[var(--divider)] px-4 py-3 text-left">
                <dt className="text-[11px] uppercase tracking-[0.28em] text-white/50">QuickDrop</dt>
                <dd className="text-sm text-white/70">
                  One-minute links with QR codes for short-lived sharing. Anonymous uploads with a single tap.
                </dd>
              </dl>
            </div>
          </div>

          <div className="stack-gap rounded-md border border-[var(--divider)] p-5 sm:p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">Platform focus</p>
              <p className="mt-1 text-sm text-white/70">
                Designed for teams who prefer clear hierarchies, fast navigation and predictable download flows.
              </p>
            </div>
            <ul className="stack-gap">
              {focusPoints.map((point) => (
                <li key={point.title} className="stack-gap border-t border-[var(--divider)] pt-4 first:border-t-0 first:pt-0">
                  <p className="text-sm font-medium text-white">{point.title}</p>
                  <p className="text-sm text-white/65">{point.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
          <header className="max-w-3xl text-center md:text-left">
            <h2 className="text-3xl font-semibold text-white">Built around the way technical teams share</h2>
            <p className="mt-3 text-sm text-white/70">
              Every screen prioritizes structure and clarity, mirroring file explorers and release dashboards you already trust. The UI fades back so the information stays front and center.
            </p>
          </header>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <article className="stack-gap rounded-md border border-[var(--divider)] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">Explorer-inspired</p>
              <h3 className="text-lg font-medium text-white">Multiple view modes</h3>
              <p className="text-sm text-white/65">
                Switch between dense lists, detail tables, and spacious galleries: no matter the view, metadata remains visible and aligned.
              </p>
            </article>
            <article className="stack-gap rounded-md border border-[var(--divider)] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">Secure by default</p>
              <h3 className="text-lg font-medium text-white">Passwords when needed</h3>
              <p className="text-sm text-white/65">
                Apply passphrases, provide contextual hints, and revoke instantly. Every download route verifies permissions before issuing a signed URL.
              </p>
            </article>
            <article className="stack-gap rounded-md border border-[var(--divider)] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">Short-lived delivery</p>
              <h3 className="text-lg font-medium text-white">QuickDrop shares</h3>
              <p className="text-sm text-white/65">
                Temporary links expire after one minute or a single download, keeping ad hoc handoffs lightweight without sacrificing control.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

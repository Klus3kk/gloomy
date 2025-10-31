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
    <div className="relative flex flex-col gap-24 pb-24">
      <section className="relative overflow-hidden border-b border-[var(--divider)]">
        <canvas
          id="particles"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
        />
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-[var(--accent)]/10 blur-3xl sm:h-72 sm:w-72" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-8 py-6 sm:px-6 sm:py-4 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-10 text-center">
            <header className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                Precision file distribution
              </p>
              <h1 className="hero-title mx-auto max-w-2xl text-balance lg:mx-0">
                Ship builds and assets with the same care you put into creating them.
              </h1>
              <p className="hero-subtitle mx-auto max-w-xl text-balance lg:mx-0">
                Gloomy keeps binaries, documentation and design artifacts discoverable, governed and ready to share. Focus on the release - let the platform handle access and delivery.
              </p>
            </header>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/downloads" className="btn w-full sm:w-auto">
                Browse downloads
              </Link>
              <Link
                href="/quickdrop"
                className="inline-flex w-full items-center justify-center rounded-md border border-white/25 px-5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white sm:w-auto"
              >
                Open QuickDrop
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <dl className="rounded-xl border border-white/15 bg-white/5 p-5 text-left backdrop-blur-sm">
                <dt className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                  Source of truth
                </dt>
                <dd className="mt-2 text-sm text-white/70">
                  Catalogue entries stay searchable and tagged instead of being tossed into anonymous folders.
                </dd>
              </dl>
              <dl className="rounded-xl border border-white/15 bg-white/5 p-5 text-left backdrop-blur-sm">
                <dt className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                  Password aware
                </dt>
                <dd className="mt-2 text-sm text-white/70">
                  Passphrases hash on the client, and every download route verifies before issuing a signed URL.
                </dd>
              </dl>
              <dl className="rounded-xl border border-white/15 bg-white/5 p-5 text-left backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <dt className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                  QuickDrop
                </dt>
                <dd className="mt-2 text-sm text-white/70">
                  One-minute links with QR codes for short-lived sharing. Anonymous uploads with a single tap.
                </dd>
              </dl>
            </div>
          </div>

          <aside className="flex-1 rounded-2xl border border-white/15 bg-white/5 p-6 shadow-[0_30px_80px_-40px_rgba(15,15,35,0.7)] backdrop-blur-xl sm:p-8">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Platform focus
              </p>
              <p className="text-sm text-white/70">
                Designed for teams who prefer clear hierarchies, fast navigation and predictable download flows.
              </p>
            </div>
            <ul className="mt-6 space-y-5">
              {focusPoints.map((point) => (
                <li
                  key={point.title}
                  className="rounded-xl border border-white/15 bg-black/30 p-5 backdrop-blur-sm transition hover:border-white/25"
                >
                  <p className="text-sm font-medium text-white">{point.title}</p>
                  <p className="mt-2 text-sm text-white/65">{point.detail}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="px-2 sm:px-6">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_-30px_rgba(10,10,35,0.8)] backdrop-blur-xl sm:p-10">
          <div className="absolute -top-2 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <header className="relative max-w-3xl text-center lg:text-left">
            <h2 className="text-3xl font-semibold text-white">
              Built around the way technical teams share
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Every screen prioritizes structure and clarity, mirroring file explorers and release dashboards you already trust. The UI fades back so the information stays front and center.
            </p>
          </header>

          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border border-white/15 bg-black/30 p-6 backdrop-blur-sm transition hover:border-white/30">
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                Explorer-inspired
              </p>
              <h3 className="mt-3 text-lg font-medium text-white">Multiple view modes</h3>
              <p className="mt-3 text-sm text-white/65">
                Switch between dense lists, detail tables, and spacious galleries: no matter the view, metadata remains visible and aligned.
              </p>
            </article>
            <article className="rounded-xl border border-white/15 bg-black/30 p-6 backdrop-blur-sm transition hover:border-white/30">
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                Secure by default
              </p>
              <h3 className="mt-3 text-lg font-medium text-white">Passwords when needed</h3>
              <p className="mt-3 text-sm text-white/65">
                Apply passphrases, provide contextual hints, and revoke instantly. Every download route verifies permissions before issuing a signed URL.
              </p>
            </article>
            <article className="rounded-xl border border-white/15 bg-black/30 p-6 backdrop-blur-sm transition hover:border-white/30">
              <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                Short-lived delivery
              </p>
              <h3 className="mt-3 text-lg font-medium text-white">QuickDrop shares</h3>
              <p className="mt-3 text-sm text-white/65">
                Temporary links expire after one minute or a single download, keeping ad hoc handoffs lightweight without sacrificing control.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

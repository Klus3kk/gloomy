"use client";

import { useEffect, useMemo, useState } from "react";

type QuickDropStatus = "pending" | "active" | "expired" | "consumed";

type QuickDropInfo = {
  status: QuickDropStatus;
  fileName: string;
  sizeBytes: number;
  expiresAt: string | null;
  remainingMs: number;
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const useCountdown = (info: QuickDropInfo | null) => {
  const [remaining, setRemaining] = useState<number>(info?.remainingMs ?? 0);

  useEffect(() => {
    if (!info || !info.expiresAt || info.status !== "active") {
      setRemaining(info?.remainingMs ?? 0);
      return undefined;
    }

    const target = new Date(info.expiresAt).getTime();
    const update = () => {
      setRemaining(Math.max(0, target - Date.now()));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [info]);

  return Math.floor(remaining / 1000);
};

export default function QuickDropTokenPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const [info, setInfo] = useState<QuickDropInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/quickdrop/${token}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "QuickDrop not found");
        }
        const data = (await response.json()) as QuickDropInfo;
        setInfo(data);
        setError(null);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load QuickDrop details.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const countdown = useCountdown(info);

  const statusLabel = useMemo(() => {
    if (!info) return "Unknown";
    switch (info.status) {
      case "pending":
        return "Preparing";
      case "active":
        return "Active";
      case "expired":
        return "Expired";
      case "consumed":
        return "Consumed";
      default:
        return "Unknown";
    }
  }, [info]);

  const canDownload = info?.status === "active" && countdown > 0 && !downloading;

  const handleDownload = async () => {
    if (!canDownload) return;
    try {
      setDownloading(true);
      setError(null);
      const response = await fetch(`/api/quickdrop/${token}`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to download");
      }
      const data = (await response.json()) as { downloadUrl: string };
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = info?.fileName ?? "quickdrop";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setInfo((prev) =>
        prev
          ? {
              ...prev,
              status: "consumed",
              remainingMs: 0,
            }
          : prev,
      );
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Download failed.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <header className="space-y-2 border-b border-[var(--divider)] pb-6">
        <p className="text-xs uppercase tracking-[0.32em] text-white/55">
          QuickDrop
        </p>
        <h1 className="text-3xl font-semibold text-white">Secure share</h1>
        <p className="text-sm text-white/65">
          QuickDrop links expire after 60 seconds or the first download.
        </p>
      </header>

      {loading ? (
        <div className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6 text-white/70">
          Loading QuickDrop…
        </div>
      ) : info ? (
        <section className="flex flex-col gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/55">
                Status
              </p>
              <p className="text-lg font-semibold text-white">{statusLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.32em] text-white/55">
                Token
              </p>
              <p className="text-xs text-white/60">{token}</p>
            </div>
          </div>

          <div className="rounded-md border border-[var(--divider)] bg-black/20 px-4 py-3 text-sm text-white/80">
            <p className="font-medium text-white">{info.fileName}</p>
            <p className="text-xs text-white/60">{formatBytes(info.sizeBytes)}</p>
          </div>

          {info.status === "active" ? (
            <p className="text-sm text-white/70">
              Link expires in {countdown} second
              {countdown === 1 ? "" : "s"}.
            </p>
          ) : null}

          {error ? <p className="text-xs text-rose-300">{error}</p> : null}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={!canDownload}
              className="rounded-md border border-white/30 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              {downloading ? "Preparing…" : "Download"}
            </button>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6 text-sm text-white/70">
          {error ?? "QuickDrop not found or already consumed."}
        </div>
      )}
    </div>
  );
}

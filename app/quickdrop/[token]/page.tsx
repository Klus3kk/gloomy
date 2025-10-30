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

type PageProps = {
  params: Promise<{ token: string }>;
};

export default function QuickDropTokenPage({ params }: PageProps) {
  const [token, setToken] = useState<string | null>(null);
  const [info, setInfo] = useState<QuickDropInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    void params.then(({ token: resolved }) => {
      setToken(resolved);
    });
  }, [params]);

  useEffect(() => {
    if (!token) {
      return;
    }

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
    if (!canDownload || !token) return;
    try {
      setDownloading(true);
      setError(null);
      const response = await fetch(`/api/quickdrop/${token}`, {
        method: "POST",
      });
      if (!response.ok) {
        let message = "Unable to download";
        try {
          const data = await response.json();
          if (data && typeof data === "object" && "error" in data) {
            const candidate = (data as { error?: unknown }).error;
            if (typeof candidate === "string") {
              message = candidate;
            }
          }
        } catch {
          // Ignore parse errors
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const suggestedNameHeader = response.headers.get("X-QuickDrop-Filename");
      let suggestedName: string | null = null;
      if (suggestedNameHeader) {
        try {
          suggestedName = decodeURIComponent(suggestedNameHeader);
        } catch {
          suggestedName = suggestedNameHeader;
        }
      }
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download =
        suggestedName && suggestedName.length > 0
          ? suggestedName
          : info?.fileName ?? "quickdrop";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-3 border-b border-[var(--divider)] pb-6 text-center sm:text-left">
        <p className="text-xs uppercase tracking-[0.32em] text-white/55">
          QuickDrop
        </p>
        <h1 className="text-3xl font-semibold text-white">Secure share</h1>
        <p className="text-sm text-white/65">
          QuickDrop links expire after 60 seconds or the first download.
        </p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-[var(--divider)]/80 bg-[var(--surface)]/95 p-6 text-white/70 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-8">
          Loading QuickDrop…
        </div>
      ) : info ? (
        <section className="flex flex-col gap-5 rounded-2xl border border-[var(--divider)]/80 bg-[var(--surface)]/95 p-6 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-8">
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

          <div className="flex flex-wrap items-center gap-3">
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
        <div className="rounded-2xl border border-[var(--divider)]/80 bg-[var(--surface)]/95 p-6 text-sm text-white/70 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-8">
          {error ?? "QuickDrop not found or already consumed."}
        </div>
      )}
    </div>
  );
}

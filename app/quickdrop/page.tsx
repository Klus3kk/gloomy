"use client";

import { useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";
import QRCode from "qrcode";

import { getClientStorage, getClientAuth } from "@/lib/firebase/client";

const MAX_SIZE_BYTES = 25 * 1024 * 1024;

type UploadState = "idle" | "requesting" | "uploading" | "activating";

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

const useCountdown = (expiresAt: string | null) => {
  const [remainingMs, setRemainingMs] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      return undefined;
    }

    const target = new Date(expiresAt).getTime();
    const update = () => {
      setRemainingMs(Math.max(0, target - Date.now()));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const seconds = Math.floor(remainingMs / 1000);
  return seconds;
};

export default function QuickDropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sharePath, setSharePath] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const countdown = useCountdown(expiresAt);

  useEffect(() => {
    const auth = getClientAuth();
    if (auth.currentUser) {
      setReady(true);
      return;
    }

    signInAnonymously(auth)
      .catch((err) => {
        console.error("Anonymous sign-in failed", err);
        setError("Unable to initialise uploader. Refresh and try again.");
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (countdown === 0 && sharePath) {
      setState("idle");
    }
  }, [countdown, sharePath]);

  const link = useMemo(() => {
    if (!sharePath) return null;
    if (typeof window === "undefined") return sharePath;
    return `${window.location.origin}${sharePath}`;
  }, [sharePath]);

  useEffect(() => {
    if (!link) {
      setQrData(null);
      return;
    }

    QRCode.toDataURL(link, {
      errorCorrectionLevel: "M",
      margin: 1,
      color: {
        dark: "#ffffff",
        light: "#00000000",
      },
      width: 160,
    })
      .then((dataUrl) => setQrData(dataUrl))
      .catch((err) => {
        console.error("Failed to generate QR", err);
        setQrData(null);
      });
  }, [link]);

  const reset = () => {
    setFile(null);
    setProgress(0);
    setState("idle");
    setError(null);
    setSharePath(null);
    setExpiresAt(null);
    setToken(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Select a file to upload.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("QuickDrop only supports files up to 25 MB.");
      return;
    }

    try {
      setError(null);
      setState("requesting");

      const initResponse = await fetch("/api/quickdrop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          sizeBytes: file.size,
        }),
      });

      if (!initResponse.ok) {
        const data = await initResponse.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to initialise QuickDrop.");
      }

      const init = (await initResponse.json()) as {
        token: string;
        uploadPath: string;
      };

      setToken(init.token);
      setState("uploading");

      const storage = getClientStorage();
      const storageRef = ref(storage, init.uploadPath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(Math.round(pct));
          },
          (uploadError) => reject(uploadError),
          () => resolve(),
        );
      });

      setState("activating");

      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

      const activateResponse = await fetch(`/api/quickdrop/${init.token}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ downloadUrl }),
      });

      if (!activateResponse.ok) {
        const data = await activateResponse.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to activate QuickDrop.");
      }

      const activate = (await activateResponse.json()) as {
        sharePath: string;
        expiresInMs: number;
      };

      setSharePath(activate.sharePath);
      const expiry = new Date(Date.now() + activate.expiresInMs).toISOString();
      setExpiresAt(expiry);
      setState("idle");
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "QuickDrop failed. Try again.",
      );
      setState("idle");
      setToken(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2 border-b border-[var(--divider)] pb-6">
        <p className="text-xs uppercase tracking-[0.32em] text-white/55">
          QuickDrop
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Share a single-use download
        </h1>
        <p className="text-sm text-white/65">
          Upload files up to 25 MB. Once activated, the link lasts 60 seconds
          and self-destructs after the first download. QuickDrop authenticates
          anonymously, so no sign-in is required. Use responsibly: Cloudflare
          rate limits apply.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6"
      >
        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
          File
          <input
            type="file"
            onChange={(event) => {
              const [picked] = Array.from(event.target.files ?? []);
              setFile(picked ?? null);
              setError(null);
              setSharePath(null);
              setExpiresAt(null);
              setToken(null);
            }}
            className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
          />
          {file ? (
            <span className="text-[11px] text-white/60">
              {file.name} • {formatBytes(file.size)}
            </span>
          ) : (
            <span className="text-[11px] text-white/60">
              Maximum size 25 MB. QuickDrop links expire after 60 seconds.
            </span>
          )}
        </label>

        {progress > 0 && state !== "idle" ? (
          <div className="h-2 rounded bg-white/10">
            <div
              className="h-full rounded bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}

        {!ready ? (
          <p className="text-xs text-white/60">
            Initialising uploader… ensure third-party cookies are enabled.
          </p>
        ) : null}
        {error ? <p className="text-xs text-rose-300">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!ready || state !== "idle" || !file}
            className="rounded-md border border-white/30 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {state === "requesting"
              ? "Preparing…"
              : state === "uploading"
                ? "Uploading…"
                : state === "activating"
                  ? "Activating…"
                  : "Generate link"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </form>

      {link ? (
        <section className="flex flex-col gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-medium text-white">Share link</h2>
          <p className="text-sm text-white/60">
            This link expires in {countdown} second{countdown === 1 ? "" : "s"}
            {" "}
            or immediately after it is downloaded once.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-md border border-[var(--divider)] bg-black/30 px-3 py-2 text-xs text-white/80">
              {link}
            </code>
            <button
              type="button"
              onClick={() => {
                if (!link) return;
                void navigator.clipboard.writeText(link);
              }}
              className="rounded-md border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
            >
              Copy link
            </button>
          </div>
          {qrData ? (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="rounded-md border border-[var(--divider)] bg-black/20 p-4">
                <img src={qrData} alt="QuickDrop QR" className="h-32 w-32" />
              </div>
              <p className="text-xs text-white/60">
                Scan the QR code to download on another device. The link remains active while the countdown is running.
              </p>
            </div>
          ) : null}
          <p className="text-xs text-white/55">
            Token: {token}
          </p>
        </section>
      ) : null}
    </div>
  );
}

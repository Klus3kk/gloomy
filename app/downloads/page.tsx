"use client";

import { useEffect, useMemo, useState } from "react";

type FileVisibility = "public" | "password";

interface DownloadFile {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: FileVisibility;
  passwordHint?: string;
  sizeBytes: number;
  createdAt: string;
  tags: string[];
  hasPassword: boolean;
}

interface CatalogResponse {
  generatedAt: string;
  categories: string[];
  files: DownloadFile[];
  note?: string;
  error?: string;
}

interface PasswordDialogState {
  file: DownloadFile;
  value: string;
  error: string | null;
  loading: boolean;
}

type ViewMode = "gallery" | "list" | "details";

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const fetchCatalog = async (): Promise<CatalogResponse> => {
  const response = await fetch("/api/catalog");
  const payload = (await response.json()) as CatalogResponse;
  if (!response.ok) {
    throw new Error(
      payload.error ?? `Failed to load catalog: ${response.statusText}`,
    );
  }
  return payload;
};

const visibilityLabel: Record<FileVisibility, string> = {
  public: "Public",
  password: "Password",
};

const visibilityBadgeClass: Record<FileVisibility, string> = {
  public: "bg-white/10 text-white/70",
  password: "bg-white/5 text-white/70",
};

export default function DownloadsPage() {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] =
    useState<FileVisibility | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [passwordDialog, setPasswordDialog] =
    useState<PasswordDialogState | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadInFlight, setDownloadInFlight] = useState<string | null>(null);
  const [catalogNote, setCatalogNote] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const catalog = await fetchCatalog();
        if (isMounted) {
          setFiles(catalog.files);
          setCatalogNote(catalog.note ?? null);
          setError(null);
        }
      } catch (catalogError) {
        if (isMounted) {
          setError((catalogError as Error).message);
          setCatalogNote(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const base = new Set<string>();
    files.forEach((file) => base.add(file.category));
    return ["all", ...Array.from(base).sort()];
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        file.title.toLowerCase().includes(term) ||
        file.description.toLowerCase().includes(term) ||
        file.tags.some((tag) => tag.toLowerCase().includes(term));

      const matchesCategory =
        selectedCategory === "all" || file.category === selectedCategory;

      const matchesVisibility =
        visibilityFilter === "all" || file.visibility === visibilityFilter;

      return matchesSearch && matchesCategory && matchesVisibility;
    });
  }, [files, searchTerm, selectedCategory, visibilityFilter]);

const triggerDownload = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const requestDownloadUrl = async (id: string, password?: string) => {
  const response = await fetch("/api/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, password }),
  });

  const payload = (await response.json()) as {
    downloadUrl?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Download request failed.");
  }

  if (!payload.downloadUrl) {
    throw new Error("Download URL missing in response.");
  }

  return payload.downloadUrl;
};

  const handleDownloadRequest = async (file: DownloadFile) => {
    if (file.hasPassword) {
      setPasswordDialog({ file, value: "", error: null, loading: false });
      return;
    }

    try {
      setDownloadError(null);
      setDownloadInFlight(file.id);
      const url = await requestDownloadUrl(file.id);
      triggerDownload(url, file.title);
    } catch (downloadErr) {
      setDownloadError(
        downloadErr instanceof Error
          ? downloadErr.message
          : "Unable to start download.",
      );
    } finally {
      setDownloadInFlight(null);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordDialog) return;

    const attempt = passwordDialog.value.trim();
    if (!attempt) {
      setPasswordDialog({
        ...passwordDialog,
        error: "Enter the password to continue.",
      });
      return;
    }

    try {
      setPasswordDialog({ ...passwordDialog, loading: true, error: null });
      const url = await requestDownloadUrl(passwordDialog.file.id, attempt);
      setPasswordDialog(null);
      triggerDownload(url, passwordDialog.file.title);
    } catch (verifyError) {
      setPasswordDialog({
        ...passwordDialog,
        loading: false,
        error:
          verifyError instanceof Error
            ? verifyError.message
            : "Password verification failed.",
      });
    }
  };

  const viewOptions: {
    id: ViewMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "gallery",
      label: "Gallery",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="8" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
          <rect x="13" y="13" width="8" height="8" rx="2" />
        </svg>
      ),
    },
    {
      id: "list",
      label: "List",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" d="M5 7h14M5 12h9M5 17h14" />
          <circle cx="4" cy="7" r="1.5" fill="currentColor" />
          <circle cx="4" cy="17" r="1.5" fill="currentColor" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "details",
      label: "Details",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path strokeLinecap="round" d="M9 9h9M9 13h9M9 17h4" />
          <circle cx="7" cy="9" r="1" fill="currentColor" />
          <circle cx="7" cy="13" r="1" fill="currentColor" />
          <circle cx="7" cy="17" r="1" fill="currentColor" />
        </svg>
      ),
    },
  ];

  const renderIcon = (file: DownloadFile) => {
    const initials = file.title
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--divider)] text-xs font-semibold text-white/80">
        {initials}
      </span>
    );
  };

  const renderGalleryView = () => (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {filteredFiles.map((file) => (
        <article
          key={file.id}
          className="group flex h-full flex-col justify-between rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-5 transition hover:border-white/35"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {renderIcon(file)}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {file.title}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    {file.category}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${visibilityBadgeClass[file.visibility]}`}
              >
                {visibilityLabel[file.visibility]}
              </span>
            </div>
            <p className="text-sm text-white/70">{file.description}</p>
            <div className="flex flex-wrap gap-2 text-[11px] text-white/60">
              {file.tags.map((tag) => (
                <span
                  key={`${file.id}-${tag}`}
                  className="rounded-sm border border-[var(--divider)] px-2 py-1 transition group-hover:border-white/40 group-hover:text-white"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-white/65">
            <div>
              <p>Added {formatDate(file.createdAt)}</p>
              <p>{formatBytes(file.sizeBytes)}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleDownloadRequest(file)}
              disabled={downloadInFlight === file.id}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--divider)] px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-50"
            >
              {downloadInFlight === file.id ? "Preparing…" : "Download"}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v10m0 0-4-4m4 4 4-4M5 19h14" />
              </svg>
            </button>
          </div>
          {file.hasPassword && file.passwordHint && (
            <p className="mt-4 rounded-md border border-[var(--divider)] px-3 py-2 text-xs text-white/65">
              <span className="font-medium text-white/70">Hint:</span> {file.passwordHint}
            </p>
          )}
        </article>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--surface)] text-sm text-white">
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-[var(--divider)] px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-white/55">
        <span>Name</span>
        <span>Description</span>
        <span>Size</span>
        <span>Visibility</span>
      </div>
      <div className="divide-y divide-[var(--divider)]">
        {filteredFiles.map((file) => (
          <div
            key={`list-${file.id}`}
            className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-6 py-4 hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              {renderIcon(file)}
              <div>
                <p className="text-sm font-semibold text-white">{file.title}</p>
                <p className="text-xs text-white/60">Added {formatDate(file.createdAt)}</p>
              </div>
            </div>
            <p className="text-xs text-white/65">{file.description}</p>
            <p className="text-xs text-white/60">{formatBytes(file.sizeBytes)}</p>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-sm px-2.5 py-1 text-[11px] ${visibilityBadgeClass[file.visibility]}`}
              >
                {visibilityLabel[file.visibility]}
              </span>
              <button
                type="button"
                onClick={() => void handleDownloadRequest(file)}
                disabled={downloadInFlight === file.id}
                className="rounded-sm border border-[var(--divider)] px-3 py-1 text-[11px] font-medium text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
              >
                {downloadInFlight === file.id ? "Preparing…" : "Download"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetailsView = () => (
    <div className="overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--surface)] text-sm text-white">
      <table className="min-w-full border-collapse">
        <thead className="border-b border-[var(--divider)] bg-white/5 text-[11px] uppercase tracking-[0.25em] text-white/55">
          <tr>
            <th className="px-6 py-3 text-left font-medium">File</th>
            <th className="px-6 py-3 text-left font-medium">Category</th>
            <th className="px-6 py-3 text-left font-medium">Tags</th>
            <th className="px-6 py-3 text-left font-medium">Size</th>
            <th className="px-6 py-3 text-left font-medium">Added</th>
            <th className="px-6 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--divider)]">
          {filteredFiles.map((file) => (
            <tr key={`details-${file.id}`} className="hover:bg-white/5">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  {renderIcon(file)}
                  <div>
                    <p className="text-sm font-semibold text-white">{file.title}</p>
                    <p className="text-xs text-white/60">{file.description}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-white/65">
                {file.category}
              </td>
              <td className="px-6 py-4 text-xs text-white/65">
                {file.tags.map((tag) => `#${tag}`).join(" · ")}
              </td>
              <td className="px-6 py-4 text-xs text-white/60">{formatBytes(file.sizeBytes)}</td>
              <td className="px-6 py-4 text-xs text-white/60">{formatDate(file.createdAt)}</td>
              <td className="px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => void handleDownloadRequest(file)}
                  disabled={downloadInFlight === file.id}
                  className="inline-flex items-center gap-2 rounded-sm border border-[var(--divider)] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                >
                  {downloadInFlight === file.id ? "Preparing…" : "Download"}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-4 w-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v10m0 0-4-4m4 4 4-4M5 19h14" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-6 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-8 text-white/70">
          <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
          <div className="grid gap-4 pt-2 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex h-40 flex-col justify-between rounded-lg border border-[var(--divider)] bg-white/5/10 p-4"
              >
                <div className="h-6 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-8 text-sm text-white/80">
          <h2 className="text-xl font-semibold text-white">Unable to load downloads</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              setCatalogNote(null);
              fetchCatalog()
                .then((catalog) => {
                  setFiles(catalog.files);
                  setCatalogNote(catalog.note ?? null);
                })
                .catch((catalogError) =>
                  setError((catalogError as Error).message),
                )
                .finally(() => setLoading(false));
            }}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--divider)] px-4 py-2 text-xs font-medium text-white/75 transition hover:border-white/40 hover:text-white"
          >
            Try again
          </button>
        </div>
      );
    }

    if (filteredFiles.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-12 text-center text-white/70">
          <h2 className="text-xl font-semibold text-white">No files found</h2>
          <p className="max-w-md text-sm">
            Adjust your filters or search terms to jump to the release you are looking for.
          </p>
        </div>
      );
    }

    if (viewMode === "gallery") return renderGalleryView();
    if (viewMode === "list") return renderListView();
    return renderDetailsView();
  };

  return (
    <div className="relative min-h-screen pb-24 pt-12">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-white/55">Downloads</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Library
          </h1>
          <p className="max-w-2xl text-sm text-white/65">
            Navigate releases through explorer-style layouts. Filter by category, visibility, and tags to reach the correct artifact without losing context.
          </p>
        </header>

        <section className="flex flex-col gap-6 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
          {catalogNote ? (
            <div className="rounded-md border border-[var(--divider)] bg-white/5 px-4 py-3 text-xs text-white/65">
              {catalogNote}
            </div>
          ) : null}

          {downloadError ? (
            <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {downloadError}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-md px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition ${
                      isActive
                        ? "bg-white text-black"
                        : "border border-[var(--divider)] text-white/70 hover:border-white/35 hover:text-white"
                    }`}
                  >
                    {category === "all"
                      ? "All"
                      : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <input
                  type="search"
                  placeholder="Search files, tags, descriptions, or password hints"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-10 w-full rounded-md border border-[var(--divider)] bg-transparent px-4 text-sm text-white placeholder:text-white/40 focus:border-white/35 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                  ⌕
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[var(--divider)] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-white/60">
                <label htmlFor="visibility-filter" className="text-[11px]">
                  Visibility
                </label>
                <select
                  id="visibility-filter"
                  value={visibilityFilter}
                  onChange={(event) =>
                    setVisibilityFilter(event.target.value as typeof visibilityFilter)
                  }
                  className="rounded-sm border border-transparent bg-transparent px-2 py-1 text-[11px] text-white focus:border-white/35 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="public">Public</option>
                  <option value="password">Password</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[var(--divider)] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-white/60">
                <span>View</span>
                <div className="flex items-center gap-1">
                  {viewOptions.map((option) => {
                    const isActive = viewMode === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setViewMode(option.id)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                          isActive
                            ? "border-white/40 bg-white/10 text-white"
                            : "border-[var(--divider)] text-white/50 hover:border-white/35 hover:text-white"
                        }`}
                        aria-label={`Use ${option.label} view`}
                      >
                        {option.icon}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {renderContent()}
      </div>

      {passwordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-sm rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold text-white">Enter password</h2>
            <p className="mt-2 text-sm text-white/70">
              {passwordDialog.file.title} is locked. Provide the passphrase to continue.
            </p>

            {passwordDialog.file.hasPassword && passwordDialog.file.passwordHint && (
              <p className="mt-3 rounded-md border border-[var(--divider)] px-3 py-2 text-xs text-white/65">
                <span className="mr-2 font-medium text-white/70">
                  Hint
                </span>
                {passwordDialog.file.passwordHint}
              </p>
            )}

            <div className="mt-5 space-y-3">
              <input
                type="password"
                autoFocus
                value={passwordDialog.value}
                onChange={(event) =>
                  setPasswordDialog({
                    ...passwordDialog,
                    value: event.target.value,
                    error: null,
                  })
                }
                placeholder="Password"
                className="h-10 w-full rounded-md border border-[var(--divider)] bg-transparent px-4 text-sm text-white placeholder:text-white/40 focus:border-white/35 focus:outline-none focus:ring-1 focus:ring-white/25"
              />
              {passwordDialog.error && (
                <p className="text-xs text-rose-300">{passwordDialog.error}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPasswordDialog(null)}
                className="rounded-md border border-[var(--divider)] px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/35 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordSubmit}
                disabled={passwordDialog.loading}
                className="rounded-md bg-white px-5 py-2 text-xs font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {passwordDialog.loading ? "Verifying…" : "Unlock & Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

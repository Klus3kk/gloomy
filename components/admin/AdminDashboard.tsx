"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { getClientStorage } from "@/lib/firebase/client";
import { hashPassword } from "@/lib/security/password";

type AdminFile = {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: "public" | "password";
  downloadUrl: string;
  storagePath: string;
  sizeBytes: number;
  passwordHint: string | null;
  hasPassword: boolean;
  deleteAfterDownload: boolean;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

type UploadState = "idle" | "uploading" | "saving";

const formatSize = (size: number) => {
  if (!Number.isFinite(size) || size <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const UploadForm = ({
  onCreated,
}: {
  onCreated: (file: AdminFile) => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("uncategorized");
  const [visibility, setVisibility] = useState<"public" | "password">("public");
  const [password, setPassword] = useState("");
  const [passwordHint, setPasswordHint] = useState("");
  const [tags, setTags] = useState("");
  const [deleteAfterDownload, setDeleteAfterDownload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("uncategorized");
    setVisibility("public");
    setPassword("");
    setPasswordHint("");
    setTags("");
    setDeleteAfterDownload(false);
    setFile(null);
    setProgress(0);
    setState("idle");
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Select a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Provide a title for the asset.");
      return;
    }
    if (visibility === "password" && !password.trim()) {
      setError("Provide a password for this asset.");
      return;
    }

    try {
      setState("uploading");
      setError(null);
      const storage = getClientStorage();
      const fileId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const storagePath = `catalog/${fileId}/${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(Math.round(pct));
          },
          (uploadError) => reject(uploadError),
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (downloadError) {
              reject(downloadError);
            }
          },
        );
      }).then(async (downloadUrl) => {
        setState("saving");
        let passwordHash: string | null = null;
        let passwordSalt: string | null = null;

        if (visibility === "password") {
          const hashed = await hashPassword(password.trim());
          passwordHash = hashed.hash;
          passwordSalt = hashed.salt;
        }

        const response = await fetch("/api/admin/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description,
            category: category.trim(),
            visibility,
            passwordHash,
            passwordSalt,
            passwordHint:
              visibility === "password" ? passwordHint || null : null,
            tags,
            deleteAfterDownload,
            downloadUrl,
            storagePath,
            sizeBytes: file.size,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Unable to save file metadata.");
        }

        const data = (await response.json()) as { file: AdminFile };
        onCreated(data.file);
        resetForm();
      });
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Upload failed. Try again.",
      );
      setState("idle");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6"
    >
      <div>
        <h2 className="text-lg font-medium text-white">Upload new asset</h2>
        <p className="text-sm text-white/60">
          Upload a file to Firebase Storage and register its metadata.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
          Category
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="h-24 rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
          Visibility
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as "public" | "password")
            }
            className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
          >
            <option value="public">Public</option>
            <option value="password">Password</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
          Tags
          <input
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="comma,separated,tags"
            className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-md border border-[var(--divider)] px-3 py-3 text-xs text-white/70">
        <input
          type="checkbox"
          checked={deleteAfterDownload}
          onChange={(event) => setDeleteAfterDownload(event.target.checked)}
          className="mt-1 h-4 w-4 accent-white"
        />
        <span className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.25em] text-white/55">
            Auto delete after download
          </span>
          <span className="text-xs normal-case text-white/60">
            Remove the asset immediately after the first successful download.
          </span>
        </span>
      </label>

      {visibility === "password" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
            Password
            <input
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
            Hint
            <input
              type="text"
              value={passwordHint}
              onChange={(event) => setPasswordHint(event.target.value)}
              className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
            />
          </label>
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
        File
        <input
          type="file"
          onChange={(event) => {
            const [picked] = Array.from(event.target.files ?? []);
            setFile(picked ?? null);
          }}
          className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
        />
      </label>

      {progress > 0 && state !== "idle" ? (
        <div className="h-2 rounded bg-white/10">
          <div
            className="h-full rounded bg-white"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={state !== "idle"}
          className="rounded-md border border-white/30 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {state === "uploading"
            ? "Uploading…"
            : state === "saving"
              ? "Saving…"
              : "Upload"}
        </button>
      </div>
    </form>
  );
};

const EditModal = ({
  file,
  onClose,
  onUpdated,
}: {
  file: AdminFile;
  onClose: () => void;
  onUpdated: (file: AdminFile) => void;
}) => {
  const [title, setTitle] = useState(file.title);
  const [description, setDescription] = useState(file.description);
  const [category, setCategory] = useState(file.category);
  const [visibility, setVisibility] = useState<"public" | "password">(
    file.visibility,
  );
  const [newPassword, setNewPassword] = useState("");
  const [passwordHint, setPasswordHint] = useState(file.passwordHint ?? "");
  const [downloadUrl, setDownloadUrl] = useState(file.downloadUrl);
  const [tags, setTags] = useState(file.tags.join(", "));
  const [deleteAfterDownload, setDeleteAfterDownload] = useState(
    file.deleteAfterDownload,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let passwordHash: string | null | undefined;
      let passwordSalt: string | null | undefined;
      let passwordHintPayload: string | null | undefined;

      if (visibility === "password") {
        passwordHintPayload = passwordHint.trim() || null;
        if (newPassword.trim()) {
          const hashed = await hashPassword(newPassword.trim());
          passwordHash = hashed.hash;
          passwordSalt = hashed.salt;
        } else if (!file.hasPassword) {
          setError("Provide a password for this asset.");
          setSaving(false);
          return;
        }
      } else {
        passwordHash = null;
        passwordSalt = null;
        passwordHintPayload = null;
      }

      const response = await fetch(`/api/admin/files/${file.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          category,
          visibility,
          passwordHash,
          passwordSalt,
          passwordHint: passwordHintPayload,
          tags,
          deleteAfterDownload,
          downloadUrl: downloadUrl.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to update metadata.");
      }

      const data = (await response.json()) as { file: AdminFile };
      onUpdated(data.file);
      onClose();
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update metadata.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Edit metadata</h3>
            <p className="text-xs text-white/60">
              Update how this asset appears to end users.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-24 rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
            Category
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
            Tags
            <input
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="comma,separated,tags"
              className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
            />
          </label>
        </div>

        <label className="flex items-start gap-3 rounded-md border border-[var(--divider)] px-3 py-3 text-xs text-white/70">
          <input
            type="checkbox"
            checked={deleteAfterDownload}
            onChange={(event) => setDeleteAfterDownload(event.target.checked)}
            className="mt-1 h-4 w-4 accent-white"
          />
          <span className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.25em] text-white/55">
              Auto delete after download
            </span>
            <span className="text-xs normal-case text-white/60">
              Remove the asset immediately after the first successful download.
            </span>
          </span>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
            Visibility
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "public" | "password")
              }
              className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="password">Password</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
            Download URL
            <input
              type="text"
              value={downloadUrl}
              onChange={(event) => setDownloadUrl(event.target.value)}
              className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
            />
          </label>
        </div>

        {visibility === "password" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
              New password
              <input
                type="text"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={file.hasPassword ? "Leave blank to keep current" : "Enter password"}
                className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.25em] text-white/55">
              Hint
              <input
                type="text"
                value={passwordHint}
                onChange={(event) => setPasswordHint(event.target.value)}
                className="rounded-md border border-[var(--divider)] bg-transparent px-3 py-2 text-sm text-white focus:border-white/35 focus:outline-none"
              />
            </label>
          </div>
        ) : null}

        {error ? <p className="text-xs text-rose-300">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md border border-white/30 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

const DeleteConfirm = ({
  file,
  onClose,
  onDeleted,
}: {
  file: AdminFile;
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/files/${file.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to delete asset.");
      }

      onDeleted();
      onClose();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to remove asset.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-md rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
        <h3 className="text-lg font-semibold text-white">Remove asset</h3>
        <p className="mt-2 text-sm text-white/70">
          The asset <span className="font-medium text-white">{file.title}</span>{" "}
          will be hidden and marked for removal. You can re-upload it later if needed.
        </p>
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={submitting}
            className="rounded-md border border-rose-500/40 px-4 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            {submitting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<AdminFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<AdminFile | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/files");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to load admin files.");
      }
      const data = (await response.json()) as { files: AdminFile[] };
      setFiles(data.files);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load admin files.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const handleFileUpdated = useCallback((updated: AdminFile) => {
    setFiles((prev) =>
      prev.map((existing) =>
        existing.id === updated.id
          ? {
              ...existing,
              ...updated,
            }
          : existing,
      ),
    );
  }, []);

  const handleFileDeleted = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const recentFiles = useMemo(
    () =>
      [...files].sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      }),
    [files],
  );

  return (
    <div className="flex flex-col gap-8">
      <UploadForm
        onCreated={(file) => {
          setFiles((prev) => [file, ...prev]);
        }}
      />

      <section className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">Library assets</h2>
            <p className="text-sm text-white/60">
              {loading
                ? "Loading assets…"
                : `${recentFiles.length} asset${recentFiles.length === 1 ? "" : "s"} registered.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadFiles()}
            className="rounded-md border border-white/20 px-3 py-2 text-xs text-white/75 transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <p className="mt-4 text-xs text-rose-300">{error}</p>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm text-white/80">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.25em] text-white/50">
                <th className="border-b border-[var(--divider)] px-4 py-2">
                  Title
                </th>
                <th className="border-b border-[var(--divider)] px-4 py-2">
                  Category
                </th>
                <th className="border-b border-[var(--divider)] px-4 py-2">
                  Visibility
                </th>
                <th className="border-b border-[var(--divider)] px-4 py-2">
                  Size
                </th>
                <th className="border-b border-[var(--divider)] px-4 py-2">
                  Retention
                </th>
                <th className="border-b border-[var(--divider)] px-4 py-2">
                  Created
                </th>
                <th className="border-b border-[var(--divider)] px-4 py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map((file) => (
                <tr key={file.id} className="hover:bg-white/5">
                  <td className="border-b border-[var(--divider)] px-4 py-3 text-sm text-white">
                    <div className="font-medium">{file.title}</div>
                    <div className="text-xs text-white/50">
                      {file.description || "—"}
                    </div>
                  </td>
                  <td className="border-b border-[var(--divider)] px-4 py-3 text-xs uppercase tracking-[0.25em] text-white/60">
                    {file.category}
                  </td>
                  <td className="border-b border-[var(--divider)] px-4 py-3 text-xs text-white/70">
                    {file.visibility === "password" ? "Password" : "Public"}
                  </td>
                  <td className="border-b border-[var(--divider)] px-4 py-3 text-xs text-white/60">
                    {formatSize(file.sizeBytes)}
                  </td>
                  <td className="border-b border-[var(--divider)] px-4 py-3 text-xs text-white/65">
                    {file.deleteAfterDownload ? "One-time" : "Persistent"}
                  </td>
                  <td className="border-b border-[var(--divider)] px-4 py-3 text-xs text-white/60">
                    {file.createdAt
                      ? new Date(file.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="border-b border-[var(--divider)] px-4 py-3 text-right text-xs">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingFile(file)}
                        className="rounded-md border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingFile(file)}
                        className="rounded-md border border-rose-500/40 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && recentFiles.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-white/60">
            No assets yet. Upload to populate the library.
          </div>
        ) : null}
      </section>

      {editingFile ? (
        <EditModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onUpdated={handleFileUpdated}
        />
      ) : null}

      {deletingFile ? (
        <DeleteConfirm
          file={deletingFile}
          onClose={() => setDeletingFile(null)}
          onDeleted={() => handleFileDeleted(deletingFile.id)}
        />
      ) : null}
    </div>
  );
};

import type {
  DocumentData,
  DocumentReference,
  Timestamp,
} from "firebase-admin/firestore";

import { adminDb, adminStorage } from "@/lib/firebase/admin";

const CLEANUP_GRACE_MS = 15_000;

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return value;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
};

const safeDeleteStorageObject = async (storagePath: string | null) => {
  if (!storagePath) return;
  try {
    const storage = adminStorage();
    const bucket = storage.bucket();
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
  } catch (error) {
    console.error(
      `Failed to delete QuickDrop payload at ${storagePath}`,
      error,
    );
  }
};

export const deleteQuickDropPayload = async (
  ref: DocumentReference<DocumentData>,
  data: DocumentData,
) => {
  const storagePath =
    typeof data.storagePath === "string" ? data.storagePath : null;
  await safeDeleteStorageObject(storagePath);
  try {
    await ref.delete();
  } catch (error) {
    console.error(
      `Failed to delete QuickDrop record for ${ref.id}`,
      error,
    );
  }
};

export const cleanupExpiredQuickDrops = async (limit = 10) => {
  try {
    const db = adminDb();
    const cutoff = new Date(Date.now() - CLEANUP_GRACE_MS);
    const snapshot = await db
      .collection("quickdrop")
      .where("expiresAt", "<=", cutoff)
      .limit(limit)
      .get();

    if (snapshot.empty) {
      return;
    }

    await Promise.all(
      snapshot.docs.map((doc) => deleteQuickDropPayload(doc.ref, doc.data())),
    );
  } catch (error) {
    console.error("Failed to cleanup expired QuickDrop payloads", error);
  }
};

export const isExpired = (
  expiresAt: Timestamp | Date | null | undefined,
  graceMs = 0,
) => {
  const date = toDate(expiresAt);
  if (!date) return false;
  return date.getTime() <= Date.now() - graceMs;
};

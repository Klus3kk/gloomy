import type {
  DocumentData,
  DocumentReference,
  Timestamp,
} from "firebase-admin/firestore";

import { adminDb, adminStorage } from "@/lib/firebase/admin";
import {
  QUICKDROP_CLEANUP_GRACE_MS,
  QUICKDROP_PENDING_EXPIRY_MS,
} from "@/lib/quickdrop/constants";

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
    const now = Date.now();
    const cutoff = new Date(now - QUICKDROP_CLEANUP_GRACE_MS);
    const pendingCutoff = new Date(now - QUICKDROP_PENDING_EXPIRY_MS);

    const [expiredSnapshot, staleSnapshot] = await Promise.all([
      db
        .collection("quickdrop")
        .where("expiresAt", "<=", cutoff)
        .limit(limit)
        .get(),
      db.collection("quickdrop").where("expiresAt", "==", null).limit(limit).get(),
    ]);

    const entries = new Map<
      string,
      { ref: DocumentReference<DocumentData>; data: DocumentData }
    >();

    expiredSnapshot.docs.forEach((doc) => {
      entries.set(doc.id, { ref: doc.ref, data: doc.data() });
    });

    staleSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const createdAt = toDate(data.createdAt);
      if (!createdAt) return;
      if (createdAt <= pendingCutoff) {
        entries.set(doc.id, { ref: doc.ref, data });
      }
    });

    if (entries.size === 0) {
      return;
    }

    await Promise.all(
      Array.from(entries.values(), ({ ref, data }) =>
        deleteQuickDropPayload(ref, data),
      ),
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

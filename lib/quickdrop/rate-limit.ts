import { createHash } from "node:crypto";

import { adminDb } from "@/lib/firebase/admin";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

type RateLimitDoc = {
  windowStart: number;
  count: number;
  updatedAt: number;
};

const hashPrincipal = (principal: string) =>
  createHash("sha256").update(principal).digest("hex");

const isWithinWindow = (windowStart: number, now: number) =>
  now - windowStart < WINDOW_MS;

export const allowQuickDropRequest = async (principal: string) => {
  const normalized = principal.trim().toLowerCase() || "unknown";
  const documentId = hashPrincipal(normalized);

  const db = adminDb();
  const docRef = db.collection("quickdrop_rate_limits").doc(documentId);
  const now = Date.now();

  try {
    const allowed = await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(docRef);
      if (!snapshot.exists) {
        tx.set(docRef, {
          windowStart: now,
          count: 1,
          updatedAt: now,
        } satisfies RateLimitDoc);
        return true;
      }

      const data = snapshot.data() as Partial<RateLimitDoc>;
      const windowStart =
        typeof data.windowStart === "number" ? data.windowStart : now;
      const count = typeof data.count === "number" ? data.count : 0;

      if (isWithinWindow(windowStart, now)) {
        if (count >= MAX_REQUESTS_PER_WINDOW) {
          return false;
        }
        tx.update(docRef, {
          count: count + 1,
          updatedAt: now,
        } satisfies Partial<RateLimitDoc>);
        return true;
      }

      tx.set(docRef, {
        windowStart: now,
        count: 1,
        updatedAt: now,
      } satisfies RateLimitDoc);
      return true;
    });

    return allowed;
  } catch (error) {
    console.error("Unable to evaluate QuickDrop rate limit", error);
    return true; // Fail open to avoid unintended denial of service.
  }
};

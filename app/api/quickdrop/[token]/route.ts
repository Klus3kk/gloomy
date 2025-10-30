import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { adminDb, adminStorage } from "@/lib/firebase/admin";
import {
  cleanupExpiredQuickDrops,
  deleteQuickDropPayload,
  isExpired,
} from "@/lib/quickdrop/admin";
import { QUICKDROP_ACTIVE_EXPIRY_MS } from "@/lib/quickdrop/constants";

const getDoc = async (token: string) =>
  adminDb().collection("quickdrop").doc(token).get();

const buildContentDisposition = (fileName: string) => {
  const fallback = fileName.replace(/["\r\n]/g, "_").slice(0, 255) || "quickdrop";
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
};

const bufferToArrayBuffer = (buffer: Buffer): ArrayBuffer =>
  buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  await cleanupExpiredQuickDrops();
  const { token } = await params;
  const doc = await getDoc(token);

  if (!doc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = doc.data()!;
  const now = Date.now();
  const expiresAtDate =
    data.expiresAt && typeof data.expiresAt.toDate === "function"
      ? data.expiresAt.toDate()
      : data.expiresAt instanceof Date
        ? data.expiresAt
        : null;
  const expired = data.status === "expired" || isExpired(data.expiresAt);
  const remainingMs =
    expiresAtDate && !expired ? Math.max(0, expiresAtDate.getTime() - now) : 0;
  const status =
    data.status === "consumed"
      ? "consumed"
      : expired
        ? "expired"
        : data.status;

  const response = {
    status,
    fileName: data.fileName,
    sizeBytes: data.sizeBytes ?? 0,
    expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
    remainingMs,
  };

  if (status === "expired" || status === "consumed") {
    await deleteQuickDropPayload(doc.ref, data);
  }

  return NextResponse.json(response);
}

export async function PATCH(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    await cleanupExpiredQuickDrops();
    const { token } = await params;
    const docRef = adminDb().collection("quickdrop").doc(token);
    const now = new Date();

    const result = await docRef.get();
    if (!result.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = result.data()!;
    if (data.status !== "pending") {
      return NextResponse.json(
        { error: "QuickDrop already active" },
        { status: 409 },
      );
    }

    await docRef.update({
      status: "active",
      expiresAt: new Date(now.getTime() + QUICKDROP_ACTIVE_EXPIRY_MS),
    });

    return NextResponse.json({
      sharePath: `/quickdrop/${token}`,
      expiresInMs: QUICKDROP_ACTIVE_EXPIRY_MS,
      token,
    });
  } catch (error) {
    console.error("Failed to activate quickdrop", error);
    return NextResponse.json(
      { error: "Unable to activate QuickDrop." },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  await cleanupExpiredQuickDrops();
  const db = adminDb();
  const { token } = await params;
  const docRef = db.collection("quickdrop").doc(token);

  type DownloadContext = {
    storagePath: string;
    fileName: string;
    contentType: string;
  };

  let context: DownloadContext | null = null;

  try {
    context = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) {
        throw new Error("NOT_FOUND");
      }

      const data = snap.data()!;
      const now = new Date();

      if (data.status !== "active") {
        throw new Error("NOT_ACTIVE");
      }

      if (isExpired(data.expiresAt)) {
        tx.update(docRef, { status: "expired", expiresAt: now });
        throw new Error("EXPIRED");
      }

      tx.update(docRef, {
        status: "consumed",
        consumedAt: now,
        expiresAt: now,
      });

      const storagePath =
        typeof data.storagePath === "string" ? data.storagePath : null;
      if (!storagePath) {
        throw new Error("MISSING_STORAGE_PATH");
      }

      const fileName =
        typeof data.fileName === "string" && data.fileName.trim().length > 0
          ? data.fileName
          : `quickdrop-${token}`;
      const contentType =
        typeof data.contentType === "string" &&
        data.contentType.trim().length > 0
          ? data.contentType.trim()
          : "application/octet-stream";

      return {
        storagePath,
        fileName,
        contentType,
      };
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (error.message === "NOT_ACTIVE") {
        return NextResponse.json({ error: "Unavailable" }, { status: 409 });
      }
      if (error.message === "EXPIRED") {
        return NextResponse.json({ error: "Expired" }, { status: 410 });
      }
      if (error.message === "MISSING_STORAGE_PATH") {
        console.error(
          `QuickDrop ${token} missing storagePath while consuming`,
        );
        return NextResponse.json(
          { error: "Unavailable" },
          { status: 410 },
        );
      }
    }

    console.error("Failed to prepare quickdrop download", error);
    return NextResponse.json(
      { error: "Unable to prepare download." },
      { status: 500 },
    );
  }

  if (!context) {
    return NextResponse.json(
      { error: "Unable to prepare download." },
      { status: 500 },
    );
  }

  const { storagePath, fileName, contentType } = context;
  const storage = adminStorage();
  const fileHandle = storage.bucket().file(storagePath);

  let metadataContentType: string | undefined;

  try {
    const [metadata] = await fileHandle.getMetadata();
    metadataContentType = metadata?.contentType ?? undefined;
  } catch (error) {
    metadataContentType = undefined;
    console.warn(
      `Unable to read metadata for QuickDrop payload ${storagePath}`,
      error instanceof Error ? error.message : error,
    );
  }

  const ensureCleanup = async () => {
    await deleteQuickDropPayload(docRef, { storagePath });
  };

  try {
    const [buffer] = await fileHandle.download();
    await ensureCleanup();

    const resolvedContentType =
      metadataContentType && metadataContentType.trim().length > 0
        ? metadataContentType
        : contentType;

    const headers = new Headers();
    headers.set("Content-Type", resolvedContentType);
    headers.set("Content-Length", buffer.length.toString());
    headers.set("Content-Disposition", buildContentDisposition(fileName));
    headers.set("Cache-Control", "no-store");
    headers.set("X-QuickDrop-Filename", encodeURIComponent(fileName));

    const body = bufferToArrayBuffer(buffer);

    return new Response(body, {
      status: 200,
      headers,
    });
  } catch (error) {
    await ensureCleanup();

    console.error(
      `Failed to stream QuickDrop payload for ${token}`,
      error,
    );

    return NextResponse.json(
      { error: "Download unavailable" },
      { status: 410 },
    );
  }
}

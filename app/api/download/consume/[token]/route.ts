import { NextResponse } from "next/server";
import { Readable } from "node:stream";

import { adminDb, adminStorage } from "@/lib/firebase/admin";

const TOKEN_SEPARATOR = ".";
const AUTO_DELETE_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

const parseToken = (raw: string) => {
  const [id, secret] = raw.split(TOKEN_SEPARATOR);
  if (!id || !secret) {
    return null;
  }
  return { id, secret };
};

const resolveDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }
  if (value && typeof value === "object" && "toDate" in value) {
    try {
      const parsed = (value as { toDate: () => Date }).toDate();
      return parsed instanceof Date ? parsed : null;
    } catch (error) {
      console.error("Failed to convert Firestore timestamp", error);
    }
  }
  return null;
};

const encodeFilename = (name: string) =>
  encodeURIComponent(name).replace(/%20/g, "+");

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { token: rawToken } = await params;

  if (!rawToken) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const parsed = parseToken(decodeURIComponent(rawToken));
  if (!parsed) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const { id, secret } = parsed;
  const db = adminDb();
  const docRef = db.collection("files").doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const data = doc.data() ?? {};
  if (!data.deleteAfterDownload) {
    return NextResponse.json({ error: "Token is not valid." }, { status: 404 });
  }

  if (data.deletedAt) {
    return NextResponse.json(
      { error: "File is no longer available." },
      { status: 404 },
    );
  }

  const expectedToken =
    typeof data.autoDeleteToken === "string" ? data.autoDeleteToken : null;

  if (!expectedToken || expectedToken !== secret) {
    return NextResponse.json({ error: "Token has been consumed." }, { status: 404 });
  }

  const issuedAt = resolveDate(data.autoDeleteIssuedAt);
  if (
    issuedAt &&
    Date.now() - issuedAt.getTime() > AUTO_DELETE_TOKEN_TTL_MS
  ) {
    return NextResponse.json({ error: "Token has expired." }, { status: 404 });
  }

  const storagePath =
    typeof data.storagePath === "string" ? data.storagePath : null;

  if (!storagePath) {
    return NextResponse.json(
      { error: "Storage path unavailable." },
      { status: 500 },
    );
  }

  const storage = adminStorage();
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  try {
    await file.exists().then(([exists]) => {
      if (!exists) {
        throw new Error("missing-file");
      }
    });
  } catch (error) {
    console.error("Auto-delete file missing", error);
    return NextResponse.json({ error: "File missing." }, { status: 404 });
  }

  try {
    const now = new Date();
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(docRef);
      if (!snapshot.exists) {
        throw new Error("not-found");
      }
      const current = snapshot.data() ?? {};
      if (current.deletedAt || current.autoDeleteConsumedAt) {
        throw new Error("consumed");
      }
      if (current.autoDeleteToken !== secret) {
        throw new Error("invalid-token");
      }

      tx.update(docRef, {
        deletedAt: now,
        updatedAt: now,
        updatedBy: "download:auto-delete",
        autoDeleteConsumedAt: now,
        autoDeleteToken: null,
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "auto-delete transaction failed";
    console.error("Failed to mark auto-delete consumption", error);
    if (message === "not-found") {
      return NextResponse.json({ error: "File missing." }, { status: 404 });
    }
    if (message === "consumed") {
      return NextResponse.json(
        { error: "File already consumed." },
        { status: 404 },
      );
    }
    if (message === "invalid-token") {
      return NextResponse.json({ error: "Token invalid." }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to finalize download." }, { status: 500 });
  }

  let metadata: { contentType?: string; size?: string | number; name?: string } | null = null;
  try {
    [metadata] = await file.getMetadata();
  } catch (error) {
    console.warn("Unable to read storage metadata", error);
  }

  const contentType = metadata?.contentType ?? "application/octet-stream";
  const size = metadata?.size ? Number(metadata.size) : undefined;
  const filename = metadata?.name
    ? metadata.name.split("/").pop()
    : storagePath.split("/").pop() ?? `${id}.bin`;

  const nodeStream = file.createReadStream();
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  let cleaned = false;
  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    try {
      await file.delete({ ignoreNotFound: true });
    } catch (error) {
      console.error("Failed to delete auto-deleted storage object", error);
    }
  };

  nodeStream.on("end", () => {
    void cleanup();
  });

  nodeStream.on("close", () => {
    void cleanup();
  });

  nodeStream.on("error", (error) => {
    console.error("Stream error for auto-delete download", error);
    void cleanup();
  });

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeFilename(
        filename,
      )}`,
      "Cache-Control": "no-store",
      ...(size ? { "Content-Length": String(size) } : {}),
    },
  });
}

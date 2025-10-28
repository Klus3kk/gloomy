import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase/admin";

const EXPIRY_MS = 60_000;

const getDoc = async (token: string) =>
  adminDb().collection("quickdrop").doc(token).get();

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const doc = await getDoc(params.token);

  if (!doc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = doc.data()!;
  const now = Date.now();
  const expiresAt = data.expiresAt ? data.expiresAt.toDate().getTime() : null;
  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const status =
    data.status === "consumed"
      ? "consumed"
      : remainingMs <= 0 || data.status === "expired"
        ? "expired"
        : data.status;

  return NextResponse.json({
    status,
    fileName: data.fileName,
    sizeBytes: data.sizeBytes ?? 0,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    remainingMs,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { token: string } },
) {
  try {
    const body = (await request.json()) as { downloadUrl?: string };
    const downloadUrl = String(body.downloadUrl ?? "").trim();

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "downloadUrl must be provided" },
        { status: 400 },
      );
    }

    const docRef = adminDb().collection("quickdrop").doc(params.token);
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
      downloadUrl,
      status: "active",
      expiresAt: new Date(now.getTime() + EXPIRY_MS),
    });

    return NextResponse.json({
      sharePath: `/quickdrop/${params.token}`,
      expiresInMs: EXPIRY_MS,
      token: params.token,
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
  { params }: { params: { token: string } },
) {
  const db = adminDb();
  const docRef = db.collection("quickdrop").doc(params.token);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) {
        throw new Error("NOT_FOUND");
      }

      const data = snap.data()!;
      const expiresAt = data.expiresAt?.toDate?.() ?? null;
      const now = new Date();

      if (data.status !== "active") {
        throw new Error("NOT_ACTIVE");
      }

      if (!expiresAt || expiresAt.getTime() < now.getTime()) {
        tx.update(docRef, { status: "expired" });
        throw new Error("EXPIRED");
      }

      tx.update(docRef, {
        status: "consumed",
        consumedAt: now,
      });

      return data.downloadUrl as string | null;
    });

    if (!result) {
      return NextResponse.json(
        { error: "Download URL unavailable" },
        { status: 500 },
      );
    }

    return NextResponse.json({ downloadUrl: result });
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
    }

    console.error("Failed to fulfil quickdrop download", error);
    return NextResponse.json(
      { error: "Unable to prepare download." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { cleanupExpiredQuickDrops } from "@/lib/quickdrop/admin";
import { allowQuickDropRequest } from "@/lib/quickdrop/rate-limit";
import { generateSecureToken } from "@/lib/utils/token";
import { QUICKDROP_PENDING_EXPIRY_MS } from "@/lib/quickdrop/constants";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const extractClientPrincipal = (request: Request) => {
  const headerCandidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
  ];

  for (const candidate of headerCandidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.split(",")[0].trim().slice(0, 128);
    }
  }

  return "unknown";
};

export async function POST(request: Request) {
  try {
    await cleanupExpiredQuickDrops();
    const clientPrincipal = extractClientPrincipal(request);
    const allowed = await allowQuickDropRequest(clientPrincipal);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many QuickDrop initialisations. Try again later." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as {
      fileName?: string;
      sizeBytes?: number;
      contentType?: string;
    };

    const fileName = String(body.fileName ?? "").trim();
    const sizeBytes = Number(body.sizeBytes ?? 0);
    const contentTypeRaw = body.contentType ?? "";
    const contentType =
      typeof contentTypeRaw === "string" && contentTypeRaw.trim().length > 0
        ? contentTypeRaw.trim().slice(0, 255)
        : "application/octet-stream";

    if (!fileName) {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json(
        { error: "sizeBytes must be provided" },
        { status: 400 },
      );
    }

    if (sizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 25MB QuickDrop limit" },
        { status: 400 },
      );
    }

    const db = adminDb();
    let token: string | null = null;
    let attempts = 0;
    while (!token && attempts < 5) {
      const candidate = generateSecureToken();
      const existing = await db.collection("quickdrop").doc(candidate).get();
      if (!existing.exists) {
        token = candidate;
      }
      attempts += 1;
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unable to allocate token" },
        { status: 500 },
      );
    }

    const storagePath = `quickdrop/${token}/${fileName}`;

    const now = Date.now();
    await db.collection("quickdrop").doc(token).set({
      fileName,
      sizeBytes,
      storagePath,
      contentType,
      createdAt: new Date(now),
      createdBy: null,
      status: "pending",
      downloadUrl: null,
      expiresAt: new Date(now + QUICKDROP_PENDING_EXPIRY_MS),
      consumedAt: null,
    });

    return NextResponse.json({
      token,
      uploadPath: storagePath,
    });
  } catch (error) {
    console.error("Failed to initialise quickdrop", error);
    return NextResponse.json(
      { error: "Unable to initialise QuickDrop." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { generateShortToken } from "@/lib/utils/token";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fileName?: string;
      sizeBytes?: number;
    };

    const fileName = String(body.fileName ?? "").trim();
    const sizeBytes = Number(body.sizeBytes ?? 0);

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
      const candidate = generateShortToken(10);
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

    await db.collection("quickdrop").doc(token).set({
      fileName,
      sizeBytes,
      storagePath,
      createdAt: new Date(),
      createdBy: null,
      status: "pending",
      downloadUrl: null,
      expiresAt: null,
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

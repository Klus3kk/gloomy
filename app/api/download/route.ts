import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { adminDb } from "@/lib/firebase/admin";
import { verifyPassword } from "@/lib/security/password";
import { fallbackFiles } from "@/lib/catalog/fallback";

const findFallback = (id: string) =>
  fallbackFiles.find((file) => file.id === id);

class AutoDeleteUnavailableError extends Error {
  constructor(message?: string) {
    super(message ?? "File is no longer available.");
    this.name = "AutoDeleteUnavailableError";
  }
}

export async function POST(request: Request) {
  try {
    const { id, password } = (await request.json()) as {
      id?: string;
      password?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Missing file id." },
        { status: 400 },
      );
    }

    const db = adminDb();
    const docRef = db.collection("files").doc(id);
    const doc = await docRef.get();

    const data = doc.exists ? doc.data() : undefined;
    const fallback = !doc.exists ? findFallback(id) : undefined;

    if (!data && !fallback) {
      return NextResponse.json(
        { error: "File not found." },
        { status: 404 },
      );
    }

    if (data?.deletedAt) {
      return NextResponse.json(
        { error: "File is no longer available." },
        { status: 404 },
      );
    }

    const visibility =
      (typeof data?.visibility === "string"
        ? data.visibility
        : fallback?.visibility) ?? "public";

    if (visibility === "password") {
      const passwordHash =
        typeof data?.passwordHash === "string"
          ? data.passwordHash
          : fallback?.passwordHash;
      const passwordSalt =
        typeof data?.passwordSalt === "string"
          ? data.passwordSalt
          : fallback?.passwordSalt;

      if (!passwordHash || !passwordSalt) {
        return NextResponse.json(
          { error: "File does not have a valid password configuration." },
          { status: 500 },
        );
      }

      if (typeof password !== "string" || password.trim().length === 0) {
        return NextResponse.json(
          { error: "Password required." },
          { status: 401 },
        );
      }

      const isValid = await verifyPassword(
        password.trim(),
        String(passwordSalt),
        String(passwordHash),
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid password." },
          { status: 401 },
        );
      }
    }

    const rawStoragePath =
      typeof data?.storagePath === "string" ? data.storagePath : null;
    const deleteAfterDownload = Boolean(data?.deleteAfterDownload);

    if (deleteAfterDownload) {
      if (!rawStoragePath) {
        return NextResponse.json(
          { error: "Storage path missing for auto-delete asset." },
          { status: 500 },
        );
      }

      try {
        const tokenSecret = await db.runTransaction(async (tx) => {
          const snapshot = await tx.get(docRef);
          if (!snapshot.exists) {
            throw new AutoDeleteUnavailableError();
          }
          const current = snapshot.data();
          if (!current) {
            throw new AutoDeleteUnavailableError();
          }
          if (current.deletedAt || current.autoDeleteConsumedAt) {
            throw new AutoDeleteUnavailableError();
          }
          if (!current.deleteAfterDownload) {
            return null;
          }

          const existingToken =
            typeof current.autoDeleteToken === "string"
              ? current.autoDeleteToken
              : null;

          if (existingToken) {
            return existingToken;
          }

          const generated = randomUUID();
          tx.update(docRef, {
            autoDeleteToken: generated,
            autoDeleteIssuedAt: new Date(),
          });
          return generated;
        });

        if (tokenSecret) {
          const token = `${doc.id}.${tokenSecret}`;
          return NextResponse.json({
            downloadUrl: `/api/download/consume/${encodeURIComponent(token)}`,
          });
        }
      } catch (error) {
        if (error instanceof AutoDeleteUnavailableError) {
          return NextResponse.json(
            { error: error.message },
            { status: 404 },
          );
        }
        console.error("Failed to provision auto-delete token", error);
        return NextResponse.json(
          { error: "Unable to prepare download." },
          { status: 500 },
        );
      }
    }

    const downloadUrl =
      (typeof data?.downloadUrl === "string"
        ? data.downloadUrl
        : fallback?.downloadUrl) ?? null;

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "Download URL unavailable." },
        { status: 500 },
      );
    }

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Failed to process download request", error);
    return NextResponse.json(
      { error: "Unable to process download request." },
      { status: 500 },
    );
  }
}

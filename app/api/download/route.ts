import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { verifyPassword } from "@/lib/security/password";
import { fallbackFiles } from "@/lib/catalog/fallback";

const findFallback = (id: string) =>
  fallbackFiles.find((file) => file.id === id);

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

    const docRef = adminDb().collection("files").doc(id);
    const doc = await docRef.get();

    const data = doc.exists ? doc.data() : undefined;
    const fallback = !doc.exists ? findFallback(id) : undefined;

    if (!data && !fallback) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const visibility = data?.visibility ?? fallback?.visibility ?? "public";

    if (visibility === "password") {
      const passwordHash = data?.passwordHash ?? fallback?.passwordHash;
      const passwordSalt = data?.passwordSalt ?? fallback?.passwordSalt;

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

    const downloadUrl =
      data?.downloadUrl ?? fallback?.downloadUrl ?? null;

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

import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { fallbackFiles } from "@/lib/catalog/fallback";

type CatalogVisibility = "public" | "password";

interface CatalogFile {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: CatalogVisibility;
  sizeBytes: number;
  createdAt: string;
  tags: string[];
  hasPassword: boolean;
  passwordHint?: string;
}

const normalizeVisibility = (value: unknown): CatalogVisibility => {
  if (value === "password") return "password";
  return "public";
};

const toIsoString = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const mapDocToCatalog = (
  doc: FirebaseFirestore.QueryDocumentSnapshot,
): CatalogFile | null => {
  const data = doc.data();
  if (data.deletedAt) {
    return null;
  }

  return {
    id: doc.id,
    title: String(data.title ?? doc.id),
    description: String(data.description ?? "No description provided."),
    category: String(data.category ?? "uncategorized"),
    visibility: normalizeVisibility(data.visibility),
    sizeBytes: toNumber(data.sizeBytes),
    createdAt: toIsoString(data.createdAt),
    tags: Array.isArray(data.tags)
      ? data.tags.map((tag) => String(tag))
      : [],
    hasPassword: Boolean(data.passwordHash),
    passwordHint: data.passwordHint ? String(data.passwordHint) : undefined,
  };
};

const buildResponse = (files: CatalogFile[], note?: string, error?: string) =>
  NextResponse.json({
    generatedAt: new Date().toISOString(),
    categories: Array.from(new Set(files.map((file) => file.category))),
    files,
    ...(note ? { note } : {}),
    ...(error ? { error } : {}),
  });

export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db.collection("files").get();

    if (snapshot.empty) {
      const fallback = fallbackFiles.map((file) => ({
        id: file.id,
        title: file.title,
        description: file.description,
        category: file.category,
        visibility: file.visibility,
        sizeBytes: file.sizeBytes,
        createdAt: new Date().toISOString(),
        tags: file.tags,
        hasPassword: Boolean(file.passwordHash),
        passwordHint: file.passwordHint,
      }));

      return buildResponse(
        fallback,
        "Firestore returned no documents; serving fallback catalog.",
      );
    }

    const files = snapshot.docs
      .map((doc) => mapDocToCatalog(doc))
      .filter((entry): entry is CatalogFile => entry !== null);

    return buildResponse(files);
  } catch (error) {
    console.error("Failed to load catalog from Firestore", error);

    const fallback = fallbackFiles.map((file) => ({
      id: file.id,
      title: file.title,
      description: file.description,
      category: file.category,
      visibility: file.visibility,
      sizeBytes: file.sizeBytes,
      createdAt: new Date().toISOString(),
      tags: file.tags,
      hasPassword: Boolean(file.passwordHash),
      passwordHint: file.passwordHint,
    }));

    return buildResponse(
      fallback,
      undefined,
      "Firestore unavailable; returned fallback data.",
    );
  }
}

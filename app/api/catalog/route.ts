import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

type CatalogVisibility = "public" | "password";

interface CatalogFile {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: CatalogVisibility;
  downloadUrl: string;
  password?: string;
  passwordHint?: string;
  sizeBytes: number;
  createdAt: string;
  tags: string[];
}

const fallbackCatalog: CatalogFile[] = [
  {
    id: "walus-archive",
    title: "Walus Archive",
    description: "Password-protected archive containing Walus media assets.",
    category: "media",
    visibility: "password",
    password: "walus123",
    passwordHint: "Name of the project mascot + 123",
    downloadUrl: "/files/media/walus.zip",
    sizeBytes: 12_582_912,
    createdAt: "2024-05-18T10:00:00.000Z",
    tags: ["archive", "zip", "assets"],
  },
  {
    id: "brand-kit",
    title: "Brand Kit",
    description: "Logos, typography, and color palettes for brand collateral.",
    category: "design",
    visibility: "public",
    downloadUrl: "/files/media/brand-kit.zip",
    sizeBytes: 7_340_032,
    createdAt: "2024-05-01T15:30:00.000Z",
    tags: ["design", "branding"],
  },
  {
    id: "release-notes",
    title: "Release Notes",
    description: "Latest release notes in PDF format.",
    category: "documents",
    visibility: "public",
    downloadUrl: "/files/media/release-notes.pdf",
    sizeBytes: 524_288,
    createdAt: "2024-04-28T09:15:00.000Z",
    tags: ["docs", "pdf"],
  },
  {
    id: "beta-build",
    title: "Beta Build Installer",
    description: "Experimental build for QA testing. Password required.",
    category: "software",
    visibility: "password",
    password: "beta-access",
    passwordHint: "Environment code used by QA team",
    downloadUrl: "/files/media/beta-build.exe",
    sizeBytes: 26_214_400,
    createdAt: "2024-05-22T12:00:00.000Z",
    tags: ["beta", "installer"],
  },
];

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

const getCatalogFromFirestore = async (): Promise<CatalogFile[]> => {
  const db = adminDb();
  const snapshot = await db.collection("files").get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs
    .map((doc) => {
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
      downloadUrl: String(data.downloadUrl ?? "#"),
      password: data.password ? String(data.password) : undefined,
      passwordHint: data.passwordHint ? String(data.passwordHint) : undefined,
      sizeBytes: toNumber(data.sizeBytes),
      createdAt: toIsoString(data.createdAt),
      tags: Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag))
        : [],
    };
    })
    .filter((entry): entry is CatalogFile => entry !== null);
};

export async function GET() {
  try {
    const files = await getCatalogFromFirestore();
    const categories = Array.from(new Set(files.map((file) => file.category)));

    if (files.length === 0) {
      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        categories: Array.from(new Set(fallbackCatalog.map((file) => file.category))),
        files: fallbackCatalog,
        note: "Firestore returned no documents; serving fallback catalog.",
      });
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      categories,
      files,
    });
  } catch (error) {
    console.error("Failed to load catalog from Firestore", error);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        categories: Array.from(new Set(fallbackCatalog.map((file) => file.category))),
        files: fallbackCatalog,
        error: "Firestore unavailable; returned fallback data.",
      },
      { status: 200 },
    );
  }
}

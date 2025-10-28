export type FallbackFile = {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: "public" | "password";
  downloadUrl: string;
  sizeBytes: number;
  tags: string[];
  passwordHint?: string;
  passwordHash?: string | null;
  passwordSalt?: string | null;
};

export const fallbackFiles: FallbackFile[] = [
  {
    id: "walus-archive",
    title: "Walus Archive",
    description: "Password-protected archive containing Walus media assets.",
    category: "media",
    visibility: "password",
    downloadUrl: "/files/media/walus.zip",
    sizeBytes: 12_582_912,
    tags: ["archive", "zip", "assets"],
    passwordHint: "Name of the project mascot + 123",
    passwordHash: "CYgx6K65Mf5t80JKz6olSWNKpDlkfzoSor8OF9ma0i0=",
    passwordSalt: "k+LiuWmlUV/Ks85jEzTeIQ==",
  },
  {
    id: "brand-kit",
    title: "Brand Kit",
    description: "Logos, typography, and color palettes for brand collateral.",
    category: "design",
    visibility: "public",
    downloadUrl: "/files/media/brand-kit.zip",
    sizeBytes: 7_340_032,
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
    tags: ["docs", "pdf"],
  },
  {
    id: "beta-build",
    title: "Beta Build Installer",
    description: "Experimental build for QA testing. Password required.",
    category: "software",
    visibility: "password",
    downloadUrl: "/files/media/beta-build.exe",
    sizeBytes: 26_214_400,
    tags: ["beta", "installer"],
    passwordHint: "Environment code used by QA team",
    passwordHash: "pBAbYojQL4bf+xCgrNmYOsW2D0pow36AzdNGOouP7r4=",
    passwordSalt: "ZqMIMQ9rJDAwfBv4yaXjhA==",
  },
];

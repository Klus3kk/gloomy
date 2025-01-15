import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const filesDir = path.join(process.cwd(), "public/files"); // Correct the directory path

  const getFiles = (dirPath: string): Record<string, string[]> => {
    const categories: Record<string, string[]> = {};

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);

      if (file.isDirectory()) {
        const subDirName = path.basename(fullPath);
        categories[subDirName] = fs
          .readdirSync(fullPath)
          .filter((f) => fs.statSync(path.join(fullPath, f)).isFile());
      }
    }
    return categories;
  };

  try {
    const categories = getFiles(filesDir);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error reading files directory:", error);
    return NextResponse.json(
      { error: "Could not read files directory" },
      { status: 500 }
    );
  }
}

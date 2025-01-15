import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("file");
  const folder = searchParams.get("folder");
  const password = searchParams.get("password");

  const filePasswords: Record<string, string> = {
    "media/walus.zip": "niepamietam11",
  };

  if (!fileName || !folder) {
    return NextResponse.json({ error: "Invalid file or folder specified" }, { status: 400 });
  }

  const fileKey = `${folder}/${fileName}`;
  if (!filePasswords[fileKey]) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (filePasswords[fileKey] !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  try {
    const filePath = path.join(process.cwd(), "public/files", folder, fileName);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("File not found or cannot be read:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

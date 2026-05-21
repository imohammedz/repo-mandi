import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_REQUEST = 10;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return Response.json({ message: "No image files provided." }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return Response.json(
        { message: `Maximum ${MAX_FILES_PER_REQUEST} files allowed per upload.` },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return Response.json(
          { message: "Only image files are allowed." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return Response.json(
          { message: "Each image must be 5MB or smaller." },
          { status: 400 }
        );
      }

      const extension = (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const fileName = `${Date.now()}-${randomUUID()}.${extension || "jpg"}`;
      const filePath = path.join(uploadDir, fileName);
      const arrayBuffer = await file.arrayBuffer();

      await writeFile(filePath, Buffer.from(arrayBuffer));
      urls.push(`/uploads/${fileName}`);
    }

    return Response.json({ urls }, { status: 201 });
  } catch (error) {
    console.error("POST /api/uploads failed", error);
    return Response.json({ message: "Failed to upload images." }, { status: 500 });
  }
}

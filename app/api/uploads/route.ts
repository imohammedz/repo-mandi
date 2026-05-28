import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabasePublicStorageUrl, shouldLogMediaDebug } from "@/lib/media";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_FILES_PER_REQUEST = 10;

function detectImageExtension(buffer: Buffer): string | null {
  // PNG
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // GIF
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x39 || buffer[4] === 0x37) &&
    buffer[5] === 0x61
  ) {
    return "gif";
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const mediaType = String(formData.get("mediaType") ?? "image").toLowerCase();
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

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "vehicle-images";
    const uploadedFiles: Array<{ url: string; mimeType: string; sizeBytes: number }> = [];
    const supabaseAdmin = getSupabaseAdmin();

    for (const file of files) {
      const isVideo = mediaType === "video";
      if (isVideo ? !file.type.startsWith("video/") : !file.type.startsWith("image/")) {
        return Response.json(
          { message: isVideo ? "Only video files are allowed." : "Only image files are allowed." },
          { status: 400 }
        );
      }

      if (file.size > (isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES)) {
        return Response.json(
          { message: isVideo ? "Each video must be 100MB or smaller." : "Each image must be 5MB or smaller." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      const extension = isVideo
        ? file.name.split(".").pop()?.toLowerCase() || "mp4"
        : detectImageExtension(fileBuffer);

      if (!extension) {
        return Response.json(
          { message: isVideo ? "Invalid video file." : "Invalid image file content." },
          { status: 400 }
        );
      }

      const filePath = `vehicles/${isVideo ? "videos" : "images"}/${randomUUID()}.${extension}`;

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error("Supabase storage upload error", filePath, error);
        return Response.json({ message: "Failed to upload image." }, { status: 500 });
      }

      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      if (!isSupabasePublicStorageUrl(publicUrl)) {
        console.error("Supabase upload returned non-public storage URL", { filePath, publicUrl });
        return Response.json({ message: "Failed to generate public image URL." }, { status: 500 });
      }

      if (shouldLogMediaDebug()) {
        console.info("Upload response URL", { filePath, publicUrl });
      }
      uploadedFiles.push({
        url: publicUrl,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    }

    return Response.json(
      {
        urls: uploadedFiles.map((file) => file.url),
        files: uploadedFiles,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/uploads failed", error);
    return Response.json({ message: "Failed to upload files." }, { status: 500 });
  }
}

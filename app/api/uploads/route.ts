import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabasePublicStorageUrl, shouldLogMediaDebug } from "@/lib/media";
import { enforceRateLimit, getClientIp, isSameOriginRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 10;
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);

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

function isPdfFile(buffer: Buffer): boolean {
  return (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return Response.json({ message: "Invalid request origin." }, { status: 403 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }
    if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    const ip = getClientIp(request);
    const uploadRateLimitByUser = enforceRateLimit({
      key: `uploads:user:${currentUser.id}`,
      limit: 40,
      windowMs: 10 * 60 * 1000,
    });
    if (!uploadRateLimitByUser.ok) {
      return Response.json(
        { message: "Too many upload requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(uploadRateLimitByUser.retryAfterSeconds) } },
      );
    }
    const uploadRateLimitByIp = enforceRateLimit({
      key: `uploads:ip:${ip}`,
      limit: 80,
      windowMs: 10 * 60 * 1000,
    });
    if (!uploadRateLimitByIp.ok) {
      return Response.json(
        { message: "Upload rate limit exceeded for this network." },
        { status: 429, headers: { "Retry-After": String(uploadRateLimitByIp.retryAfterSeconds) } },
      );
    }

    const formData = await request.formData();
    const mediaTypeRaw = String(formData.get("mediaType") ?? "").toLowerCase();
    if (!["image", "video", "document"].includes(mediaTypeRaw)) {
      return Response.json({ message: "Invalid media type." }, { status: 400 });
    }
    const mediaType = mediaTypeRaw as "image" | "video" | "document";
    const listingId = String(formData.get("listingId") ?? "").trim();
    if (listingId) {
      const [listing] = await db
        .select({ id: vehicles.id, sellerId: vehicles.sellerId })
        .from(vehicles)
        .where(and(eq(vehicles.id, listingId), isNull(vehicles.deletedAt)));
      if (!listing) {
        return Response.json({ message: "Listing not found." }, { status: 404 });
      }
      if (currentUser.accountType !== "ADMIN" && listing.sellerId !== currentUser.id) {
        return Response.json({ message: "Forbidden." }, { status: 403 });
      }
    }
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return Response.json({ message: "No files provided." }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return Response.json(
        { message: `Maximum ${MAX_FILES_PER_REQUEST} files allowed per upload.` },
        { status: 400 }
      );
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "vehicle-images";
    const uploadedFiles: Array<{ url: string; mimeType: string; sizeBytes: number; originalFileName: string }> = [];
    const supabaseAdmin = getSupabaseAdmin();

    for (const file of files) {
      const isVideo = mediaType === "video";
      const isDocument = mediaType === "document";

      if (isVideo && !file.type.startsWith("video/")) {
        return Response.json(
          { message: "Only video files are allowed." },
          { status: 400 }
        );
      }

      if (isDocument && !(file.type.startsWith("image/") || file.type === "application/pdf")) {
        return Response.json(
          { message: "Only PDF, JPG, JPEG, PNG, or WEBP files are allowed for documents." },
          { status: 400 }
        );
      }

      const maxSize = isVideo
        ? MAX_VIDEO_SIZE_BYTES
        : isDocument
          ? file.type === "application/pdf"
            ? MAX_PDF_SIZE_BYTES
            : MAX_IMAGE_SIZE_BYTES
          : MAX_IMAGE_SIZE_BYTES;

      if (file.size > maxSize) {
        return Response.json(
          {
            message: isVideo
              ? "Each video must be 100MB or smaller."
              : isDocument && file.type === "application/pdf"
                ? "Each PDF must be 10MB or smaller."
                : "Each image must be 5MB or smaller.",
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      const extension = isVideo
        ? file.name.split(".").pop()?.toLowerCase() || "mp4"
        : isDocument
          ? (() => {
              if (isPdfFile(fileBuffer)) return "pdf";
              const imageExt = detectImageExtension(fileBuffer);
              return imageExt && ["jpg", "jpeg", "png", "webp"].includes(imageExt) ? imageExt : null;
            })()
          : detectImageExtension(fileBuffer);

      if (!extension) {
        return Response.json(
          {
            message: isVideo
              ? "Invalid video file."
              : isDocument
                ? "Invalid document file content. Only PDF, JPG, JPEG, PNG, or WEBP are allowed."
                : "Invalid image file content.",
          },
          { status: 400 }
        );
      }

      if (isVideo && !ALLOWED_VIDEO_EXTENSIONS.has(extension)) {
        return Response.json(
          { message: "Only MP4, MOV, and WEBM videos are allowed." },
          { status: 400 },
        );
      }

      const safeUserId = encodeURIComponent(String(currentUser.id));
      const mediaFolder = isVideo ? "videos" : isDocument ? "documents" : "images";
      const scopedListingPath = listingId || `draft-${safeUserId}-${randomUUID()}`;
      const filePath = `users/${safeUserId}/vehicles/${scopedListingPath}/${mediaFolder}/${randomUUID()}.${extension}`;

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Supabase storage upload error", filePath, error);
        return Response.json({ message: "Failed to upload file." }, { status: 500 });
      }

      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      if (!isSupabasePublicStorageUrl(publicUrl)) {
        console.error("Supabase upload returned non-public storage URL", { filePath, publicUrl });
        return Response.json({ message: "Failed to generate public file URL." }, { status: 500 });
      }

      if (shouldLogMediaDebug()) {
        console.info("Upload response URL", { filePath, publicUrl });
      }
      uploadedFiles.push({
        url: publicUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        originalFileName: file.name,
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

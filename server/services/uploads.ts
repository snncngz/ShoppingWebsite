import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { badRequest } from "@/server/api/errors";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function sniffMime(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 6) {
    const header = bytes.toString("ascii", 0, 6);
    if (header === "GIF87a" || header === "GIF89a") {
      return "image/gif";
    }
  }
  return null;
}

export async function saveProductImage(file: File): Promise<{ url: string }> {
  if (!(file instanceof File) || file.size <= 0) {
    badRequest("file is required");
  }

  if (file.size > MAX_BYTES) {
    badRequest("Image must be 5MB or smaller");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMime(buffer);
  const declared = file.type?.toLowerCase() || "";

  if (!sniffed || !ALLOWED.has(sniffed)) {
    badRequest("Only JPEG, PNG, WEBP, or GIF images are allowed");
  }

  if (declared && declared !== sniffed && !(declared === "image/jpg" && sniffed === "image/jpeg")) {
    badRequest("File content does not match its type");
  }

  const ext = EXT_BY_MIME[sniffed];
  const filename = `${randomUUID()}.${ext}`;
  const relativeDir = path.join("uploads", "products");
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, filename), buffer);

  return { url: `/${relativeDir.replaceAll("\\", "/")}/${filename}` };
}

import fs from "fs";
import path from "path";

/**
 * Safely delete an uploaded file from backend storage
 * @param fileUrl URL or relative path of the file (e.g., "/uploads/sections/123.jpg")
 */
export function deleteUploadedFile(fileUrl?: string | null): boolean {
  if (!fileUrl) return false;

  // Do not delete external URLs or base64 data URIs
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://") || fileUrl.startsWith("data:")) {
    return false;
  }

  try {
    // Strip query parameters (like cache buster ?t=123)
    const cleanUrl = fileUrl.split("?")[0].split("#")[0];

    // Identify relative path under uploads
    const uploadsIdx = cleanUrl.indexOf("/uploads/");
    const relPath = uploadsIdx !== -1 ? cleanUrl.substring(uploadsIdx + 1) : cleanUrl.replace(/^\/+/, "");

    const possiblePaths = [
      path.join(process.cwd(), relPath),
      path.join(process.cwd(), "backend", relPath),
      path.join(__dirname, "../..", relPath),
      path.join(__dirname, "..", relPath),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
          console.log(`🗑️ Successfully deleted old upload file: ${p}`);
          return true;
        } catch (unlinkErr) {
          console.warn(`Failed to unlink file ${p}:`, unlinkErr);
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️ Error in deleteUploadedFile for ${fileUrl}:`, err);
  }

  return false;
}

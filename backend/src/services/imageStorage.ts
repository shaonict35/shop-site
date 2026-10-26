import fs from "fs";
import path from "path";

/**
 * Saves a base64 Data URL (data:image/..., data:video/..., data:application/pdf;...) to physical files on disk
 * in both backend and frontend public/uploads/ directories, and returns
 * a permanent relative URL (e.g. /uploads/banners/img-12345.webp, /uploads/videos/vid-12345.mp4, /uploads/documents/doc-12345.pdf).
 */
export function saveBase64Image(dataUrl: string | null | undefined, subfolder: string = "banners"): string {
  if (!dataUrl || typeof dataUrl !== "string") {
    return dataUrl as any;
  }

  // If not a base64 Data URL, return untouched
  const isImage = dataUrl.startsWith("data:image/");
  const isVideo = dataUrl.startsWith("data:video/");
  const isPdf = dataUrl.startsWith("data:application/pdf");

  if (!isImage && !isVideo && !isPdf) {
    return dataUrl;
  }

  try {
    let targetFolder = subfolder;
    if (isVideo) targetFolder = "videos";
    else if (isPdf) targetFolder = "documents";

    const matches = dataUrl.match(/^data:(?:image|video|application)\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return dataUrl;
    }

    let ext = matches[1].toLowerCase();
    if (ext === "jpeg") ext = "jpg";
    if (ext === "svg+xml") ext = "svg";
    if (ext === "x-icon" || ext === "vnd.microsoft.icon") ext = "ico";
    if (ext === "quicktime") ext = "mov";
    if (ext === "pdf") ext = "pdf";

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const prefix = isVideo ? "vid" : isPdf ? "doc" : "img";
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    // 1. Save to backend public directory
    const backendUploadDir = path.join(process.cwd(), "public", "uploads", targetFolder);
    if (!fs.existsSync(backendUploadDir)) {
      fs.mkdirSync(backendUploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(backendUploadDir, fileName), buffer);

    // 2. Also save to frontend public directory if reachable
    try {
      const frontendUploadDir = path.resolve(process.cwd(), "..", "frontend", "public", "uploads", targetFolder);
      if (!fs.existsSync(frontendUploadDir)) {
        fs.mkdirSync(frontendUploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(frontendUploadDir, fileName), buffer);
    } catch (fErr) {
      // Ignore if frontend directory is not directly writeable
    }

    const publicUrl = `/uploads/${targetFolder}/${fileName}`;
    return publicUrl;
  } catch (err) {
    console.warn("[imageStorage] Error saving media:", err);
    return dataUrl;
  }
}

export const saveBase64Media = saveBase64Image;


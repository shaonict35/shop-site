import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const HERO_DATA_PATH = path.join(process.cwd(), "src", "data", "hero-banners.json");
const HOMEPAGE_BANNERS_PATH = path.join(process.cwd(), "src", "data", "homepage-banners.json");
const SLIDERS_DIR_PATH = path.join(process.cwd(), "public", "images", "sliders");

// Ensure directory exists
try {
  if (!fs.existsSync(SLIDERS_DIR_PATH)) {
    fs.mkdirSync(SLIDERS_DIR_PATH, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create public/images/sliders directory:", e);
}

const DEFAULT_SLIDERS: any[] = [];

function readHeroBanners(): any[] {
  try {
    if (fs.existsSync(HERO_DATA_PATH)) {
      const raw = fs.readFileSync(HERO_DATA_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Failed to read hero-banners.json:", err);
  }
  return [];
}

function writeHeroBanners(banners: any[]) {
  try {
    const dir = path.dirname(HERO_DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HERO_DATA_PATH, JSON.stringify(banners, null, 2), "utf8");

    // Keep synced with homepage-banners.json under "heroBanners"
    try {
      if (fs.existsSync(HOMEPAGE_BANNERS_PATH)) {
        const hpData = JSON.parse(fs.readFileSync(HOMEPAGE_BANNERS_PATH, "utf8"));
        hpData.heroBanners = banners;
        fs.writeFileSync(HOMEPAGE_BANNERS_PATH, JSON.stringify(hpData, null, 2), "utf8");
      }
    } catch (_) {}
  } catch (err) {
    console.error("Failed to write hero-banners.json:", err);
    throw err;
  }
}

function deletePhysicalSliderFile(fileUrl?: string | null) {
  if (!fileUrl || typeof fileUrl !== "string") return;
  try {
    if (fileUrl.startsWith("/images/sliders/")) {
      const filename = path.basename(fileUrl);
      const filePath = path.join(SLIDERS_DIR_PATH, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Permanently deleted slider file:", filePath);
      }
    }
  } catch (err) {
    console.warn("Could not delete slider physical file:", err);
  }
}

function detectMediaTypeFromFilename(filename: string): "video" | "gif" | "image" {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".mp4" || ext === ".webm" || ext === ".mov") return "video";
  if (ext === ".gif") return "gif";
  return "image";
}

// ─── GET /api/hero-banners-local ─────────────────────────────────────
export async function GET() {
  const banners = readHeroBanners();
  return NextResponse.json(banners, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

// ─── POST /api/hero-banners-local (Upload GIF, Video, PNG, JPG) ──────
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const banners = readHeroBanners();

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const id = (formData.get("id") as string) || "";
      const title = (formData.get("title") as string) || "GlowGoodly Hero Banner";
      const subtitle = (formData.get("subtitle") as string) || "";
      const linkUrl = (formData.get("linkUrl") as string) || (formData.get("ctaLink") as string) || "/shop";
      const order = formData.get("order") ? Number(formData.get("order")) : (banners.length + 1);
      const isActive = formData.get("isActive") !== "false";
      let mediaType = (formData.get("mediaType") as string) || "";

      const file = formData.get("file") as File || formData.get("mediaFile") as File || formData.get("image") as File;
      let finalMediaUrl = (formData.get("imageUrl") as string) || (formData.get("mediaUrl") as string) || "";

      const existingIdx = id ? banners.findIndex((b: any) => b.id === id) : -1;
      const existingItem = existingIdx >= 0 ? banners[existingIdx] : null;

      // Save physical file to frontend/public/images/sliders/
      if (file && typeof file === "object" && file.name) {
        const detected = detectMediaTypeFromFilename(file.name);
        if (!mediaType) mediaType = detected;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const targetPath = path.join(SLIDERS_DIR_PATH, safeName);
        fs.writeFileSync(targetPath, buffer);

        // Delete old replaced physical file if replacing
        if (existingItem?.imageUrl && existingItem.imageUrl !== `/images/sliders/${safeName}`) {
          deletePhysicalSliderFile(existingItem.imageUrl);
        }

        finalMediaUrl = `/images/sliders/${safeName}`;
      }

      if (!finalMediaUrl && existingItem) {
        finalMediaUrl = existingItem.imageUrl || existingItem.mediaUrl;
      }

      if (!mediaType) {
        mediaType = detectMediaTypeFromFilename(finalMediaUrl || "image.png");
      }

      const updatedBanner = {
        id: id || existingItem?.id || `hero-${Date.now()}`,
        title,
        subtitle,
        imageUrl: finalMediaUrl || "/images/sliders/slider-1.png",
        mediaUrl: finalMediaUrl || "/images/sliders/slider-1.png",
        mediaType: mediaType as "video" | "gif" | "image",
        linkUrl,
        ctaLink: linkUrl,
        isActive,
        order,
        sortOrder: order,
        updatedAt: Date.now()
      };

      if (existingIdx >= 0) {
        banners[existingIdx] = updatedBanner;
      } else {
        banners.push(updatedBanner);
      }

      banners.sort((a, b) => (a.order || 0) - (b.order || 0));
      writeHeroBanners(banners);

      return NextResponse.json({
        success: true,
        banner: updatedBanner,
        banners
      }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
      });
    }

    // JSON mutation (toggle active, update order or links)
    const body = await req.json();
    const { id, isActive, title, subtitle, linkUrl, order } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const idx = banners.findIndex((b: any) => b.id === id);
    if (idx >= 0) {
      if (isActive !== undefined) banners[idx].isActive = Boolean(isActive);
      if (title !== undefined) banners[idx].title = title;
      if (subtitle !== undefined) banners[idx].subtitle = subtitle;
      if (linkUrl !== undefined) {
        banners[idx].linkUrl = linkUrl;
        banners[idx].ctaLink = linkUrl;
      }
      if (order !== undefined) {
        banners[idx].order = Number(order);
        banners[idx].sortOrder = Number(order);
      }
      banners[idx].updatedAt = Date.now();
      banners.sort((a, b) => (a.order || 0) - (b.order || 0));
      writeHeroBanners(banners);
      return NextResponse.json({ success: true, banner: banners[idx], banners });
    }

    return NextResponse.json({ error: "Banner not found" }, { status: 404 });
  } catch (err: any) {
    console.error("Error in /api/hero-banners-local POST:", err);
    return NextResponse.json({ error: err.message || "Failed to save hero banner" }, { status: 500 });
  }
}

// ─── DELETE /api/hero-banners-local?id=... (Permanent Disk File Cleanup) ──
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }

    const banners = readHeroBanners();
    const itemToDelete = banners.find((b: any) => b.id === id);

    if (itemToDelete) {
      // Permanently remove physical file from frontend/public/images/sliders/
      deletePhysicalSliderFile(itemToDelete.imageUrl || itemToDelete.mediaUrl);

      const filtered = banners.filter((b: any) => b.id !== id);
      writeHeroBanners(filtered);
      return NextResponse.json({ success: true, deletedId: id, banners: filtered });
    }

    return NextResponse.json({ success: true, message: "Banner already removed", banners });
  } catch (err: any) {
    console.error("Error in /api/hero-banners-local DELETE:", err);
    return NextResponse.json({ error: err.message || "Failed to delete hero banner" }, { status: 500 });
  }
}

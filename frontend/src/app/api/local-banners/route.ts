import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "homepage-banners.json");
const BANNERS_DIR_PATH = path.join(process.cwd(), "public", "banners");

// Ensure banners directory exists
try {
  if (!fs.existsSync(BANNERS_DIR_PATH)) {
    fs.mkdirSync(BANNERS_DIR_PATH, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create public/banners directory:", e);
}

function readData(): Record<string, any[]> {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to read homepage-banners.json:", err);
  }
  return {
    heroBanners: [],
    dealsYouCannotMiss: [],
    topBrandsOffers: [],
    limitedTimeOffers: [],
    shopByCategory: [],
    shopByConcern: []
  };
}

function writeData(data: Record<string, any[]>) {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write homepage-banners.json:", err);
    throw err;
  }
}

function deleteOldBannerFile(fileUrl?: string | null) {
  if (!fileUrl || typeof fileUrl !== "string") return;
  try {
    if (fileUrl.startsWith("/banners/") || fileUrl.startsWith("/images/homepage/")) {
      const filename = path.basename(fileUrl);
      const filePath = path.join(BANNERS_DIR_PATH, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Also check fallback location
      const fallbackPath = path.join(process.cwd(), "public", "images", "homepage", filename);
      if (fs.existsSync(fallbackPath)) {
        fs.unlinkSync(fallbackPath);
      }
    }
  } catch (err) {
    console.warn("Could not delete old banner file:", err);
  }
}

// GET /api/local-banners
export async function GET() {
  const data = readData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

// POST & PUT /api/local-banners
export async function POST(req: NextRequest) {
  return handleMutation(req);
}

export async function PUT(req: NextRequest) {
  return handleMutation(req);
}

export async function PATCH(req: NextRequest) {
  return handleMutation(req);
}

async function handleMutation(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const allData = readData();

    // 1. Multipart Form Data (File Upload via FormData)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const sectionKey = (formData.get("sectionKey") as string) || "heroBanners";
      const id = (formData.get("id") as string) || "";
      const title = (formData.get("title") as string) || "";
      const subtitle = (formData.get("subtitle") as string) || "";
      const linkUrl = (formData.get("linkUrl") as string) || "";
      const order = formData.get("order") ? Number(formData.get("order")) : 0;
      const isActive = formData.get("isActive") !== "false";
      const mediaType = (formData.get("mediaType") as string) || "image";

      const file = formData.get("image") as File || formData.get("file") as File || formData.get("mediaFile") as File;
      let imageUrl = (formData.get("imageUrl") as string) || "";

      // Ensure section array exists
      if (!allData[sectionKey]) {
        allData[sectionKey] = [];
      }

      // Check if item already exists by ID
      const existingIdx = id ? allData[sectionKey].findIndex((item: any) => item.id === id) : -1;
      const existingItem = existingIdx >= 0 ? allData[sectionKey][existingIdx] : null;

      // Handle new file upload to frontend/public/banners/
      if (file && typeof file === "object" && file.name) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const targetPath = path.join(BANNERS_DIR_PATH, safeName);
        fs.writeFileSync(targetPath, buffer);

        // Delete old replaced file if exists
        if (existingItem?.imageUrl && existingItem.imageUrl !== `/banners/${safeName}`) {
          deleteOldBannerFile(existingItem.imageUrl);
        }

        imageUrl = `/banners/${safeName}`;
      }

      const updatedItem = {
        id: id || existingItem?.id || `banner-${Date.now()}`,
        title: title || existingItem?.title || "Banner",
        subtitle: subtitle !== undefined ? subtitle : (existingItem?.subtitle || ""),
        imageUrl: imageUrl || existingItem?.imageUrl || "/banners/slider-1.png",
        mobileImageUrl: imageUrl || existingItem?.mobileImageUrl || existingItem?.imageUrl || "/banners/slider-1.png",
        tabletImageUrl: imageUrl || existingItem?.tabletImageUrl || existingItem?.imageUrl || "/banners/slider-1.png",
        linkUrl: linkUrl || existingItem?.linkUrl || "/shop",
        order: order || existingItem?.order || existingItem?.sortOrder || (allData[sectionKey].length + 1),
        sortOrder: order || existingItem?.sortOrder || (allData[sectionKey].length + 1),
        isActive,
        mediaType: mediaType || existingItem?.mediaType || "image",
        updatedAt: Date.now()
      };

      if (existingIdx >= 0) {
        allData[sectionKey][existingIdx] = updatedItem;
      } else {
        allData[sectionKey].push(updatedItem);
      }

      writeData(allData);

      return NextResponse.json({
        success: true,
        item: updatedItem,
        data: allData
      }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
      });
    }

    // 2. Application JSON Payload
    const body = await req.json();
    const { sectionKey, id, item, allSections } = body;

    // Full replacement of all sections
    if (allSections && typeof allSections === "object") {
      writeData(allSections);
      return NextResponse.json({ success: true, data: allSections });
    }

    // Update single section or item
    if (sectionKey) {
      if (!allData[sectionKey]) {
        allData[sectionKey] = [];
      }

      // Replace entire section array
      if (Array.isArray(body.items)) {
        allData[sectionKey] = body.items;
        writeData(allData);
        return NextResponse.json({ success: true, data: allData });
      }

      // Update or create single item
      if (item && item.id) {
        const idx = allData[sectionKey].findIndex((i: any) => i.id === item.id);
        if (idx >= 0) {
          allData[sectionKey][idx] = { ...allData[sectionKey][idx], ...item, updatedAt: Date.now() };
        } else {
          allData[sectionKey].push({ ...item, updatedAt: Date.now() });
        }
        writeData(allData);
        return NextResponse.json({ success: true, item: allData[sectionKey][idx >= 0 ? idx : allData[sectionKey].length - 1], data: allData });
      }

      // Update by id and field patch
      if (id) {
        const idx = allData[sectionKey].findIndex((i: any) => i.id === id);
        if (idx >= 0) {
          if (body.imageUrl === "" && allData[sectionKey][idx].imageUrl) {
            deleteOldBannerFile(allData[sectionKey][idx].imageUrl);
          }
          allData[sectionKey][idx] = { ...allData[sectionKey][idx], ...body, updatedAt: Date.now() };
          writeData(allData);
          return NextResponse.json({ success: true, item: allData[sectionKey][idx], data: allData });
        }
      }
    }

    return NextResponse.json({ error: "Missing sectionKey or item details" }, { status: 400 });
  } catch (err: any) {
    console.error("Mutation error in /api/local-banners:", err);
    return NextResponse.json({ error: err.message || "Failed to update local banners" }, { status: 500 });
  }
}

// DELETE /api/local-banners?sectionKey=...&id=...
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sectionKey = searchParams.get("sectionKey") || "heroBanners";
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }

    const allData = readData();
    if (allData[sectionKey]) {
      const itemToDelete = allData[sectionKey].find((i: any) => i.id === id);
      if (itemToDelete?.imageUrl) {
        deleteOldBannerFile(itemToDelete.imageUrl);
      }
      allData[sectionKey] = allData[sectionKey].filter((i: any) => i.id !== id);
      writeData(allData);
    }

    return NextResponse.json({ success: true, data: allData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete local banner" }, { status: 500 });
  }
}

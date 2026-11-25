import multer from "multer";
import path from "path";
import fs from "fs";

function ensureDirSync(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function createMulterUpload(subfolder: string = "general", prefix: string = "file") {
  const uploadDir = path.join(process.cwd(), "uploads", subfolder);
  ensureDirSync(uploadDir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDirSync(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    // Security Pentest Hardening: Disallow SVGs and executable extensions to prevent Stored XSS and remote script execution
    const disallowedExts = [
      ".php", ".phtml", ".php3", ".php4", ".php5", ".phps", 
      ".exe", ".sh", ".bash", ".bat", ".cmd", ".js", ".vbs", 
      ".jar", ".html", ".htm", ".svg"
    ];
    if (disallowedExts.includes(ext) || file.originalname.toLowerCase().includes(".php") || ext === ".svg") {
      return cb(new Error("Security violation: Executable scripts, SVGs, or potentially dangerous files are strictly prohibited."));
    }

    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file format. Please upload a valid image (JPG, PNG, WEBP, GIF) or video (MP4, WEBM)."));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });
}

export const uploadSectionImage = createMulterUpload("sections", "sec");
export const uploadBannerImage = createMulterUpload("banners", "banner");
export const uploadProductImage = createMulterUpload("products", "prod");
export const uploadBrandingImage = createMulterUpload("branding", "brand");
export const uploadCategoryImage = createMulterUpload("categories", "cat");
export const uploadCmsImage = createMulterUpload("cms", "cms");
export const uploadComboImage = createMulterUpload("combos", "combo");

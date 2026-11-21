import { Router } from "express";
import {
  getAllSections,
  getSectionByKey,
  createSectionItem,
  updateSectionItem,
  deleteSectionItem,
  bulkDeleteSectionItems,
  reorderSectionItems,
} from "../controllers/sectionController";
import { uploadSectionImage } from "../config/multer";
import { authenticateJWT, requireRole } from "../middleware/auth";

const router = Router();

// Public routes for Storefront & Homepage
router.get("/sections", getAllSections);
router.get("/sections/:sectionKey", getSectionByKey);

// Admin routes (supports /api/admin/sections and /api/sections)
const adminRoles = ["SuperAdmin", "Admin", "Manager", "SUPER_ADMIN", "ADMIN", "STAFF"];

// Create
router.post(
  "/admin/sections",
  authenticateJWT,
  requireRole(adminRoles),
  uploadSectionImage.single("image"),
  createSectionItem
);
router.post(
  "/sections",
  authenticateJWT,
  requireRole(adminRoles),
  uploadSectionImage.single("image"),
  createSectionItem
);

// Update
router.put(
  "/admin/sections/:id",
  authenticateJWT,
  requireRole(adminRoles),
  uploadSectionImage.single("image"),
  updateSectionItem
);
router.put(
  "/sections/:id",
  authenticateJWT,
  requireRole(adminRoles),
  uploadSectionImage.single("image"),
  updateSectionItem
);

// Delete
router.delete(
  "/admin/sections/:id",
  authenticateJWT,
  requireRole(adminRoles),
  deleteSectionItem
);
router.delete(
  "/sections/:id",
  authenticateJWT,
  requireRole(adminRoles),
  deleteSectionItem
);

// Bulk Delete
router.post(
  "/admin/sections/bulk-delete",
  authenticateJWT,
  requireRole(adminRoles),
  bulkDeleteSectionItems
);
router.post(
  "/sections/bulk-delete",
  authenticateJWT,
  requireRole(adminRoles),
  bulkDeleteSectionItems
);

// Reorder
router.post(
  "/admin/sections/reorder",
  authenticateJWT,
  requireRole(adminRoles),
  reorderSectionItems
);
router.post(
  "/sections/reorder",
  authenticateJWT,
  requireRole(adminRoles),
  reorderSectionItems
);

export default router;

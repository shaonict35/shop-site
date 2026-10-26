"use client";

import ValobasaAdminPage from "../valobasa/page";

/**
 * Unified Admin Page:
 * Re-exports the complete, modern admin dashboard from /valobasa so that
 * accessing /admin or /valobasa renders the exact same up-to-date panel with all
 * features (banners, brands, products, inventory, orders, courier, staff, pos).
 */
export default function AdminPage() {
  return <ValobasaAdminPage />;
}

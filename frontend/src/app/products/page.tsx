"use client";

import React, { Suspense } from "react";
import ShopPage from "../shop/page";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: "16px", fontWeight: "700", color: "#e52860" }}>Loading All Products...</div>}>
      <ShopPage />
    </Suspense>
  );
}

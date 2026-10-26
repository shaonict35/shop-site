const fs = require('fs');
const path = require('path');

function generateSlug(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove special characters
    .replace(/[\s_-]+/g, "-") // collapse spaces and dashes
    .replace(/^-+|-+$/g, ""); // trim dashes
}

async function syncProducts() {
  console.log("Fetching all store products from https://api.glowgoodly.com/api/products...");
  let liveProducts = [];
  try {
    const res = await fetch("https://api.glowgoodly.com/api/products");
    if (res.ok) {
      liveProducts = await res.json();
      console.log(`Successfully downloaded ${liveProducts.length} products from live API.`);
    } else {
      console.error(`Failed to fetch from live API. Status: ${res.status}`);
    }
  } catch (err) {
    console.error("Error fetching live products:", err.message);
  }

  // Load existing fallback products
  const fallbackPath = path.resolve(__dirname, "../frontend/src/data/fallbackProducts.json");
  let existingProducts = [];
  if (fs.existsSync(fallbackPath)) {
    try {
      existingProducts = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
    } catch (e) {
      console.error("Error reading existing fallbackProducts.json:", e);
    }
  }
  console.log(`Loaded ${existingProducts.length} existing fallback products.`);

  const productMap = new Map();

  // 1. First add existing products (so any custom overrides or clearance items are retained)
  existingProducts.forEach((p) => {
    if (!p || !p.id) return;
    const slug = p.slug || generateSlug(p.name || p.id);
    productMap.set(p.id, {
      ...p,
      slug: slug,
      status: p.status || "Active",
      variants: Array.isArray(p.variants) ? p.variants : [],
      images: Array.isArray(p.images) ? p.images : []
    });
  });

  // 2. Add / merge all live products
  liveProducts.forEach((p) => {
    if (!p || !p.id) return;
    const slug = p.slug || generateSlug(p.name || p.id);
    const existing = productMap.get(p.id);
    if (!existing) {
      productMap.set(p.id, {
        ...p,
        slug: slug,
        status: p.status || "Active",
        variants: Array.isArray(p.variants) ? p.variants : [],
        images: Array.isArray(p.images) ? p.images : []
      });
    } else {
      // Merge: keep custom variants/images if existing, else take live
      productMap.set(p.id, {
        ...existing,
        ...p,
        slug: p.slug || existing.slug || slug,
        variants: (p.variants && p.variants.length > 0) ? p.variants : existing.variants,
        images: (p.images && p.images.length > 0) ? p.images : existing.images
      });
    }
  });

  // Also ensure clearance aliases exist
  const bojClearance = productMap.get("prod-clearance-2");
  if (bojClearance) {
    bojClearance.slug = "beauty-of-joseon-relief-sun-clearance";
  }

  const finalProducts = Array.from(productMap.values());
  console.log(`Total consolidated products: ${finalProducts.length}`);

  // Save to frontend/src/data/fallbackProducts.json
  fs.writeFileSync(fallbackPath, JSON.stringify(finalProducts, null, 2), "utf8");
  console.log(`Saved to ${fallbackPath} (${(fs.statSync(fallbackPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Also create minified version or check file
  const testLookup = finalProducts.find(p => p.slug === "beauty-of-joseon-relief-sun-clearance");
  console.log("Check BOJ clearance:", testLookup?.name);
}

syncProducts().catch(console.error);

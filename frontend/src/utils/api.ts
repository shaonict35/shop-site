// Client-side memory cache for API endpoints with robust error fallbacks.
const cache: Record<string, { data: any; expiry: number; timestamp?: number }> = {};

// On every page load/refresh, clear API cache so admin changes are visible immediately
if (typeof window !== "undefined") {
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("gg_cache_")) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {}
}


// Base API URL calculation: Prioritize localhost when running locally in browser, and glowgoodly.com in production
const getBaseApiUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.includes("192.168.") || host === "::1") {
      return "http://localhost:5000/api";
    }
    if (host.includes("glowgoodly.com")) {
      return "https://api.glowgoodly.com/api";
    }
    if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()) {
      const raw = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "");
      return raw.endsWith("/api") ? raw : `${raw}/api`;
    }
    return `${window.location.origin}/api`;
  }
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()) {
    const raw = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "");
    return raw.endsWith("/api") ? raw : `${raw}/api`;
  }
  return process.env.NODE_ENV === "production" ? "https://api.glowgoodly.com/api" : "http://localhost:5000/api";
};

export const API_BASE = getBaseApiUrl();
export const API_ROOT = API_BASE.replace(/\/api\/?$/, "");

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove special characters
    .replace(/[\s_-]+/g, "-") // collapse spaces and dashes
    .replace(/^-+|-+$/g, ""); // trim dashes
}

export function getProductUrl(p: { id?: string; slug?: string; name?: string } | null | undefined): string {
  if (!p) return "/shop";
  const slug = p.slug || (p.name ? generateSlug(p.name) : p.id) || p.id;
  return `/product/${slug}`;
}

export const INLINE_SVG_FALLBACK = "/placeholder-product.svg";

export const DEFAULT_PRODUCT_FALLBACK = "/placeholder-product.svg";

export function safeImageUrl(url?: string | null, fallback: string = DEFAULT_PRODUCT_FALLBACK, version?: any): string {
  const defaultFallback = fallback !== undefined ? fallback : DEFAULT_PRODUCT_FALLBACK;
  if (!url || typeof url !== "string") return defaultFallback;
  let clean = url.trim();
  if (clean.includes("placeholder") || clean === "null" || clean === "undefined" || clean.length < 4) {
    return defaultFallback;
  }

  // 1. Strip accidental backend host (:5000 or api.glowgoodly.com) from frontend static paths (/images, /banners, /icons, /logo, /public)
  clean = clean.replace(/^https?:\/\/[^\/]+(?=\/(images|banners|public|icons|logo|favicon|placeholder)\/)/i, "");
  clean = clean.replace(/^https?:\/\/(localhost:5000|127\.0\.0\.1:5000|api\.glowgoodly\.com)(?=\/(images|banners|public|icons|logo|favicon|placeholder))/i, "");

  // 2. Normalize leading slashes
  clean = clean.replace(/^\/+uploads\//, "/uploads/");
  if (clean.startsWith("uploads/")) {
    clean = `/${clean}`;
  }

  let finalUrl = clean;

  // 3. Prepend backend API URL ONLY to /uploads/... paths
  if (clean.startsWith("/uploads/")) {
    const base = API_ROOT.replace(/\/+$/, "");
    finalUrl = `${base}${clean}`;
  } else if (clean.startsWith("/")) {
    // Keep all local frontend paths (/images/..., /banners/..., /public/..., etc.) relative to frontend domain (:3000 / glowgoodly.com)
    finalUrl = clean;
  } else if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    // Avoid double hosts like http://localhost:5000http://localhost:5000/...
    if (clean.includes("http://localhost:5000http://localhost:5000")) {
      clean = clean.replace("http://localhost:5000http://localhost:5000", "http://localhost:5000");
    }
    finalUrl = clean;
  }

  // Append cache busting parameter if version or timestamp provided
  if (version && !finalUrl.startsWith("data:")) {
    const vStr = typeof version === "string" || typeof version === "number" ? String(version) : Date.now().toString();
    const cleanV = vStr.replace(/[^a-zA-Z0-9_-]/g, "");
    finalUrl += (finalUrl.includes("?") ? "&" : "?") + `v=${cleanV || Date.now()}`;
  }

  return finalUrl;
}

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<any>>();

export function normalizeDedupeKey(url: string): string {
  try {
    return url
      .replace(/([?&])(t|_t|v|timestamp|_|ts|cb|nocache)=[^&]*/gi, "")
      .replace(/\?&/, "?")
      .replace(/[?&]$/, "");
  } catch (e) {
    return url;
  }
}

export async function dedupedFetch(url: string, options?: RequestInit): Promise<Response> {
  const method = (options?.method || "GET").toUpperCase();
  if (method !== "GET") {
    return fetch(url, options);
  }
  const key = "raw_" + normalizeDedupeKey(url);
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }
  const promise = fetch(url, options).finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

function sanitizeForStorage(data: any) {
  if (Array.isArray(data) && data.length > 50) {
    return data.map((p: any) => {
      const cleanImgs = Array.isArray(p.images)
        ? p.images.slice(0, 2).map((i: any) => ({ url: safeImageUrl(i.url) }))
        : [];
      const cleanImgUrl = safeImageUrl(p.imageUrl || cleanImgs[0]?.url);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brandId: p.brandId,
        brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
        categoryId: p.categoryId,
        category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug, parentId: p.category.parentId } : null,
        campaignName: p.campaignName,
        status: p.status,
        variants: Array.isArray(p.variants) ? p.variants.slice(0, 4).map((v: any) => ({
          id: v.id,
          price: v.price,
          discountPrice: v.discountPrice,
          stock: v.stock ?? v.inventoryQuantity ?? 50,
          imageUrl: safeImageUrl(v.imageUrl, cleanImgUrl)
        })) : [],
        images: cleanImgs.length > 0 ? cleanImgs : [{ url: cleanImgUrl }],
        imageUrl: cleanImgUrl
      };
    });
  }
  return data;
}

const CACHE_DURATION = 60 * 1000; // 1 minute fresh duration

export async function fetchWithCache(url: string, bypassCache: boolean = false) {
  const dedupeKey = normalizeDedupeKey(url);

  // If identical request is currently in-flight, reuse it immediately (deduplicate simultaneous requests)
  if (inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey);
  }

  const now = Date.now();
  const cached = cache[dedupeKey] || cache[url];

  const isDynamicContent = dedupeKey.includes("/products") || dedupeKey.includes("/banners") || dedupeKey.includes("/hero-banners");
  // Short 10-second memory cache for dynamic content unless bypassCache is explicitly requested
  const dynamicTtl = 10 * 1000;
  const isFresh = cached && (bypassCache ? false : isDynamicContent ? (now - (cached.timestamp || 0) < dynamicTtl) : (cached.expiry > now));

  if (!bypassCache && isFresh) {
    return cached.data;
  }

  const forceFresh = bypassCache || isDynamicContent;

  let existingData: any = null;
  let isExpired = true;

  if (!forceFresh) {
    if (cached && cached.data) {
      existingData = cached.data;
      isExpired = cached.expiry <= now;
    } else if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`gg_cache_${dedupeKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.data) {
            existingData = parsed.data;
            cache[dedupeKey] = parsed;
            isExpired = !parsed.expiry || parsed.expiry <= now;
          }
        }
      } catch (e) {}
    }
  }

  if (existingData && !forceFresh) {
    if (!isExpired) {
      return existingData;
    }

    const bgPromise = (async () => {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim()) {
            const data = JSON.parse(text);
            const entry = { data, expiry: Date.now() + CACHE_DURATION, timestamp: Date.now() };
            cache[dedupeKey] = entry;
            cache[url] = entry;
            if (typeof window !== "undefined") {
              try {
                const sanitized = sanitizeForStorage(data);
                localStorage.setItem(`gg_cache_${dedupeKey}`, JSON.stringify({ data: sanitized, expiry: Date.now() + CACHE_DURATION }));
              } catch (e) {}
            }
          }
        }
      } catch (err) {
      } finally {
        inFlightRequests.delete(dedupeKey);
      }
    })();
    inFlightRequests.set(dedupeKey, bgPromise);

    return existingData;
  }

  const fetchPromise = (async () => {
    try {
      const fetchOptions: RequestInit = {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache"
        }
      };

      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        if (res.status === 404) return null;
        if (cached) return cached.data;
        return null;
      }

      const text = await res.text();
      if (!text || !text.trim()) return null;

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        return cached ? cached.data : null;
      }

      const entry = {
        data,
        expiry: Date.now() + CACHE_DURATION,
        timestamp: Date.now(),
      };
      cache[dedupeKey] = entry;
      cache[url] = entry;

      if (typeof window !== "undefined") {
        try {
          const sanitized = sanitizeForStorage(data);
          localStorage.setItem(`gg_cache_${dedupeKey}`, JSON.stringify({ data: sanitized, expiry: Date.now() + CACHE_DURATION }));
        } catch (e) {
          try {
            Object.keys(localStorage).forEach(k => {
              if (k.startsWith("gg_cache_") && k !== `gg_cache_${dedupeKey}`) {
                localStorage.removeItem(k);
              }
            });
          } catch (e2) {}
        }
      }

      return data;
    } catch (error) {
      if (cached) return cached.data;
      return null;
    } finally {
      inFlightRequests.delete(dedupeKey);
    }
  })();

  inFlightRequests.set(dedupeKey, fetchPromise);
  return fetchPromise;
}

export function clearCache(url: string) {
  delete cache[url];
  const dedupeKey = normalizeDedupeKey(url);
  delete cache[dedupeKey];
  if (typeof window !== "undefined") {
    try { 
      localStorage.removeItem(`gg_cache_${url}`); 
      localStorage.removeItem(`gg_cache_${dedupeKey}`); 
    } catch (e) {}
  }
}

export function clearAllCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
  if (typeof window !== "undefined") {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("gg_cache_")) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {}
  }
}

export async function purgeLiteSpeedCache(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/litespeed-purge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: json.message || (res.ok ? "LiteSpeed Cache successfully purged (*)" : "Failed to purge LiteSpeed Cache")
    };
  } catch (e: any) {
    try {
      const fallback = await fetch(`${API_BASE}/litespeed/purge`);
      return { success: fallback.ok, message: "LiteSpeed cache purge signal sent" };
    } catch (err: any) {
      return { success: false, message: e?.message || "Failed to contact LiteSpeed purge endpoint" };
    }
  }
}

export function triggerGlobalDataSync() {
  clearAllCache();
  // Auto LiteSpeed Cache Clean: automatically purge LiteSpeed reverse proxy cache on every update
  purgeLiteSpeedCache().catch(() => {});
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("glowgoodly_data_updated"));
    try {
      localStorage.setItem("glowgoodly_sync_ping", Date.now().toString());
    } catch (e) {}
    try {
      const channel = new BroadcastChannel("glowgoodly_sync_channel");
      channel.postMessage({ type: "DATA_UPDATED", timestamp: Date.now() });
      channel.close();
    } catch (e) {}
  }
}

export function subscribeToDataSync(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleLocalEvent = () => callback();
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === "glowgoodly_sync_ping") {
      clearAllCache();
      callback();
    }
  };

  window.addEventListener("glowgoodly_data_updated", handleLocalEvent);
  window.addEventListener("storage", handleStorageEvent);

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel("glowgoodly_sync_channel");
    bc.onmessage = (msg) => {
      if (msg.data?.type === "DATA_UPDATED") {
        clearAllCache();
        callback();
      }
    };
  } catch (e) {}

  return () => {
    window.removeEventListener("glowgoodly_data_updated", handleLocalEvent);
    window.removeEventListener("storage", handleStorageEvent);
    if (bc) bc.close();
  };
}

// ==========================================
// 100% Client-Side Persistent IndexedDB Storage
// Unlimited Quota Storage for Frontend Banners & Media
// ==========================================
const DB_NAME = "GlowGoodlyFrontendDB";
const STORE_NAME = "banners";
const DB_VERSION = 1;

export function openFrontendDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openFrontendDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  } catch (_) {
    return null;
  }
}

export async function idbSet(key: string, value: any): Promise<boolean> {
  try {
    const db = await openFrontendDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put({ key, value });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  } catch (_) {
    return false;
  }
}

export async function compressBannerImage(
  fileOrDataUrl: File | string,
  slotType: string = "square"
): Promise<string> {
  if (typeof window === "undefined") return "";

  // Video preservation
  if (typeof fileOrDataUrl !== "string") {
    const mime = fileOrDataUrl.type?.toLowerCase() || "";
    if (mime.startsWith("video/") || fileOrDataUrl.name.endsWith(".mp4") || fileOrDataUrl.name.endsWith(".webm")) {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(fileOrDataUrl);
      });
    }
  }

  // Determine optimal dimensions based on slot type
  const type = slotType.toLowerCase();
  let maxW = 500;
  let maxH = 500;
  let quality = 0.78;

  if (type.includes("hero") || type.includes("slide")) {
    maxW = 1440;
    maxH = 480;
    quality = 0.80;
  } else if (type.includes("wide") || type.includes("promo") || type.includes("lux")) {
    maxW = 1200;
    maxH = 300;
    quality = 0.80;
  } else if (type.includes("category") || type.includes("concern")) {
    maxW = 400;
    maxH = 400;
    quality = 0.78;
  } else {
    maxW = 500;
    maxH = 500;
    quality = 0.78;
  }

  const src = await new Promise<string>((resolve) => {
    if (typeof fileOrDataUrl === "string") return resolve(fileOrDataUrl);
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(fileOrDataUrl);
  });

  if (!src) return "";

  // If already a small URL (like an SVG or static path)
  if (src.startsWith("/") || (src.startsWith("http") && !src.includes(";base64,"))) {
    return src;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    if (src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, Math.min(maxW / (img.width || 1), maxH / (img.height || 1)));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        try {
          const webp = canvas.toDataURL("image/webp", quality);
          if (webp && webp.startsWith("data:image/webp") && webp.length > 50) {
            return resolve(webp);
          }
        } catch (_) {}

        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// Master Homepage Banners & Card Slots (35 Total Distinct Slots across Homepage)
export const MASTER_HOMEPAGE_BANNERS = [
  // 🎬 Hero Banner Slider (Default Slides)
  {
    id: "hero-slide-1",
    title: "Hero Slide 1 - Nirvana Makeup Offers",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-1.png",
    mobileImageUrl: "/images/sliders/slider-1.png",
    tabletImageUrl: "/images/sliders/slider-1.png",
    linkUrl: "/shop?brand=nirvana",
    isActive: true,
    sortOrder: 1,
    section: "🎬 Hero Slides",
    desktopSize: "1920 x 600 px (3.2:1)"
  },
  {
    id: "hero-slide-2",
    title: "Hero Slide 2 - July Jaw Droppers",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-2.png",
    mobileImageUrl: "/images/sliders/slider-2.png",
    tabletImageUrl: "/images/sliders/slider-2.png",
    linkUrl: "/shop?deal=jaw-droppers",
    isActive: true,
    sortOrder: 2,
    section: "🎬 Hero Slides",
    desktopSize: "1920 x 600 px (3.2:1)"
  },
  {
    id: "hero-slide-3",
    title: "Hero Slide 3 - Treasure of Glow",
    page: "Hero Slides",
    imageUrl: "/images/sliders/slider-3.png",
    mobileImageUrl: "/images/sliders/slider-3.png",
    tabletImageUrl: "/images/sliders/slider-3.png",
    linkUrl: "/shop?deal=treasure-of-glow",
    isActive: true,
    sortOrder: 3,
    section: "🎬 Hero Slides",
    desktopSize: "1920 x 600 px (3.2:1)"
  },
  // 📢 Homepage Wide Panoramic Banner
  {
    id: "homepage-wide-banner",
    title: "Homepage Wide Banner - Beauty Must Haves",
    page: "Homepage Wide Banner",
    imageUrl: "/hero-slide-1.png",
    mobileImageUrl: "/hero-slide-1.png",
    tabletImageUrl: "/hero-slide-1.png",
    linkUrl: "/shop",
    isActive: true,
    sortOrder: 4,
    section: "📢 Wide Banner",
    desktopSize: "1200 x 300 px (4:1)"
  },
  // 💎 Promotional Banner (Lux Royale Promo)
  {
    id: "promo-banner-lux",
    title: "Promotional Banner (Lux Royale Campaign)",
    page: "Promo Banner",
    imageUrl: "/banners/lux-royale-promo.jpg",
    mobileImageUrl: "/banners/lux-royale-promo.jpg",
    tabletImageUrl: "/banners/lux-royale-promo.jpg",
    linkUrl: "/shop",
    isActive: true,
    sortOrder: 5,
    section: "💎 Promo Banner",
    desktopSize: "1200 x 140 px (8.5:1)"
  },
  // 🔥 Deals You Cannot Miss (4 Cards)
  {
    id: "deal-card-1",
    title: "Deal Card 1 - Ombre 30% Off",
    page: "Deal Card 1",
    imageUrl: "/images/deals/deal-1.png",
    mobileImageUrl: "/images/deals/deal-1.png",
    tabletImageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?deal=ombre",
    isActive: true,
    sortOrder: 6,
    section: "🔥 Deals You Cannot Miss",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "deal-card-2",
    title: "Deal Card 2 - Marico Free Delivery",
    page: "Deal Card 2",
    imageUrl: "/images/deals/deal-2.png",
    mobileImageUrl: "/images/deals/deal-2.png",
    tabletImageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?deal=marico",
    isActive: true,
    sortOrder: 7,
    section: "🔥 Deals You Cannot Miss",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "deal-card-3",
    title: "Deal Card 3 - PNS Campaign",
    page: "Deal Card 3",
    imageUrl: "/images/deals/deal-3.gif",
    mobileImageUrl: "/images/deals/deal-3.gif",
    tabletImageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?deal=pns",
    isActive: true,
    sortOrder: 8,
    section: "🔥 Deals You Cannot Miss",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "deal-card-4",
    title: "Deal Card 4 - Senora Deal",
    page: "Deal Card 4",
    imageUrl: "/images/deals/deal-4.jpg",
    mobileImageUrl: "/images/deals/deal-4.jpg",
    tabletImageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?deal=senora",
    isActive: true,
    sortOrder: 9,
    section: "🔥 Deals You Cannot Miss",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  // 🏷️ Top Brands & Offers (4 Cards)
  {
    id: "brand-offer-1",
    title: "Brand Offer 1 - The Ordinary",
    page: "Brand Offer 1",
    imageUrl: "/images/brands/brand-offer-1.png",
    mobileImageUrl: "/images/brands/brand-offer-1.png",
    tabletImageUrl: "/images/brands/brand-offer-1.png",
    linkUrl: "/shop?brand=the-ordinary",
    isActive: true,
    sortOrder: 10,
    section: "🏷️ Top Brands & Offers",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "brand-offer-2",
    title: "Brand Offer 2 - Skin Cafe",
    page: "Brand Offer 2",
    imageUrl: "/images/brands/brand-offer-2.gif",
    mobileImageUrl: "/images/brands/brand-offer-2.gif",
    tabletImageUrl: "/images/brands/brand-offer-2.gif",
    linkUrl: "/shop?brand=skin-cafe",
    isActive: true,
    sortOrder: 11,
    section: "🏷️ Top Brands & Offers",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "brand-offer-5",
    title: "Brand Offer 5 - Treasure of Glow",
    page: "Brand Offer 5",
    imageUrl: "/images/brands/brand-offer-5.png",
    mobileImageUrl: "/images/brands/brand-offer-5.png",
    tabletImageUrl: "/images/brands/brand-offer-5.png",
    linkUrl: "/shop?brand=treasure-of-glow",
    isActive: true,
    sortOrder: 12,
    section: "🏷️ Top Brands & Offers",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "brand-offer-6",
    title: "Brand Offer 6 - Trimmer Offer",
    page: "Brand Offer 6",
    imageUrl: "/images/brands/brand-offer-6.gif",
    mobileImageUrl: "/images/brands/brand-offer-6.gif",
    tabletImageUrl: "/images/brands/brand-offer-6.gif",
    linkUrl: "/shop?category=trimmer",
    isActive: true,
    sortOrder: 13,
    section: "🏷️ Top Brands & Offers",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  // ⚡ Limited Time Offers (4 Cards)
  {
    id: "limited-bogo",
    title: "Limited Offer 1 - BOGO",
    page: "BOGO",
    imageUrl: "/images/deals/deal-1.png",
    mobileImageUrl: "/images/deals/deal-1.png",
    tabletImageUrl: "/images/deals/deal-1.png",
    linkUrl: "/shop?campaign=BOGO",
    isActive: true,
    sortOrder: 14,
    section: "⚡ Limited Time Offers",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "limited-combo",
    title: "Limited Offer 2 - COMBO",
    page: "COMBO",
    imageUrl: "/images/deals/deal-2.png",
    mobileImageUrl: "/images/deals/deal-2.png",
    tabletImageUrl: "/images/deals/deal-2.png",
    linkUrl: "/shop?campaign=COMBO",
    isActive: true,
    sortOrder: 15,
    section: "⚡ Limited Time Offers",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "limited-offers",
    title: "Limited Offer 3 - OFFERS",
    page: "OFFERS",
    imageUrl: "/images/deals/deal-3.gif",
    mobileImageUrl: "/images/deals/deal-3.gif",
    tabletImageUrl: "/images/deals/deal-3.gif",
    linkUrl: "/shop?campaign=OFFERS",
    isActive: true,
    sortOrder: 16,
    section: "⚡ Limited Time Offers",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  {
    id: "limited-clearance",
    title: "Limited Offer 4 - Clearance SALE",
    page: "Clearance SALE",
    imageUrl: "/images/deals/deal-4.jpg",
    mobileImageUrl: "/images/deals/deal-4.jpg",
    tabletImageUrl: "/images/deals/deal-4.jpg",
    linkUrl: "/shop?campaign=Clearance%20SALE",
    isActive: true,
    sortOrder: 17,
    section: "⚡ Limited Time Offers",
    desktopSize: "600 x 600 px (1:1 Square)"
  },
  // 🛍️ Category Cards (8 Cards)
  {
    id: "cat-card-makeup",
    title: "Category Card: Makeup",
    page: "Category: Makeup",
    imageUrl: "",
    linkUrl: "/shop?category=makeup",
    isActive: true,
    sortOrder: 18,
    section: "🛍️ Category Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "cat-card-skin",
    title: "Category Card: Skin Care",
    page: "Category: Skin",
    imageUrl: "",
    linkUrl: "/shop?category=skincare",
    isActive: true,
    sortOrder: 19,
    section: "🛍️ Category Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "cat-card-hair",
    title: "Category Card: Hair Care",
    page: "Category: Hair",
    imageUrl: "",
    linkUrl: "/shop?category=haircare",
    isActive: true,
    sortOrder: 20,
    section: "🛍️ Category Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "cat-card-personal-care",
    title: "Category Card: Personal Care",
    page: "Category: Personal Care",
    imageUrl: "",
    linkUrl: "/shop?category=personal-care",
    isActive: true,
    sortOrder: 21,
    section: "🛍️ Category Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "cat-card-mom-baby",
    title: "Category Card: Mom & Baby",
    page: "Category: Mom & Baby",
    imageUrl: "",
    linkUrl: "/shop?category=mom-baby",
    isActive: true,
    sortOrder: 22,
    section: "🛍️ Category Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "cat-card-fragrance",
    title: "Category Card: Fragrance",
    page: "Category: Fragrance",
    imageUrl: "",
    linkUrl: "/shop?category=fragrance",
    isActive: true,
    sortOrder: 23,
    section: "🛍️ Category Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "cat-card-undergarments",
    title: "Category Card: Undergarments",
    page: "Category: Undergarments",
    imageUrl: "",
    linkUrl: "/shop?category=undergarments",
    isActive: true,
    sortOrder: 24,
    section: "🛍️ Category Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "cat-card-combo",
    title: "Category Card: Combo",
    page: "Category: Combo",
    imageUrl: "",
    linkUrl: "/shop?category=combo",
    isActive: true,
    sortOrder: 25,
    section: "🛍️ Category Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  // 🌿 Shop By Concern Cards (10 Cards)
  {
    id: "concern-card-acne",
    title: "Concern Card: Acne Treatment",
    page: "Concern: Acne",
    imageUrl: "",
    linkUrl: "/shop?category=skincare&sub=Acne%20Treatment",
    isActive: true,
    sortOrder: 26,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-anti-aging",
    title: "Concern Card: Anti Aging Treatment",
    page: "Concern: Anti Aging",
    imageUrl: "",
    linkUrl: "/shop?category=skincare&sub=Anti%20Aging",
    isActive: true,
    sortOrder: 27,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-dandruff",
    title: "Concern Card: Dandruff Solution",
    page: "Concern: Dandruff",
    imageUrl: "",
    linkUrl: "/shop?category=haircare&sub=Dandruff",
    isActive: true,
    sortOrder: 28,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-dry-skin",
    title: "Concern Card: Dry Skin Treatment",
    page: "Concern: Dry Skin",
    imageUrl: "",
    linkUrl: "/shop?category=skincare&sub=Dry%20Skin",
    isActive: true,
    sortOrder: 29,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-hair-fall",
    title: "Concern Card: Hair Fall Treatment",
    page: "Concern: Hair Fall",
    imageUrl: "",
    linkUrl: "/shop?category=haircare&sub=Hair%20Fall",
    isActive: true,
    sortOrder: 30,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-oil-control",
    title: "Concern Card: Oil Control Treatment",
    page: "Concern: Oil Control",
    imageUrl: "",
    linkUrl: "/shop?category=skincare",
    isActive: true,
    sortOrder: 31,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-pore-care",
    title: "Concern Card: Pore Care",
    page: "Concern: Pore Care",
    imageUrl: "",
    linkUrl: "/shop?category=skincare&sub=Pore%20Care",
    isActive: true,
    sortOrder: 32,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-spot-treatment",
    title: "Concern Card: Spot Treatment",
    page: "Concern: Spot Treatment",
    imageUrl: "",
    linkUrl: "/shop?category=skincare",
    isActive: true,
    sortOrder: 33,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-hair-thinning",
    title: "Concern Card: Hair Thinning Solution",
    page: "Concern: Hair Thinning",
    imageUrl: "",
    linkUrl: "/shop?category=haircare",
    isActive: true,
    sortOrder: 34,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  },
  {
    id: "concern-card-sun-burn",
    title: "Concern Card: Sun Burn Treatment",
    page: "Concern: Sun Burn",
    imageUrl: "",
    linkUrl: "/shop?category=skincare",
    isActive: true,
    sortOrder: 35,
    section: "🌿 Concern Cards",
    desktopSize: "400 x 400 px (1:1 Square)"
  }
];

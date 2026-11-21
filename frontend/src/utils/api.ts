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
          costPrice: v.costPrice,
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

export function triggerGlobalDataSync() {
  clearAllCache();
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

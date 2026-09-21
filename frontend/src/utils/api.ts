// Client-side memory cache for API endpoints with robust error fallbacks.
const cache: Record<string, { data: any; expiry: number }> = {};

// Base API URL calculation supporting full URLs, paths, and trailing slash normalization
const getBaseApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()) {
    const raw = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "");
    return raw.endsWith("/api") ? raw : `${raw}/api`;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.includes("192.168.")) {
      return "http://localhost:5000/api";
    }
    if (host.includes("glowgoodly.com")) {
      return "https://api.glowgoodly.com/api";
    }
    return `${window.location.origin}/api`;
  }
  return "http://localhost:5000/api";
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


// In-flight request deduplication map (prevents multiple duplicate downloads of the same heavy API endpoint)
const inFlightRequests = new Map<string, Promise<any>>();

// Helper to sanitize bulky product payloads so they fit into localStorage without QuotaExceededError
function sanitizeForStorage(data: any) {
  if (Array.isArray(data) && data.length > 50) {
    return data.map((p: any) => ({
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
        stock: v.stock ?? v.inventoryQuantity ?? 50
      })) : [],
      images: Array.isArray(p.images) ? p.images.slice(0, 2).map((i: any) => ({ url: i.url })) : [],
      imageUrl: p.imageUrl || p.images?.[0]?.url || ""
    }));
  }
  return data;
}

// High performance client-side memory cache with Stale-While-Revalidate (SWR) pattern
const CACHE_DURATION = 60 * 1000; // 1 minute fresh duration

export async function fetchWithCache(url: string, bypassCache: boolean = false) {
  const now = Date.now();
  const cached = cache[url];

  // 1. In-memory fresh hit -> instant 0ms return
  if (!bypassCache && cached && cached.expiry > now) {
    return cached.data;
  }

  // 2. Check localStorage persistent cache
  let existingData: any = null;
  let isExpired = true;

  if (!bypassCache) {
    if (cached && cached.data) {
      existingData = cached.data;
      isExpired = cached.expiry <= now;
    } else if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`gg_cache_${url}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.data) {
            existingData = parsed.data;
            cache[url] = parsed;
            isExpired = !parsed.expiry || parsed.expiry <= now;
          }
        }
      } catch (e) {}
    }
  }

  // 3. Stale-While-Revalidate: If we have cached data, return it immediately for instant rendering!
  // And silently revalidate in the background if expired.
  if (existingData && !bypassCache) {
    if (!isExpired) {
      return existingData;
    }

    // Silent background revalidation without blocking caller
    if (!inFlightRequests.has(url)) {
      const bgPromise = (async () => {
        try {
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (res.ok) {
            const text = await res.text();
            if (text && text.trim()) {
              const data = JSON.parse(text);
              cache[url] = { data, expiry: Date.now() + CACHE_DURATION };
              if (typeof window !== "undefined") {
                try {
                  const sanitized = sanitizeForStorage(data);
                  localStorage.setItem(`gg_cache_${url}`, JSON.stringify({ data: sanitized, expiry: Date.now() + CACHE_DURATION }));
                } catch (e) {}
              }
            }
          }
        } catch (err) {
        } finally {
          inFlightRequests.delete(url);
        }
      })();
      inFlightRequests.set(url, bgPromise);
    }

    return existingData;
  }

  // 4. Cold fetch (no cached data available yet)
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url);
  }

  const fetchPromise = (async () => {
    try {
      const fetchOptions: RequestInit = bypassCache
        ? { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
        : { headers: { Accept: "application/json" } };

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
        console.warn("Invalid JSON response from URL:", url);
        return cached ? cached.data : null;
      }

      cache[url] = {
        data,
        expiry: Date.now() + CACHE_DURATION,
      };

      if (typeof window !== "undefined") {
        try {
          const sanitized = sanitizeForStorage(data);
          localStorage.setItem(`gg_cache_${url}`, JSON.stringify({ data: sanitized, expiry: Date.now() + CACHE_DURATION }));
        } catch (e) {
          try {
            Object.keys(localStorage).forEach(k => {
              if (k.startsWith("gg_cache_") && k !== `gg_cache_${url}`) {
                localStorage.removeItem(k);
              }
            });
          } catch (e2) {}
        }
      }

      return data;
    } catch (error) {
      if (cached) return cached.data;
      console.warn("fetchWithCache network warning for:", url);
      return null;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

// Clear cache for a specific URL (call this after admin saves data)
export function clearCache(url: string) {
  delete cache[url];
  if (typeof window !== "undefined") {
    try { localStorage.removeItem(`gg_cache_${url}`); } catch (e) {}
  }
}

// Clear ALL cached data (call after any admin save to force fresh fetch)
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

// Trigger global sync event across tabs and components
export function triggerGlobalDataSync() {
  clearAllCache();
  if (typeof window !== "undefined") {
    // 1. Dispatch event in current window
    window.dispatchEvent(new Event("glowgoodly_data_updated"));

    // 2. Trigger cross-tab storage event
    try {
      localStorage.setItem("glowgoodly_sync_ping", Date.now().toString());
    } catch (e) {}

    // 3. Trigger BroadcastChannel for instant cross-tab sync
    try {
      const channel = new BroadcastChannel("glowgoodly_sync_channel");
      channel.postMessage({ type: "DATA_UPDATED", timestamp: Date.now() });
      channel.close();
    } catch (e) {}
  }
}

// Universal listener for all components & pages to auto-refresh when admin changes data
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


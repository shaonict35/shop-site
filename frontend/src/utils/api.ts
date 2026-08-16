// Client-side memory cache for API endpoints with robust error fallbacks.
const cache: Record<string, { data: any; expiry: number }> = {};

// Cache duration is short to reflect admin changes quickly
const CACHE_DURATION = 5000;

// Base API URL calculation supporting full URLs, paths, and trailing slash normalization
const getBaseApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()) {
    const raw = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "");
    return raw.endsWith("/api") ? raw : `${raw}/api`;
  }
  return "http://localhost:5000/api";
};

export const API_BASE = getBaseApiUrl();
export const API_ROOT = API_BASE.replace(/\/api\/?$/, "");

export async function fetchWithCache(url: string, bypassCache: boolean = false) {
  const now = Date.now();
  const cached = cache[url];

  if (!bypassCache && cached && cached.expiry > now) {
    return cached.data;
  }

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" }
    });
    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      if (cached) return cached.data; // Return stale cache if response not OK
      return null;
    }

    const data = await res.json();
    cache[url] = {
      data,
      expiry: now + CACHE_DURATION,
    };

    return data;
  } catch (error) {
    if (cached) {
      return cached.data;
    }
    console.warn("fetchWithCache network warning for:", url);
    return null;
  }
}

// Clear cache for a specific URL (call this after admin saves data)
export function clearCache(url: string) {
  delete cache[url];
}

// Clear ALL cached data (call after any admin save to force fresh fetch)
export function clearAllCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
}

// Trigger global sync event across tabs and components
export function triggerGlobalDataSync() {
  clearAllCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("glowgoodly_data_updated"));
    try {
      const channel = new BroadcastChannel("glowgoodly_sync_channel");
      channel.postMessage({ type: "DATA_UPDATED", timestamp: Date.now() });
      channel.close();
    } catch (e) {
      // BroadcastChannel fallback ignored if unsupported
    }
  }
}


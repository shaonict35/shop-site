import prisma from "../prisma";

export interface PathaoConfig {
  mode: "sandbox" | "live";
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  storeId?: number;
}

export interface PathaoOrderPayload {
  store_id: number;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_secondary_phone?: string;
  recipient_address: string;
  delivery_type: number; // 48 or 12
  item_type: number; // 2 for Parcel
  item_quantity: number;
  item_weight: string; // "0.5" - "10"
  item_description: string;
  amount_to_collect: number;
  special_instruction?: string;
}

export interface PathaoCreateStorePayload {
  name: string;
  contact_name: string;
  contact_number: string;
  secondary_contact?: string;
  otp_number?: string;
  address: string;
  city_id: number;
  zone_id: number;
  area_id: number;
}

export function normalizeBDPhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("880") && cleaned.length === 13) {
    cleaned = cleaned.substring(2);
  }
  if (!cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = `0${cleaned}`;
  }
  return cleaned;
}

export function normalizeAddress(addr: string, fallbackZone = "Dhaka"): string {
  let cleaned = (addr || "").trim();
  if (cleaned.length < 10) {
    cleaned = `${cleaned}, ${fallbackZone}, Bangladesh`.trim();
  }
  if (cleaned.length < 10) {
    cleaned = `${cleaned} (Standard Delivery)`;
  }
  if (cleaned.length > 220) {
    cleaned = cleaned.substring(0, 220);
  }
  return cleaned;
}

class PathaoService {
  private inMemoryToken: string | null = null;
  private inMemoryRefreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Retrieves Pathao credentials from Prisma SiteSettings, Setting, or process.env
   */
  async getConfig(): Promise<PathaoConfig> {
    let siteSettings: any = null;
    try {
      siteSettings = await prisma.siteSettings.findFirst();
    } catch (_) {}

    // Also check key-value settings table
    const dbSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "PATHAO_MODE",
            "PATHAO_BASE_URL",
            "PATHAO_CLIENT_ID",
            "PATHAO_CLIENT_SECRET",
            "PATHAO_USERNAME",
            "PATHAO_PASSWORD",
            "PATHAO_STORE_ID"
          ]
        }
      }
    }).catch(() => []);

    const kvMap: Record<string, string> = {};
    for (const s of dbSettings) {
      kvMap[s.key] = s.value;
    }

    const mode = (
      siteSettings?.pathaoMode ||
      kvMap["PATHAO_MODE"] ||
      process.env.PATHAO_MODE ||
      "sandbox"
    ).toLowerCase() === "live" ? "live" : "sandbox";

    const defaultBaseUrl = mode === "live" 
      ? "https://api-hermes.pathao.com" 
      : "https://courier-api-sandbox.pathao.com";

    const baseUrl = (
      siteSettings?.pathaoBaseUrl ||
      kvMap["PATHAO_BASE_URL"] ||
      process.env.PATHAO_BASE_URL ||
      defaultBaseUrl
    ).replace(/\/$/, "");

    const clientId = siteSettings?.pathaoClientId || kvMap["PATHAO_CLIENT_ID"] || process.env.PATHAO_CLIENT_ID || "7N1aMJQbWm";
    const clientSecret = siteSettings?.pathaoClientSecret || kvMap["PATHAO_CLIENT_SECRET"] || process.env.PATHAO_CLIENT_SECRET || "wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39";
    const username = siteSettings?.pathaoUsername || kvMap["PATHAO_USERNAME"] || process.env.PATHAO_USERNAME || "test@pathao.com";
    const password = siteSettings?.pathaoPassword || kvMap["PATHAO_PASSWORD"] || process.env.PATHAO_PASSWORD || "lovePathao";
    
    const rawStoreId = siteSettings?.pathaoStoreId || kvMap["PATHAO_STORE_ID"] || process.env.PATHAO_STORE_ID || "";
    const storeId = rawStoreId ? parseInt(String(rawStoreId), 10) : undefined;

    return {
      mode,
      baseUrl,
      clientId,
      clientSecret,
      username,
      password,
      storeId: !isNaN(storeId as number) ? storeId : undefined
    };
  }

  /**
   * Issues new access token & refresh token using password grant
   */
  async issueToken(cfg?: PathaoConfig): Promise<string> {
    const config = cfg || (await this.getConfig());
    const endpoint = `${config.baseUrl}/aladdin/api/v1/issue-token`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "GlowGoodly/2.0 (Pathao Courier Integration)"
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "password",
        username: config.username,
        password: config.password
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      const errMsg = data.message || data.error_description || JSON.stringify(data) || "Pathao token request failed";
      throw new Error(`Pathao Token Error (${res.status}): ${errMsg}`);
    }

    const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 432000;
    this.inMemoryToken = data.access_token;
    this.inMemoryRefreshToken = data.refresh_token || null;
    this.tokenExpiresAt = Date.now() + (expiresInSec * 1000) - 120000; // buffer 2 mins

    // Persist in Prisma SiteSettings for cross-restart resilience
    try {
      await prisma.siteSettings.upsert({
        where: { id: "default" },
        update: {
          pathaoAccessToken: data.access_token,
          pathaoRefreshToken: data.refresh_token || null,
          pathaoTokenExpiresAt: new Date(this.tokenExpiresAt)
        },
        create: {
          id: "default",
          pathaoAccessToken: data.access_token,
          pathaoRefreshToken: data.refresh_token || null,
          pathaoTokenExpiresAt: new Date(this.tokenExpiresAt)
        }
      });
    } catch (_) {}

    return data.access_token;
  }

  /**
   * Refreshes access token using refresh_token grant
   */
  async refreshToken(refreshTokenStr: string, cfg?: PathaoConfig): Promise<string> {
    const config = cfg || (await this.getConfig());
    const endpoint = `${config.baseUrl}/aladdin/api/v1/issue-token`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshTokenStr
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      // Fallback to fresh password issueToken
      return this.issueToken(config);
    }

    const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 432000;
    this.inMemoryToken = data.access_token;
    this.inMemoryRefreshToken = data.refresh_token || refreshTokenStr;
    this.tokenExpiresAt = Date.now() + (expiresInSec * 1000) - 120000;

    try {
      await prisma.siteSettings.upsert({
        where: { id: "default" },
        update: {
          pathaoAccessToken: data.access_token,
          pathaoRefreshToken: this.inMemoryRefreshToken,
          pathaoTokenExpiresAt: new Date(this.tokenExpiresAt)
        },
        create: {
          id: "default",
          pathaoAccessToken: data.access_token,
          pathaoRefreshToken: this.inMemoryRefreshToken,
          pathaoTokenExpiresAt: new Date(this.tokenExpiresAt)
        }
      });
    } catch (_) {}

    return data.access_token;
  }

  /**
   * Gets a guaranteed valid access token (refreshes or issues automatically)
   */
  async getValidAccessToken(): Promise<{ token: string; config: PathaoConfig }> {
    const config = await this.getConfig();

    // Check memory first
    if (this.inMemoryToken && Date.now() < this.tokenExpiresAt) {
      return { token: this.inMemoryToken, config };
    }

    // Check DB siteSettings
    try {
      const siteSettings = await prisma.siteSettings.findFirst();
      if (
        siteSettings?.pathaoAccessToken &&
        siteSettings.pathaoTokenExpiresAt &&
        new Date(siteSettings.pathaoTokenExpiresAt).getTime() > Date.now() + 60000
      ) {
        this.inMemoryToken = siteSettings.pathaoAccessToken;
        this.inMemoryRefreshToken = siteSettings.pathaoRefreshToken || null;
        this.tokenExpiresAt = new Date(siteSettings.pathaoTokenExpiresAt).getTime();
        return { token: this.inMemoryToken, config };
      }

      if (siteSettings?.pathaoRefreshToken) {
        try {
          const newToken = await this.refreshToken(siteSettings.pathaoRefreshToken, config);
          return { token: newToken, config };
        } catch (_) {
          // Token refresh failed, will issue below
        }
      }
    } catch (_) {}

    // Otherwise issue new token
    const token = await this.issueToken(config);
    return { token, config };
  }

  /**
   * Fetches stores from Pathao: GET /aladdin/api/v1/stores
   */
  async fetchStores(): Promise<any[]> {
    const { token, config } = await this.getValidAccessToken();
    const endpoint = `${config.baseUrl}/aladdin/api/v1/stores`;

    let res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    // If 401 unauthorized, retry once with fresh token
    if (res.status === 401) {
      const freshToken = await this.issueToken(config);
      res = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${freshToken}`,
          "Accept": "application/json"
        }
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Failed to fetch Pathao stores (${res.status})`);
    }

    // Pathao stores structure: { data: { data: [...] } } or { data: [...] }
    if (Array.isArray(data.data?.data)) {
      return data.data.data;
    }
    if (Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  /**
   * Creates a new pickup store in Pathao: POST /aladdin/api/v1/stores
   */
  async createStore(payload: PathaoCreateStorePayload): Promise<any> {
    const { token, config } = await this.getValidAccessToken();
    const endpoint = `${config.baseUrl}/aladdin/api/v1/stores`;

    const bodyObj: any = {
      name: payload.name,
      contact_name: payload.contact_name,
      contact_number: normalizeBDPhone(payload.contact_number),
      address: payload.address,
      city_id: Number(payload.city_id),
      zone_id: Number(payload.zone_id),
      area_id: Number(payload.area_id)
    };

    if (payload.secondary_contact) {
      bodyObj.secondary_contact = normalizeBDPhone(payload.secondary_contact);
    }
    if (payload.otp_number) {
      bodyObj.otp_number = payload.otp_number;
    }

    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(bodyObj)
    });

    if (res.status === 401) {
      const freshToken = await this.issueToken(config);
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${freshToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(bodyObj)
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data.message || (data.errors ? JSON.stringify(data.errors) : `Pathao Store creation failed (${res.status})`);
      throw new Error(errMsg);
    }

    return data;
  }

  /**
   * Books a delivery parcel in Pathao: POST /aladdin/api/v1/orders
   */
  async createOrder(payload: PathaoOrderPayload): Promise<{ consignment_id: string; raw: any }> {
    const { token, config } = await this.getValidAccessToken();
    const endpoint = `${config.baseUrl}/aladdin/api/v1/orders`;

    // Strictly validate 11-digit recipient phone
    const cleanPhone = normalizeBDPhone(payload.recipient_phone);
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      throw new Error(`Invalid recipient phone: "${payload.recipient_phone}". Must be strictly 11 digits starting with 013-019.`);
    }

    // Normalize address length 10–220 chars
    const cleanAddress = normalizeAddress(payload.recipient_address);

    const storeId = payload.store_id || config.storeId;
    if (!storeId) {
      throw new Error("Pathao Store ID is required. Please set your Default Store ID in Admin Settings.");
    }

    const requestBody: any = {
      store_id: Number(storeId),
      merchant_order_id: String(payload.merchant_order_id),
      recipient_name: (payload.recipient_name || "Customer").substring(0, 100).trim(),
      recipient_phone: cleanPhone,
      recipient_address: cleanAddress,
      delivery_type: Number(payload.delivery_type) || 48, // 48: Normal, 12: On Demand
      item_type: Number(payload.item_type) || 2, // 2: Parcel
      item_quantity: Math.max(1, Number(payload.item_quantity) || 1),
      item_weight: String(payload.item_weight || "0.5"),
      item_description: (payload.item_description || "GlowGoodly Beauty & Skincare Products").substring(0, 255),
      amount_to_collect: Math.max(0, Math.round(Number(payload.amount_to_collect) || 0))
    };

    if (payload.recipient_secondary_phone) {
      const cleanSec = normalizeBDPhone(payload.recipient_secondary_phone);
      if (/^01[3-9]\d{8}$/.test(cleanSec)) {
        requestBody.recipient_secondary_phone = cleanSec;
      }
    }

    if (payload.special_instruction) {
      requestBody.special_instruction = String(payload.special_instruction).substring(0, 255);
    }

    // Note: recipient_city, recipient_zone, recipient_area omitted so Pathao auto-detects from recipient_address!

    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "GlowGoodly/2.0 (Pathao Courier Merchant)"
      },
      body: JSON.stringify(requestBody)
    });

    if (res.status === 401) {
      const freshToken = await this.issueToken(config);
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${freshToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "GlowGoodly/2.0 (Pathao Courier Merchant)"
        },
        body: JSON.stringify(requestBody)
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errorDetails = "";
      if (data.errors && typeof data.errors === "object") {
        errorDetails = Object.entries(data.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
      }
      const errMsg = errorDetails || data.message || `Pathao Order dispatch failed (${res.status})`;
      throw new Error(errMsg);
    }

    const consignmentId = data.data?.consignment_id || data.consignment_id || data.data?.tracking_code;
    if (!consignmentId) {
      throw new Error(`Pathao responded without consignment_id: ${JSON.stringify(data)}`);
    }

    return {
      consignment_id: String(consignmentId),
      raw: data
    };
  }
}

export const pathaoService = new PathaoService();
export default pathaoService;

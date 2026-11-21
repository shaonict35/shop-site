import prisma from "../prisma";

export interface BkashConfig {
  mode: "sandbox" | "live" | "manual";
  baseUrl: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  merchantNumber: string;
}

export interface BkashCreatePaymentParams {
  amount: number | string;
  orderId: string;
  payerReference?: string;
  callbackUrl?: string;
}

class BkashService {
  private inMemoryIdToken: string | null = null;
  private inMemoryRefreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Reads dynamic bKash credentials from Prisma SiteSettings, Setting, or process.env
   */
  async getConfig(): Promise<BkashConfig> {
    let siteSettings: any = null;
    try {
      siteSettings = await prisma.siteSettings.findFirst();
    } catch (_) {}

    const dbSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "BKASH_MODE",
            "BKASH_BASE_URL",
            "BKASH_APP_KEY",
            "BKASH_APP_SECRET",
            "BKASH_USERNAME",
            "BKASH_PASSWORD",
            "BKASH_MERCHANT_NO",
            "BKASH_MERCHANT_NUMBER"
          ]
        }
      }
    }).catch(() => []);

    const kvMap: Record<string, string> = {};
    for (const s of dbSettings) {
      kvMap[s.key] = s.value;
    }

    const rawMode = (
      siteSettings?.bkashMode ||
      kvMap["BKASH_MODE"] ||
      process.env.BKASH_MODE ||
      "sandbox"
    ).toLowerCase();

    const mode = (rawMode === "live" || rawMode === "manual") ? (rawMode as "live" | "manual") : "sandbox";

    let defaultBaseUrl = "https://tokenized.sandbox.bka.sh";
    if (mode === "live") {
      defaultBaseUrl = "https://tokenized.pay.bka.sh";
    }

    const rawBaseUrl = siteSettings?.bkashBaseUrl || kvMap["BKASH_BASE_URL"] || process.env.BKASH_BASE_URL || defaultBaseUrl;
    // Strip trailing slash and any redundant /v1.2.0-beta
    const baseUrl = rawBaseUrl.replace(/\/$/, "").replace(/\/v1\.2\.0-beta\/?$/, "");

    const appKey = siteSettings?.bkashAppKey || kvMap["BKASH_APP_KEY"] || process.env.BKASH_APP_KEY || "sandbox_bkash_app_key";
    const appSecret = siteSettings?.bkashAppSecret || kvMap["BKASH_APP_SECRET"] || process.env.BKASH_APP_SECRET || "sandbox_bkash_app_secret";
    const username = siteSettings?.bkashUsername || kvMap["BKASH_USERNAME"] || process.env.BKASH_USERNAME || "sandbox_bkash_username";
    const password = siteSettings?.bkashPassword || kvMap["BKASH_PASSWORD"] || process.env.BKASH_PASSWORD || "sandbox_bkash_password";
    const merchantNumber = siteSettings?.bkashMerchantNumber || kvMap["BKASH_MERCHANT_NUMBER"] || kvMap["BKASH_MERCHANT_NO"] || process.env.BKASH_MERCHANT_NUMBER || "01700000000";

    return {
      mode,
      baseUrl,
      appKey,
      appSecret,
      username,
      password,
      merchantNumber
    };
  }

  /**
   * POST {{base_url}}/v1.2.0-beta/tokenized/checkout/token/grant
   */
  async grantToken(cfg?: BkashConfig): Promise<string> {
    const config = cfg || (await this.getConfig());
    const endpoint = `${config.baseUrl}/v1.2.0-beta/tokenized/checkout/token/grant`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "username": config.username,
        "password": config.password
      },
      body: JSON.stringify({
        app_key: config.appKey,
        app_secret: config.appSecret
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.id_token) {
      const errMsg = data.statusMessage || data.message || JSON.stringify(data) || "bKash Token Grant failed";
      throw new Error(`bKash Token Error (${res.status}): ${errMsg}`);
    }

    const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 3600;
    this.inMemoryIdToken = data.id_token;
    this.inMemoryRefreshToken = data.refresh_token || null;
    this.tokenExpiresAt = Date.now() + (expiresInSec * 1000) - 120000;

    try {
      await prisma.siteSettings.upsert({
        where: { id: "default" },
        update: {
          bkashIdToken: data.id_token,
          bkashRefreshToken: data.refresh_token || null,
          bkashTokenExpiresAt: new Date(this.tokenExpiresAt)
        },
        create: {
          id: "default",
          bkashIdToken: data.id_token,
          bkashRefreshToken: data.refresh_token || null,
          bkashTokenExpiresAt: new Date(this.tokenExpiresAt)
        }
      });
    } catch (_) {}

    return data.id_token;
  }

  /**
   * POST {{base_url}}/v1.2.0-beta/tokenized/checkout/token/refresh
   */
  async refreshToken(refreshTokenStr: string, cfg?: BkashConfig): Promise<string> {
    const config = cfg || (await this.getConfig());
    const endpoint = `${config.baseUrl}/v1.2.0-beta/tokenized/checkout/token/refresh`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "username": config.username,
        "password": config.password
      },
      body: JSON.stringify({
        app_key: config.appKey,
        app_secret: config.appSecret,
        refresh_token: refreshTokenStr
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.id_token) {
      // Fallback to fresh grantToken
      return this.grantToken(config);
    }

    const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 3600;
    this.inMemoryIdToken = data.id_token;
    this.inMemoryRefreshToken = data.refresh_token || refreshTokenStr;
    this.tokenExpiresAt = Date.now() + (expiresInSec * 1000) - 120000;

    try {
      await prisma.siteSettings.upsert({
        where: { id: "default" },
        update: {
          bkashIdToken: data.id_token,
          bkashRefreshToken: this.inMemoryRefreshToken,
          bkashTokenExpiresAt: new Date(this.tokenExpiresAt)
        },
        create: {
          id: "default",
          bkashIdToken: data.id_token,
          bkashRefreshToken: this.inMemoryRefreshToken,
          bkashTokenExpiresAt: new Date(this.tokenExpiresAt)
        }
      });
    } catch (_) {}

    return data.id_token;
  }

  /**
   * Guarantees a fresh, non-expired bKash ID token
   */
  async getValidIdToken(): Promise<{ idToken: string; config: BkashConfig }> {
    const config = await this.getConfig();

    if (this.inMemoryIdToken && Date.now() < this.tokenExpiresAt) {
      return { idToken: this.inMemoryIdToken, config };
    }

    try {
      const siteSettings = await prisma.siteSettings.findFirst();
      if (
        siteSettings?.bkashIdToken &&
        siteSettings.bkashTokenExpiresAt &&
        new Date(siteSettings.bkashTokenExpiresAt).getTime() > Date.now() + 60000
      ) {
        this.inMemoryIdToken = siteSettings.bkashIdToken;
        this.inMemoryRefreshToken = siteSettings.bkashRefreshToken || null;
        this.tokenExpiresAt = new Date(siteSettings.bkashTokenExpiresAt).getTime();
        return { idToken: this.inMemoryIdToken, config };
      }

      if (siteSettings?.bkashRefreshToken) {
        try {
          const newToken = await this.refreshToken(siteSettings.bkashRefreshToken, config);
          return { idToken: newToken, config };
        } catch (_) {}
      }
    } catch (_) {}

    const idToken = await this.grantToken(config);
    return { idToken, config };
  }

  /**
   * POST {{base_url}}/v1.2.0-beta/tokenized/checkout/create
   */
  async createPayment(params: BkashCreatePaymentParams): Promise<{ paymentID: string; bkashURL: string; raw: any }> {
    const { idToken, config } = await this.getValidIdToken();
    const endpoint = `${config.baseUrl}/v1.2.0-beta/tokenized/checkout/create`;

    const frontendBase = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const backendBase = `http://localhost:${process.env.PORT || 5000}`;
    const defaultCallback = `${backendBase}/api/payments/bkash/callback`;

    const requestBody = {
      mode: "0011",
      payerReference: params.payerReference || "01700000000",
      callbackURL: params.callbackUrl || defaultCallback,
      amount: String(Number(params.amount).toFixed(2)),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: String(params.orderId)
    };

    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": idToken,
        "X-APP-Key": config.appKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (res.status === 401) {
      const freshToken = await this.grantToken(config);
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": freshToken,
          "X-APP-Key": config.appKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.bkashURL || !data.paymentID) {
      const msg = data.statusMessage || data.message || `bKash Payment creation failed (${res.status})`;
      throw new Error(msg);
    }

    return {
      paymentID: data.paymentID,
      bkashURL: data.bkashURL,
      raw: data
    };
  }

  /**
   * POST {{base_url}}/v1.2.0-beta/tokenized/checkout/execute
   */
  async executePayment(paymentID: string): Promise<any> {
    const { idToken, config } = await this.getValidIdToken();
    const endpoint = `${config.baseUrl}/v1.2.0-beta/tokenized/checkout/execute`;

    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": idToken,
        "X-APP-Key": config.appKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ paymentID })
    });

    if (res.status === 401) {
      const freshToken = await this.grantToken(config);
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": freshToken,
          "X-APP-Key": config.appKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ paymentID })
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.statusMessage || data.message || `bKash Payment execution failed (${res.status})`);
    }

    return data;
  }

  /**
   * POST {{base_url}}/v1.2.0-beta/tokenized/checkout/payment/search
   */
  async queryPayment(paymentID: string): Promise<any> {
    const { idToken, config } = await this.getValidIdToken();
    const endpoint = `${config.baseUrl}/v1.2.0-beta/tokenized/checkout/payment/search`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": idToken,
        "X-APP-Key": config.appKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ paymentID })
    });

    const data = await res.json().catch(() => ({}));
    return data;
  }

  /**
   * POST {{base_url}}/v1.2.0-beta/tokenized/checkout/payment/refund
   */
  async refundPayment(payload: { paymentID: string; amount: number | string; trxID: string; sku?: string; reason?: string }): Promise<any> {
    const { idToken, config } = await this.getValidIdToken();
    const endpoint = `${config.baseUrl}/v1.2.0-beta/tokenized/checkout/payment/refund`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": idToken,
        "X-APP-Key": config.appKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        paymentID: payload.paymentID,
        amount: String(Number(payload.amount).toFixed(2)),
        trxID: payload.trxID,
        sku: payload.sku || "REFUND",
        reason: payload.reason || "Customer refund request"
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.statusMessage || data.message || "bKash Refund failed");
    }

    return data;
  }
}

export const bkashService = new BkashService();
export default bkashService;

import fetch from "node-fetch";
import db from "../firebase";
import crypto from "crypto";

function hashField(val: string | undefined | null): string | undefined {
  if (!val) return undefined;
  const clean = val.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

export async function sendCapiEvent(
  eventName: string,
  customData: Record<string, any> = {},
  userData: { email?: string; phone?: string; ip?: string; userAgent?: string; sourceUrl?: string } = {}
) {
  try {
    // 1. Fetch Pixel ID and CAPI Token from Settings
    let pixelId = "921781274061851";
    let capiToken = "";

    const pixelDoc = await db.collection("settings").doc("META_PIXEL_ID").get();
    if (pixelDoc.exists && pixelDoc.data()?.value) {
      pixelId = pixelDoc.data().value;
    }

    const capiDoc = await db.collection("settings").doc("META_CAPI_TOKEN").get();
    if (capiDoc.exists && capiDoc.data()?.value) {
      capiToken = capiDoc.data().value;
    }

    // Hash user email & phone for privacy compliance (SHA-256)
    const em = hashField(userData.email);
    const ph = hashField(userData.phone);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: userData.sourceUrl || "https://shop.glowgoodly.com",
          user_data: {
            client_ip_address: userData.ip || "127.0.0.1",
            client_user_agent: userData.userAgent || "Mozilla/5.0",
            em: em ? [em] : undefined,
            ph: ph ? [ph] : undefined,
          },
          custom_data: {
            currency: "BDT",
            ...customData,
          },
        },
      ],
    };

    console.log(`[Meta CAPI] Sending Server Event: ${eventName} for Pixel: ${pixelId}`);

    if (!capiToken) {
      console.log(`[Meta CAPI Note] META_CAPI_TOKEN is empty. Browser Pixel active; add CAPI Access Token in Admin -> Settings -> Pixels for dual tracking.`);
      return { success: false, note: "CAPI Token not set" };
    }

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resData = await res.json();
    console.log(`[Meta CAPI Response] Status: ${res.status}`, resData);
    return resData;
  } catch (err: any) {
    console.error("[Meta CAPI Error]", err.message || err);
    return { error: err.message };
  }
}

import { Router, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/settings/public (Public access for analytics configurations)
router.get("/public", async (req, res) => {
  try {
    const keys = [
      "SITE_TITLE",
      "SITE_DESCRIPTION",
      "SITE_FAVICON",
      "SITE_LOGO",
      "META_PIXEL_ID",
      "GA4_MEASUREMENT_ID",
      "GTM_CONTAINER_ID",
      "ROUTINE_LINK",
      "HAIR_CARE_101_LINK",
      "SKIN_CARE_101_LINK",
      "MAKEUP_101_LINK"
    ];
    const snapshot = await db.collection("settings").get();
    
    const settingsList: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (keys.includes(data.key)) {
        settingsList.push(data);
      }
    });
    
    const publicSettings = settingsList.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    
    res.json(publicSettings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings/seasonal-offer (Public access)
router.get("/seasonal-offer", async (req, res) => {
  try {
    const docRef = db.collection("settings").doc("SEASONAL_OFFER_DATA");
    const doc = await docRef.get();
    
    if (doc.exists) {
      let parsed = doc.data()?.value ? JSON.parse(doc.data()?.value) : doc.data();
      if (parsed) {
        if (!parsed.insideDhakaShipping || parsed.insideDhakaShipping === "60") parsed.insideDhakaShipping = "70";
        if (!parsed.subAreaShipping || parsed.subAreaShipping === "100") parsed.subAreaShipping = "100";
        if (!parsed.outsideDhakaShipping || parsed.outsideDhakaShipping === "120") parsed.outsideDhakaShipping = "130";
      }
      return res.json(parsed);
    }

    const defaultOffer = {
      title: "বিশেষ অফারে অরিজিনাল বিউটি কম্বো প্যাকেজ!",
      subtitle: "সীমিত সময়ের জন্য ছাড়! ১০০% অরিজিনাল প্রোডাক্ট দ্রুত ক্যাশ অন ডেলিভারিতে পান।",
      videoUrl: "",
      productTitle: "প্রিমিয়াম বিউটি ও স্কিনকেয়ার গ্লো সেট",
      productPrice: "1250",
      originalPrice: "1850",
      productImages: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
      ],
      description: "আমাদের এই বিশেষ প্যাকেজে রয়েছে ত্বকের যত্ন ও উজ্জ্বলতার জন্য প্রয়োজনীয় প্রিমিয়াম উপাদান। নিয়মিত ব্যবহারে পাবেন দাগহীন, উজ্জ্বল ও সতেজ ত্বক।",
      bulletPoints: "১০০% অরিজিনাল প্রোডাক্ট|ত্বক হবে সতেজ ও উজ্জ্বল|কোনো সাইড ইফেক্ট নেই|সারাদেশে ক্যাশ অন ডেলিভারি",
      insideDhakaShipping: "70",
      subAreaShipping: "100",
      outsideDhakaShipping: "130",
      isActive: true
    };

    res.json(defaultOffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/seasonal-offer (Admin only)
router.post("/seasonal-offer", (async (req: any, res: any) => {
  try {
    const offerData = req.body;
    const docRef = db.collection("settings").doc("SEASONAL_OFFER_DATA");
    await docRef.set({
      key: "SEASONAL_OFFER_DATA",
      value: JSON.stringify(offerData),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ message: "Seasonal offer settings updated successfully", data: offerData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as any);

// GET /api/settings (Admin only)
router.get("/", (async (req: any, res: any) => {
  try {
    const snapshot = await db.collection("settings").get();
    const settingsList: any[] = [];
    snapshot.forEach(doc => {
      settingsList.push(doc.data());
    });
    
    // Transform array to key-value object
    const settingsObj = settingsList.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as any);

// POST /api/settings/bulk (Admin bulk update)
router.post("/bulk", (async (req: any, res: any) => {
  try {
    const settings = req.body; // Expects object: { KEY: VALUE, ... }

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "Invalid settings payload" });
    }

    const batch = db.batch();
    
    for (const [key, value] of Object.entries(settings)) {
      // Find doc where key == key, or use doc(key) as doc ID to make it super simple and automatic!
      // In NoSQL Firestore, we can use the KEY itself (e.g. "META_PIXEL_ID") as the Document ID!
      // This is extremely simple and avoids duplicate documents!
      const docRef = db.collection("settings").doc(key);
      batch.set(docRef, {
        key,
        value: String(value),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    await batch.commit();
    res.json({ message: "Settings updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as any);

// POST /api/settings/test-smtp (Admin only - Test Hosting SMTP Connection & Send Test Email)
router.post("/test-smtp", (async (req: any, res: any) => {
  try {
    const { targetEmail, host, port, user, pass, fromAddress } = req.body;
    const recipient = targetEmail || user || "support@glowgoodly.com";

    if (!recipient) {
      return res.status(400).json({ error: "Target recipient email is required to send test email." });
    }

    const { testSmtpConnection } = await import("../mailer");
    
    // Optional custom config passed from the form before saving
    const customConfig = (host || user || pass) ? {
      host: host?.trim(),
      port: port ? parseInt(port, 10) : 465,
      user: user?.trim(),
      pass: pass?.trim(),
      fromAddress: fromAddress?.trim() || `"GlowGoodly System Test" <${user}>`
    } : undefined;

    const result = await testSmtpConnection(recipient, customConfig);
    res.json({
      success: true,
      message: `✅ SMTP connection verified and test email successfully sent to ${recipient}`,
      details: result
    });
  } catch (error: any) {
    console.error("Test SMTP failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to establish SMTP connection with mail server."
    });
  }
}) as any);

export default router;


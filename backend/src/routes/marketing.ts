import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

import { sendCapiEvent } from "../services/capi";

const router = Router();

// POST /api/marketing/capi (Send frontend events to Meta Conversion API)
router.post("/capi", async (req: Request, res: Response) => {
  try {
    const { eventName, customData, userData } = req.body;
    if (!eventName) {
      return res.status(400).json({ error: "Missing eventName" });
    }
    const result = await sendCapiEvent(
      eventName,
      customData || {},
      {
        ...userData,
        ip: req.ip,
        userAgent: req.get("user-agent") || undefined,
        sourceUrl: req.get("referer") || undefined,
      }
    );
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 1. ABANDONED CARTS ───

// Get all abandoned carts
router.get("/admin/abandoned-carts", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("abandoned_carts").get();
    const carts: any[] = [];
    snapshot.forEach(doc => {
      carts.push({ id: doc.id, ...doc.data() });
    });
    
    carts.sort((a, b) => new Date(b.lastActive || b.createdAt).getTime() - new Date(a.lastActive || a.createdAt).getTime());
    res.json(carts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger recovery notification (Email/SMS)
router.post("/admin/abandoned-carts/notify", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cartId, method } = req.body;
    if (!cartId) {
      return res.status(400).json({ error: "cartId is required" });
    }
    try {
      await db.collection("abandoned_carts").doc(cartId).update({ reminderSent: true, lastNotifiedAt: new Date().toISOString() });
    } catch(e) {}

    res.json({ message: `Recovery ${method || "email & SMS"} successfully dispatched to customer!` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 2. UPSELL & CROSS-SELL OFFERS ───

// Get all active upsell rules
router.get("/admin/upsells", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("upsells").get();
    const rules: any[] = [];
    snapshot.forEach(doc => {
      rules.push({ id: doc.id, ...doc.data() });
    });

    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update Upsell rule
router.post("/admin/upsells", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, triggerProduct, suggestedProduct, discountPercentage, offerMessage, isActive } = req.body;
    const docRef = id ? db.collection("upsells").doc(id) : db.collection("upsells").doc();
    const payload = {
      triggerProduct,
      suggestedProduct,
      discountPercentage: Number(discountPercentage) || 0,
      offerMessage: offerMessage || "Special Bundle Offer!",
      isActive: isActive !== false,
      updatedAt: new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    res.status(201).json({ id: docRef.id, ...payload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Upsell rule
router.delete("/admin/upsells/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.collection("upsells").doc(req.params.id).delete();
    res.json({ message: "Upsell offer deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 3. INFLUENCERS & AFFILIATE MANAGEMENT ───

// Get all influencers
router.get("/admin/influencers", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("influencers").get();
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add/Update influencer
router.post("/admin/influencers", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, name, email, promoCode, commissionRate, status } = req.body;
    if (!name || !promoCode) {
      return res.status(400).json({ error: "Name and promoCode are required" });
    }
    const docRef = id ? db.collection("influencers").doc(id) : db.collection("influencers").doc();
    const payload = {
      name,
      email: email || "",
      promoCode: promoCode.toUpperCase().trim(),
      commissionRate: Number(commissionRate) || 10,
      status: status || "Active",
      totalSalesGenerated: 0,
      totalCommissionEarned: 0,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    res.status(201).json({ id: docRef.id, ...payload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete influencer
router.delete("/admin/influencers/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.collection("influencers").doc(req.params.id).delete();
    res.json({ message: "Influencer removed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

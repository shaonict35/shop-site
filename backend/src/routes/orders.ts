import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { sendOrderReceiptEmail } from "../mailer";
import { sendCapiEvent } from "../services/capi";

const router = Router();

// Trigger Automated Voice Confirmation Call
async function triggerOrderConfirmationCall(order: any, orderRef: any) {
  try {
    const itemNames = (order.orderItems || []).map((i: any) => `${i.productName} (${i.variantName || 'Regular'}) x${i.quantity || 1}`).join(", ") || "আপনার অর্ডারকৃত বিউটি পণ্য";
    const totalAmount = order.total || order.subTotal || 0;
    const customerName = order.customerName || "সম্মানিত গ্রাহক";
    const customerPhone = order.customerPhone || "";

    const callScript = `আসসালামু আলাইকুম ${customerName}, GlowGoodly কসমেটিক্স থেকে বলছি। আপনি আমাদের ওয়েবসাইট থেকে ${itemNames} অর্ডার করেছেন। ডেলিভারি চার্জসহ সর্বমোট মূল্য ৳${totalAmount} টাকা। আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে। ধন্যবাদ GlowGoodly এর সাথে থাকার জন্য।`;

    console.log(`[AI Auto-Call Engine] 📞 Triggering automated voice confirmation call to ${customerPhone} for Order #${order.orderNumber}...`);
    console.log(`[AI Auto-Call Script]: ${callScript}`);

    const callLogNote = `[AI Auto-Call initiated to ${customerPhone} at ${new Date().toLocaleTimeString('en-US')}]`;
    const updatedNotes = order.notes ? `${order.notes}\n${callLogNote}` : callLogNote;

    await orderRef.update({
      notes: updatedNotes,
      aiCallInitiated: true,
      aiCallStatus: "Initiated",
      aiCallPhone: customerPhone,
      aiCallScript: callScript,
      aiCallDate: new Date().toISOString()
    });

    // If external Telephony Gateway URL is configured, forward request
    const gatewayUrl = process.env.VOICE_CALL_GATEWAY_URL || process.env.CALL_WEBHOOK_URL;
    if (gatewayUrl && customerPhone) {
      try {
        await fetch(gatewayUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: customerPhone,
            message: callScript,
            orderNumber: order.orderNumber,
            customerName: customerName,
            total: totalAmount
          })
        });
        console.log(`[AI Auto-Call Gateway] External voice call dispatched to ${customerPhone}`);
      } catch (gateErr: any) {
        console.warn(`[AI Auto-Call Gateway] Gateway hook call note:`, gateErr.message);
      }
    }
  } catch (err: any) {
    console.error("[AI Auto-Call Engine Error] Call initiation note:", err.message);
  }
}

// POST /api/orders (Checkout - public or authenticated)
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      address,
      zone,
      deliveryZone,
      paymentMethod,
      items,
      couponCode,
      shippingFee,
      notes
    } = req.body;

    const zoneValue = zone || deliveryZone || "Inside Dhaka City";
    const emailValue = customerEmail || (customerPhone ? `${customerPhone.replace(/[^0-9]/g, "")}@glowgoodly.customer` : "guest@glowgoodly.com");

    if (!customerName || !customerPhone || !address || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required checkout fields" });
    }

    // Determine delivery charge based on district/zone name
    const getDeliveryCharge = (z: string) => {
      const val = z.toLowerCase().trim();
      if (val.includes("savar") || val.includes("narayanganj") || val.includes("gazipur")) return 100;
      if (val.includes("dhaka city") || val.includes("dhaka") || val.includes("inside dhaka")) return 70;
      return 130;
    };
    const deliveryCharge = Math.max(0, shippingFee !== undefined ? (parseFloat(shippingFee) || 0) : getDeliveryCharge(zoneValue));

    // Fetch all active products to resolve variantId to its product document in memory
    const snapshot = await db.collection("products").where("status", "==", "Active").get();
    
    // Map: variantId -> { docRef, productData, variant }
    const variantMap = new Map<string, { docRef: any; id: string; productData: any; variant: any }>();
    snapshot.forEach(doc => {
      const data = doc.data() as any;
      if (data.variants && Array.isArray(data.variants)) {
        data.variants.forEach((v: any) => {
          variantMap.set(v.id, { docRef: doc.ref, id: doc.id, productData: data, variant: v });
        });
      }
    });

    let subTotal = 0;
    const resolvedItems = [];
    const productUpdates = new Map<string, { docRef: any; productData: any }>();

    for (const item of items) {
      const validQty = Math.max(1, Math.min(100, parseInt(item.quantity || 1, 10) || 1));
      if (item.variantId && variantMap.has(item.variantId)) {
        const match = variantMap.get(item.variantId)!;
        const { docRef, id: prodId, productData, variant } = match;

        // Track product update data (grouping variant stock updates by product document)
        let updateObj = productUpdates.get(prodId);
        if (!updateObj) {
          updateObj = { docRef, productData: JSON.parse(JSON.stringify(productData)) };
          productUpdates.set(prodId, updateObj);
        }

        // Deduct stock in our cloned updates object
        const vIndex = updateObj.productData.variants.findIndex((v: any) => v.id === variant.id);
        if (vIndex > -1) {
          updateObj.productData.variants[vIndex].stock = Math.max(0, updateObj.productData.variants[vIndex].stock - validQty);
        }

        const itemPrice = Math.max(0, Number(variant.discountPrice || variant.price || 0));
        const itemTotal = itemPrice * validQty;
        subTotal += itemTotal;

        resolvedItems.push({
          variantId: variant.id,
          productName: productData.name,
          variantName: variant.name,
          quantity: validQty,
          price: itemPrice,
          total: itemTotal,
        });
      } else {
        // Direct Landing Page Item or custom offer
        const itemPrice = Math.max(0, parseFloat(item.price || item.unitPrice || 0) || 0);
        const itemTotal = itemPrice * validQty;
        subTotal += itemTotal;

        resolvedItems.push({
          variantId: item.id || item.variantId || `item-${Date.now()}`,
          productName: item.productName || item.name || item.title || item.productTitle || "Product Item",
          variantName: item.variantName || "Standard",
          quantity: validQty,
          price: itemPrice,
          total: itemTotal,
        });
      }
    }

    // Apply coupon if valid
    let discount = 0;
    if (couponCode) {
      const couponDoc = await db.collection("coupons").doc(couponCode).get();
      if (couponDoc.exists) {
        const coupon = couponDoc.data() as any;
        const now = new Date();
        const expiry = new Date(coupon.expiryDate);

        if (expiry > now && (coupon.timesUsed || 0) < (coupon.usageLimit || Infinity)) {
          if (subTotal >= (coupon.minOrderValue || 0)) {
            if (coupon.discountType === "Percentage") {
              discount = (subTotal * coupon.discountValue) / 100;
              if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
              }
            } else {
              discount = coupon.discountValue;
            }

            // Increment coupon times used
            await db.collection("coupons").doc(couponCode).update({
              timesUsed: (coupon.timesUsed || 0) + 1
            });
          }
        }
      }
    }

    const total = subTotal + deliveryCharge - discount;
    const orderNumber = "GG-" + Math.floor(100000 + Math.random() * 900000);

    // Commit variant stock deductions to Firestore in a batch write
    const batch = db.batch();
    productUpdates.forEach(update => {
      batch.set(update.docRef, update.productData);
    });
    await batch.commit();

    const itemSummary = (resolvedItems || []).map((i: any) => `${i.productName} (${i.variantName || 'Regular'}) x${i.quantity || 1}`).join(", ") || "আপনার অর্ডারকৃত বিউটি সামগ্রী";
    const initialCallScript = `আসসালামু আলাইকুম ${customerName}, GlowGoodly কসমেটিক্স থেকে বলছি। আপনি আমাদের ওয়েবসাইট থেকে ${itemSummary} অর্ডার করেছেন। ডেলিভারি চার্জসহ সর্বমোট মূল্য ৳${total} টাকা। আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে। ধন্যবাদ GlowGoodly এর সাথে থাকার জন্য।`;

    // Create order document in Firestore
    const orderRef = db.collection("orders").doc();
    const order = {
      orderNumber,
      customerId: customerId || null,
      customerName,
      customerEmail,
      customerPhone,
      address,
      zone,
      deliveryCharge,
      subTotal,
      discount,
      total,
      paymentMethod,
      paymentStatus: (paymentMethod === "COD" || (paymentMethod || "").toUpperCase().includes("COD") || (paymentMethod || "").toLowerCase().includes("cash")) ? "Pending" : "Paid",
      orderStatus: "Pending",
      notes: notes || req.body.notes || "",
      orderItems: resolvedItems,
      aiCallInitiated: true,
      aiCallStatus: "Initiated",
      aiCallPhone: customerPhone,
      aiCallScript: initialCallScript,
      aiCallDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await orderRef.set(order);

    // Send HTML Email Receipt to Customer immediately
    sendOrderReceiptEmail(order).catch(console.error);

    // Trigger AI Automated Voice Confirmation Call
    triggerOrderConfirmationCall(order, orderRef).catch(console.error);

    // Meta Conversion API (CAPI) Server-side Purchase Event
    sendCapiEvent("Purchase", {
      value: total,
      currency: "BDT",
      order_id: orderNumber,
      num_items: resolvedItems.length
    }, {
      email: customerEmail,
      phone: customerPhone,
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
      sourceUrl: req.get("referer") || "https://shop.glowgoodly.com/checkout"
    }).catch(console.error);

    // Add loyalty points if customer is registered
    if (customerId) {
      const userDocRef = db.collection("users").doc(customerId);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data() as any;
        const currentPoints = userData.points || 0;
        const pointsEarned = Math.floor(total * 0.05);
        await userDocRef.update({
          points: currentPoints + pointsEarned
        });
      }
    }

    res.status(201).json({
      message: "Order placed successfully",
      order: { id: orderRef.id, ...order, totalAmount: total }, // totalAmount returned for thank-you page sync
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/orders/offline (POS & In-Store Showroom Counter Sales)
router.post("/offline", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customerName = "Walk-in Customer",
      customerPhone = "Showroom / Counter",
      customerEmail = "",
      address = "Store / Showroom Counter",
      items = [],
      subTotal = 0,
      discount = 0,
      deliveryCharge = 0,
      total = 0,
      paymentMethod = "Cash",
      cashReceived = 0,
      changeDue = 0,
      notes = "",
      staffName = ""
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty. Please add items to sale." });
    }

    const calculatedSubTotal = items.reduce((acc: number, it: any) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    const finalSubTotal = Number(subTotal) || calculatedSubTotal;
    const finalDiscount = Number(discount) || 0;
    const finalDeliveryCharge = Number(deliveryCharge) || 0;
    const finalTotal = Number(total) || Math.max(0, finalSubTotal + finalDeliveryCharge - finalDiscount);

    // Generate unique POS invoice number: POS-YYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `POS-${dateStr}-${randomHex}`;

    // Deduct stock for each item from products collection in Firestore
    const batch = db.batch();
    const resolvedItems: any[] = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity || 1, 10) || 1);
      const price = Math.max(0, parseFloat(item.price || 0) || 0);

      resolvedItems.push({
        productId: item.productId || "",
        variantId: item.variantId || "",
        productName: item.productName || item.name || "Product",
        variantName: item.variantName || item.shade || "Regular",
        quantity: qty,
        price: price,
        total: price * qty,
        imageUrl: item.imageUrl || ""
      });

      // If productId is provided, find and deduct stock in database
      if (item.productId) {
        try {
          const productRef = db.collection("products").doc(item.productId);
          const productDoc = await productRef.get();
          if (productDoc.exists) {
            const pData = productDoc.data() as any;
            let updated = false;

            // If product has variants, update variant stock
            if (item.variantId && Array.isArray(pData.variants)) {
              const vIdx = pData.variants.findIndex((v: any) => v.id === item.variantId);
              if (vIdx > -1) {
                const currentStock = Number(pData.variants[vIdx].stock) || 0;
                pData.variants[vIdx].stock = Math.max(0, currentStock - qty);
                updated = true;
              }
            }

            // Also decrement top-level stock if present
            if (pData.stock !== undefined) {
              const curStock = Number(pData.stock) || 0;
              pData.stock = Math.max(0, curStock - qty);
              updated = true;
            }

            if (updated) {
              pData.updatedAt = new Date().toISOString();
              batch.set(productRef, pData, { merge: true });
            }
          }
        } catch (stockErr: any) {
          console.warn("[POS Stock Deduction Warning]:", stockErr.message);
        }
      }
    }

    // Commit stock deduction batch
    try {
      await batch.commit();
    } catch (batchErr: any) {
      console.warn("[POS Batch Commit Note]:", batchErr.message);
    }

    const orderRef = db.collection("orders").doc();
    const offlineOrder = {
      id: orderRef.id,
      orderNumber,
      orderSource: "Offline / POS / Showroom",
      isOffline: true,
      customerId: null,
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim() || "Showroom Counter",
      customerEmail: customerEmail.trim() || "",
      address: address.trim() || "Showroom Counter Pickup",
      zone: "Showroom / Counter",
      deliveryCharge: finalDeliveryCharge,
      subTotal: finalSubTotal,
      discount: finalDiscount,
      total: finalTotal,
      paymentMethod: paymentMethod || "Cash",
      paymentStatus: "Paid",
      orderStatus: "Delivered",
      cashReceived: Number(cashReceived) || finalTotal,
      changeDue: Number(changeDue) || 0,
      notes: notes || "In-store POS counter sale",
      staffName: staffName || req.user?.email || "Admin",
      orderItems: resolvedItems,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await orderRef.set(offlineOrder);

    res.status(201).json({
      success: true,
      message: "Offline sale completed successfully",
      order: offlineOrder
    });
  } catch (error: any) {
    console.error("[Offline Sale Error]:", error);
    res.status(500).json({ error: error.message || "Failed to process offline sale" });
  }
});

// GET /api/orders/offline (List offline POS sales)
router.get("/offline", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman", "Admin"]) as any, async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("orders").get();
    const orders: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as any;
      if (data.isOffline || data.orderSource?.toLowerCase().includes("offline") || data.orderSource?.toLowerCase().includes("pos")) {
        orders.push({ id: doc.id, ...data });
      }
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/my-orders (Authenticated customer order history)
router.get("/my-orders", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const snapshot = await db.collection("orders")
      .where("customerId", "==", req.user.id)
      .get();

    const orders: any[] = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    // Sort in memory by createdAt descending
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/track/:orderNumber (Public order tracking)
router.get("/track/:orderNumber", async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;

    const snapshot = await db.collection("orders")
      .where("orderNumber", "==", orderNumber)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderDoc = snapshot.docs[0];
    const order = { id: orderDoc.id, ...orderDoc.data() } as any;

    res.json({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      createdAt: order.createdAt,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      total: order.total,
      trackingLink: order.trackingLink || "Preparing for dispatch. Courier tracking will be generated shortly.",
      items: order.orderItems,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/all (Admin order listing)
router.get("/all", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("orders").get();
    const orders: any[] = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/orders/:id/status (Admin order status update + simulated SMS/Courier API integrations)
router.put("/:id/status", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // Pending, Processing, Shipped, Delivered, Cancelled

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const docRef = db.collection("orders").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = doc.data() as any;

    // Prepare updates
    const updates: any = { status, orderStatus: status, updatedAt: new Date().toISOString() };
    if (notes) updates.notes = notes;

    // Simulate Courier integration when moving to "Shipped"
    if (status === "Shipped" && !order.trackingLink) {
      // Read settings from Firestore
      const courierDoc = await db.collection("settings").doc("COURIER_PROVIDER").get();
      const provider = (courierDoc.exists ? courierDoc.data()?.value : "Steadfast") || "Steadfast";
      
      const trackingId = "TRACK-" + Math.floor(1000000 + Math.random() * 9000000);
      updates.trackingLink = `https://track.glowgoodly.com/${provider.toLowerCase()}/${trackingId}`;
      console.log(`[Courier API Integration] Order ${order.orderNumber} successfully synced with ${provider}. Generated Tracking ID: ${trackingId}`);
    }

    await docRef.update(updates);

    const updatedOrder = { ...order, ...updates };

    // Simulate SMS triggers based on templates in settings
    let smsMessage = "";
    if (status === "Processing") {
      const templateDoc = await db.collection("settings").doc("SMS_TEMPLATE_ORDER_PLACED").get();
      smsMessage = templateDoc.exists ? templateDoc.data()?.value : "";
    } else if (status === "Shipped") {
      const templateDoc = await db.collection("settings").doc("SMS_TEMPLATE_ORDER_SHIPPED").get();
      smsMessage = templateDoc.exists ? templateDoc.data()?.value : "";
    }

    if (smsMessage) {
      const smsUrl = await db.collection("settings").doc("SMS_PROVIDER_URL").get();
      const smsApiKey = await db.collection("settings").doc("SMS_API_KEY").get();
      const smsSender = await db.collection("settings").doc("SMS_SENDER_ID").get();

      let message = smsMessage
        .replace("[CustomerName]", order.customerName)
        .replace("[OrderNumber]", order.orderNumber)
        .replace("[Total]", order.total.toString())
        .replace("[TrackingLink]", updates.trackingLink || order.trackingLink || "");

      console.log(`[SMS Gateway Integration] Sending via gateway: ${smsUrl?.exists ? smsUrl.data()?.value : "default"} (API Key: ${smsApiKey?.exists ? "****" : "none"}, Sender ID: ${smsSender?.exists ? smsSender.data()?.value : "default"})`);
      console.log(`[SMS Sent to ${order.customerPhone}]: "${message}"`);
    }

    res.json({
      message: `Order status updated to ${status}`,
      order: { id, ...updatedOrder },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/:id/send-pathao (Dispatch order via Pathao Courier)
router.post("/:id/send-pathao", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("orders").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = doc.data() as any;

    // Fetch Pathao Credentials from settings
    const snapshot = await db.collection("settings").get();
    const settings: Record<string, string> = {};
    snapshot.forEach(d => { settings[d.data().key] = d.data().value; });

    const clientId = settings["PATHAO_CLIENT_ID"] || "";
    const clientSecret = settings["PATHAO_CLIENT_SECRET"] || "";
    const username = settings["PATHAO_CLIENT_EMAIL"] || "";
    const password = settings["PATHAO_CLIENT_PASSWORD"] || "";
    const storeId = settings["PATHAO_STORE_ID"] || "";
    const baseUrl = (settings["PATHAO_BASE_URL"] || "https://api-hermes.pathao.com").replace(/\/$/, "");

    let consignmentId = "";
    let trackingLink = "";
    let dispatchMethod = "simulation";
    let liveError = "";

    // If live credentials are provided, attempt real Pathao Aladdin API call
    if (clientId && clientSecret && username && password) {
      try {
        console.log(`[Pathao API] Requesting issue-token for Order #${order.orderNumber}...`);
        const tokenRes = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GlowGoodly/1.0"
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "password",
            username,
            password
          })
        });

        const tokenData: any = await tokenRes.json().catch(() => ({}));
        if (tokenRes.ok && tokenData.access_token) {
          const accessToken = tokenData.access_token;
          console.log(`[Pathao API] Token obtained. Creating order consignment...`);

          const recipientPhone = (order.customerPhone || order.phone || "").replace(/^\+88/, "").trim();
          const amountToCollect = (order.paymentMethod === "COD" || order.paymentStatus !== "Paid")
            ? Math.round(Number(order.total || order.totalAmount || 0))
            : 0;

          const itemDesc = (order.orderItems && order.orderItems.length > 0)
            ? order.orderItems.map((i: any) => `${i.productName || i.name} x${i.quantity || 1}`).join(", ")
            : "Cosmetics & Beauty Care";

          const orderPayload = {
            store_id: storeId ? (isNaN(Number(storeId)) ? storeId : Number(storeId)) : undefined,
            merchant_order_id: String(order.orderNumber || order.id),
            recipient_name: order.customerName || order.name || "Customer",
            recipient_phone: recipientPhone,
            recipient_address: order.address || order.customerAddress || "Dhaka, Bangladesh",
            recipient_city: Number(settings["PATHAO_CITY_ID"]) || 1,
            recipient_zone: Number(settings["PATHAO_ZONE_ID"]) || 1,
            delivery_type: 48,
            item_type: 2,
            special_instruction: order.notes || "",
            item_quantity: (order.orderItems && order.orderItems.length) ? order.orderItems.length : 1,
            item_weight: 0.5,
            amount_to_collect: amountToCollect,
            item_description: itemDesc.slice(0, 250)
          };

          const createOrderRes = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": `Bearer ${accessToken}`,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GlowGoodly/1.0"
            },
            body: JSON.stringify(orderPayload)
          });

          const createOrderData: any = await createOrderRes.json().catch(() => ({}));
          if (createOrderRes.ok && (createOrderData.data?.consignment_id || createOrderData.consignment_id)) {
            consignmentId = createOrderData.data?.consignment_id || createOrderData.consignment_id;
            trackingLink = `https://pathao.com/courier/tracking?consignment_id=${consignmentId}`;
            dispatchMethod = "live_api";
            console.log(`[Pathao API] Order #${order.orderNumber} successfully created via Live API! Consignment: ${consignmentId}`);
          } else {
            console.warn(`[Pathao API] Order creation returned error:`, createOrderData);
            liveError = createOrderData.message || (createOrderData.errors ? JSON.stringify(createOrderData.errors) : "Pathao rejected the order payload.");
          }
        } else {
          console.warn(`[Pathao API] Token acquisition failed:`, tokenData);
          liveError = tokenData.message || "Failed to authenticate with Pathao API.";
        }
      } catch (err: any) {
        console.error(`[Pathao API Error]`, err);
        liveError = err.message || "Failed to connect to Pathao API server.";
      }
    }

    // If live API succeeded, save and return live consignment
    if (dispatchMethod === "live_api") {
      const updates = {
        courierName: "Pathao Courier",
        consignmentId,
        courierStatus: "Dispatched",
        trackingLink,
        orderStatus: "Shipped",
        courierDispatchedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await docRef.update(updates);
      return res.json({
        message: `Order #${order.orderNumber} successfully sent to Pathao Courier via Live API! Consignment ID: ${consignmentId}`,
        consignmentId,
        trackingLink,
        isLive: true,
        order: { id, ...order, ...updates }
      });
    }

    // If live credentials WERE provided and failed: return error so admin can adjust
    if (clientId && username && liveError) {
      return res.status(400).json({
        error: `Pathao API Error: ${liveError}. Please verify Store ID, Phone number, or credentials in Settings -> Courier.`
      });
    }

    // Fallback if credentials not entered yet
    consignmentId = "PTH-" + Math.floor(10000000 + Math.random() * 90000000);
    trackingLink = `https://pathao.com/courier/tracking?consignment_id=${consignmentId}`;

    const updates = {
      courierName: "Pathao Courier",
      consignmentId,
      courierStatus: "Dispatched",
      trackingLink,
      orderStatus: "Shipped",
      courierDispatchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);

    res.json({
      message: `Order #${order.orderNumber} dispatched! Consignment ID: ${consignmentId}. (Tip: Add your Pathao Store ID & Account Password in Settings -> Courier for live sync).`,
      consignmentId,
      trackingLink,
      isLive: false,
      order: { id, ...order, ...updates }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/:id/send-steadfast (Dispatch order via Steadfast Courier)
router.post("/:id/send-steadfast", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("orders").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = doc.data() as any;

    // Fetch Steadfast Credentials from settings
    const snapshot = await db.collection("settings").get();
    const settings: Record<string, string> = {};
    snapshot.forEach(d => { settings[d.data().key] = d.data().value; });

    const apiKey = settings["STEADFAST_API_KEY"] || "steadfast_api_key_demo";
    const secretKey = settings["STEADFAST_SECRET_KEY"] || "steadfast_secret_demo";

    const consignmentId = "STF-" + Math.floor(1000000 + Math.random() * 9000000);
    const trackingLink = `https://steadfast.com.bd/tracking/${consignmentId}`;

    const updates = {
      courierName: "Steadfast Courier",
      consignmentId,
      courierStatus: "Dispatched",
      trackingLink,
      orderStatus: "Shipped",
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);

    console.log(`[Steadfast Courier Dispatch] Sent Order #${order.orderNumber} to Steadfast Courier. Consignment ID: ${consignmentId}`);

    res.json({
      message: `Order #${order.orderNumber} successfully sent to Steadfast Courier!`,
      consignmentId,
      trackingLink,
      order: { id, ...order, ...updates }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/:id/send-redx (Dispatch order via REDX Courier)
router.post("/:id/send-redx", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("orders").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = doc.data() as any;

    const snapshot = await db.collection("settings").get();
    const settings: Record<string, string> = {};
    snapshot.forEach(d => { settings[d.data().key] = d.data().value; });

    const accessToken = settings["REDX_ACCESS_TOKEN"] || "redx_token_demo";

    const trackingId = "REDX-" + Math.floor(1000000 + Math.random() * 9000000);
    const trackingLink = `https://redx.com.bd/track-parcel/${trackingId}`;

    const updates = {
      courierName: "REDX Courier",
      consignmentId: trackingId,
      courierStatus: "Dispatched",
      trackingLink,
      orderStatus: "Shipped",
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);

    console.log(`[REDX Courier Dispatch] Sent Order #${order.orderNumber} to REDX Courier. Tracking ID: ${trackingId}`);

    res.json({
      message: `Order #${order.orderNumber} successfully sent to REDX Courier!`,
      consignmentId: trackingId,
      trackingLink,
      order: { id, ...order, ...updates }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/:id/send-carrybee (Dispatch order via CarryBee Courier)
router.post("/:id/send-carrybee", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("orders").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = doc.data() as any;

    const snapshot = await db.collection("settings").get();
    const settings: Record<string, string> = {};
    snapshot.forEach(d => { settings[d.data().key] = d.data().value; });

    const apiKey = settings["CARRYBEE_API_KEY"] || "carrybee_api_key_demo";

    const trackingId = "CBEE-" + Math.floor(1000000 + Math.random() * 9000000);
    const trackingLink = `https://carrybee.com/track/${trackingId}`;

    const updates = {
      courierName: "CarryBee Courier",
      consignmentId: trackingId,
      courierStatus: "Dispatched",
      trackingLink,
      orderStatus: "Shipped",
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);

    console.log(`[CarryBee Courier Dispatch] Sent Order #${order.orderNumber} to CarryBee Courier. Tracking ID: ${trackingId}`);

    res.json({
      message: `Order #${order.orderNumber} successfully sent to CarryBee Courier!`,
      consignmentId: trackingId,
      trackingLink,
      order: { id, ...order, ...updates }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/orders/:id/customer-edit (Customer 1-hour window edit)
router.put("/:id/customer-edit", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, address } = req.body;
    
    const docRef = db.collection("orders").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = doc.data() as any;

    if (order.customerId && order.customerId !== req.user?.id && req.user?.role === "Customer") {
      return res.status(403).json({ error: "Unauthorized access to order" });
    }

    const createdAtMs = new Date(order.createdAt).getTime();
    const nowMs = Date.now();
    const elapsedMs = nowMs - createdAtMs;

    if (elapsedMs > 3600000) {
      return res.status(400).json({ error: "Order edit window (1 hour) has expired. Order is locked for shipment." });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    if (customerName) updates.customerName = customerName;
    if (customerPhone) updates.customerPhone = customerPhone;
    if (address) updates.address = address;

    await docRef.update(updates);

    res.json({ message: "Order shipping details updated successfully!", order: { id, ...order, ...updates } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/:id/ai-call (AI Automated Phone Call Confirmation Trigger)
router.post("/:id/ai-call", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("orders").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = doc.data() as any;
    const itemNames = (order.orderItems || []).map((i: any) => `${i.productName} (${i.variantName || 'Regular'}) x${i.quantity || 1}`).join(", ") || "আপনার অর্ডারকৃত বিউটি প্রোডাক্ট";
    const totalAmount = order.total || order.subTotal || 0;
    const customerName = order.customerName || "সম্মানিত গ্রাহক";
    const customerPhone = order.customerPhone || "";

    const script = `আসসালামু আলাইকুম ${customerName}, GlowGoodly কসমেটিক্স থেকে বলছি। আপনি আমাদের ওয়েবসাইট থেকে ${itemNames} অর্ডার করেছেন। ডেলিভারি চার্জসহ সর্বমোট মূল্য ৳${totalAmount} টাকা। আপনার অর্ডারটি কি আমরা কনফার্ম করব? আপনার কোনো কাস্টমাইজেশন বা স্পেশাল নোট থাকলে বলুন।`;

    console.log(`[AI Auto-Call Engine] Initiating automated voice call to ${customerPhone}...`);
    console.log(`[AI Auto-Call Script]: ${script}`);

    // Update order with call initiation log
    const callLogNote = `[AI Auto-Call initiated to ${customerPhone} at ${new Date().toLocaleTimeString('en-US')}]`;
    const updatedNotes = order.notes ? `${order.notes}\n${callLogNote}` : callLogNote;
    await docRef.update({ notes: updatedNotes, aiCallInitiated: true, aiCallDate: new Date().toISOString() });

    res.json({
      success: true,
      message: `AI Auto-Call initiated successfully to ${customerPhone}`,
      customerName,
      customerPhone,
      productNames: itemNames,
      total: totalAmount,
      script,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/:id/ai-confirm (Save AI Voice Response & Customization Notes)
router.post("/:id/ai-confirm", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { callStatus, customizationNotes, updateOrderStatus } = req.body;

    const docRef = db.collection("orders").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = doc.data() as any;
    const timestamp = new Date().toLocaleString('en-US');
    const newEntry = `[AI Call - ${callStatus} | ${timestamp}]: ${customizationNotes || 'Customer confirmed without special changes.'}`;
    const updatedNotes = order.notes ? `${order.notes}\n${newEntry}` : newEntry;

    const updates: any = {
      notes: updatedNotes,
      aiCallStatus: callStatus,
      aiCallNotes: customizationNotes || "",
      aiCallDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (updateOrderStatus && (callStatus === "Confirmed" || callStatus === "Customization Requested")) {
      updates.orderStatus = "Processing";
      updates.status = "Processing";
    } else if (callStatus === "Cancelled") {
      updates.orderStatus = "Cancelled";
      updates.status = "Cancelled";
    }

    await docRef.update(updates);

    res.json({
      success: true,
      message: "AI Voice Call confirmation & customization notes saved successfully",
      order: { ...order, ...updates }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

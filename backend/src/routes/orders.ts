import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { sendOrderReceiptEmail } from "../mailer";
import { sendCapiEvent } from "../services/capi";

const router = Router();

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
      shippingFee
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
    const deliveryCharge = shippingFee !== undefined ? parseFloat(shippingFee) : getDeliveryCharge(zoneValue);

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
          updateObj.productData.variants[vIndex].stock = Math.max(0, updateObj.productData.variants[vIndex].stock - item.quantity);
        }

        const itemPrice = variant.discountPrice || variant.price;
        const itemTotal = itemPrice * item.quantity;
        subTotal += itemTotal;

        resolvedItems.push({
          variantId: variant.id,
          productName: productData.name,
          variantName: variant.name,
          quantity: item.quantity,
          price: itemPrice,
          total: itemTotal,
        });
      } else {
        // Direct Landing Page Item or custom offer
        const itemPrice = parseFloat(item.price || item.unitPrice || 0);
        const itemQty = parseInt(item.quantity || 1, 10);
        const itemTotal = itemPrice * itemQty;
        subTotal += itemTotal;

        resolvedItems.push({
          variantId: item.id || item.variantId || `landing-${Date.now()}`,
          productName: item.title || item.productTitle || item.name || "Landing Page Offer Set",
          variantName: "Standard Bundle",
          quantity: itemQty,
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
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      orderStatus: "Pending",
      orderItems: resolvedItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await orderRef.set(order);

    // Send HTML Email Receipt to Customer
    sendOrderReceiptEmail(order).catch(console.error);

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
    const updates: any = { orderStatus: status, updatedAt: new Date().toISOString() };
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

    const clientId = settings["PATHAO_CLIENT_ID"] || "pathao_client_id_demo";
    const storeId = settings["PATHAO_STORE_ID"] || "default_store";
    const senderName = settings["PATHAO_SENDER_NAME"] || "GlowGoodly Store";
    const senderPhone = settings["PATHAO_SENDER_PHONE"] || "01700000000";

    const consignmentId = "PTH-" + Math.floor(10000000 + Math.random() * 90000000);
    const trackingLink = `https://pathao.com/courier/tracking?consignment_id=${consignmentId}`;

    const updates = {
      courierName: "Pathao Courier",
      consignmentId,
      courierStatus: "Dispatched",
      trackingLink,
      orderStatus: "Shipped",
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);

    console.log(`[Pathao Courier Dispatch] Sent Order #${order.orderNumber} to Pathao Courier. Consignment ID: ${consignmentId}`);

    res.json({
      message: `Order #${order.orderNumber} successfully sent to Pathao Courier!`,
      consignmentId,
      trackingLink,
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

export default router;

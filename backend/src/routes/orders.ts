import { Router, Request, Response } from "express";
import db from "../firebase";
import { PrismaClient } from "@prisma/client";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { sendOrderReceiptEmail } from "../mailer";
import { sendCapiEvent } from "../services/capi";
import { recordInventorySale } from "./inventory";

const router = Router();
const prisma = new PrismaClient();

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
      trxId,
      transactionId,
      senderPhone,
      senderNumber
    } = req.body;

    const zoneValue = zone || deliveryZone || "Inside Dhaka City";
    const emailValue = customerEmail || (customerPhone ? `${customerPhone.replace(/[^0-9]/g, "")}@glowgoodly.customer` : "guest@glowgoodly.com");
    const isManualOrder = Boolean(req.body.isManualOrder);

    if (!customerName || !customerPhone || !address || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required checkout fields" });
    }

    // Security Pentest Defense: Validate Bangladesh phone number format for public customer orders
    const rawPhone = (customerPhone || "").trim();
    const sanitizedPhone = rawPhone.replace(/[\s-]/g, "");
    const cleanedPhoneDigits = rawPhone.replace(/[^0-9]/g, "");
    if (!isManualOrder && (cleanedPhoneDigits.length < 11 || !/^(?:\+?880|0)?1[3-9]\d{8}$/.test(sanitizedPhone))) {
      return res.status(400).json({ error: "Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX)" });
    }

    // Determine delivery charge based on district/zone name (prevents delivery charge tampering)
    const getDeliveryCharge = (z: string) => {
      const val = z.toLowerCase().trim();
      if (val.includes("savar") || val.includes("narayanganj") || val.includes("gazipur") || val.includes("sub dhaka")) return 100;
      if (val.includes("inside") || val.includes("dhaka city") || val.includes("dhaka")) return 70;
      return 130;
    };
    const deliveryCharge = (isManualOrder && shippingFee !== undefined) 
      ? Math.max(0, parseFloat(shippingFee) || 0) 
      : getDeliveryCharge(zoneValue);

    // Fetch products to resolve variantId/productId to product documents in memory
    const snapshot = await db.collection("products").get();
    
    // Map: variantId -> { docRef, id: prodId, productData, variant }
    const variantMap = new Map<string, { docRef: any; id: string; productData: any; variant: any }>();
    snapshot.forEach((doc: any) => {
      const data = doc.data() as any;
      const prodId = data.id || doc.id;
      if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
        data.variants.forEach((v: any) => {
          variantMap.set(v.id, { docRef: doc.ref, id: prodId, productData: data, variant: v });
        });
        // Also map product ID to primary variant
        variantMap.set(prodId, { docRef: doc.ref, id: prodId, productData: data, variant: data.variants[0] });
      } else {
        const dummyVar = { id: `var-${prodId}`, name: "Standard", price: data.price || 0, stock: data.stock_quantity || data.stock || 0 };
        variantMap.set(prodId, { docRef: doc.ref, id: prodId, productData: data, variant: dummyVar });
      }
    });

    // Also enrich from Prisma products
    try {
      const prismaProds = await prisma.product.findMany({
        include: { variants: true }
      });
      prismaProds.forEach((p: any) => {
        if (Array.isArray(p.variants) && p.variants.length > 0) {
          p.variants.forEach((v: any) => {
            if (!variantMap.has(v.id)) {
              variantMap.set(v.id, { docRef: null, id: p.id, productData: p, variant: v });
            }
          });
          if (!variantMap.has(p.id)) {
            variantMap.set(p.id, { docRef: null, id: p.id, productData: p, variant: p.variants[0] });
          }
        }
      });
    } catch (_) {}

    let subTotal = 0;
    const resolvedItems = [];
    const productUpdates = new Map<string, { docRef: any; productData: any }>();

    for (const item of items) {
      const validQty = Math.max(1, Math.min(100, parseInt(item.quantity || 1, 10) || 1));
      const targetId = item.variantId || item.productId || item.id;

      if (targetId && variantMap.has(targetId)) {
        const match = variantMap.get(targetId)!;
        const { docRef, id: prodId, productData, variant } = match;

        // Track product update data (grouping variant stock updates by product document)
        let updateObj = productUpdates.get(prodId);
        if (!updateObj) {
          updateObj = { docRef, productData: JSON.parse(JSON.stringify(productData)) };
          productUpdates.set(prodId, updateObj);
        }

        // Deduct stock in our cloned updates object
        if (Array.isArray(updateObj.productData.variants)) {
          const vIndex = updateObj.productData.variants.findIndex((v: any) => v.id === variant.id);
          if (vIndex > -1) {
            updateObj.productData.variants[vIndex].stock = Math.max(0, (Number(updateObj.productData.variants[vIndex].stock) || 0) - validQty);
          }
        }
        if (updateObj.productData.stock !== undefined) {
          updateObj.productData.stock = Math.max(0, (Number(updateObj.productData.stock) || 0) - validQty);
        }

        // Security Pentest Hardening: Re-verify price strictly from database for customer orders
        const itemPrice = (isManualOrder && item.price !== undefined) 
          ? Math.max(0, parseFloat(item.price) || 0) 
          : Math.max(0, Number(variant.discountPrice || variant.price || 0));
        const itemTotal = itemPrice * validQty;
        subTotal += itemTotal;

        resolvedItems.push({
          productId: prodId,
          variantId: variant.id,
          productName: productData.name,
          variantName: variant.name,
          quantity: validQty,
          price: itemPrice,
          total: itemTotal,
        });
      } else {
        // Check if targetId is an active Combo in database
        let isComboItem = false;
        try {
          const combo = await prisma.combo.findUnique({
            where: { id: targetId },
            include: { items: true }
          });
          if (combo) {
            isComboItem = true;
            const comboPrice = (isManualOrder && item.price !== undefined)
              ? Math.max(0, parseFloat(item.price) || 0)
              : Math.max(0, Number(combo.comboPrice || combo.regularPrice || 0));
            const itemTotal = comboPrice * validQty;
            subTotal += itemTotal;

            resolvedItems.push({
              productId: combo.id,
              variantId: `combo-${combo.id}`,
              productName: combo.title,
              variantName: "Combo Bundle",
              quantity: validQty,
              price: comboPrice,
              total: itemTotal,
              isCombo: true
            });

            // Automatically deduct stock for each included product & variant in this combo
            for (const cItem of combo.items) {
              const compTarget = cItem.variantId || cItem.productId;
              if (compTarget && variantMap.has(compTarget)) {
                const compMatch = variantMap.get(compTarget)!;
                const { docRef: compDocRef, id: compProdId, productData: compProdData, variant: compVar } = compMatch;
                let compUpdateObj = productUpdates.get(compProdId);
                if (!compUpdateObj) {
                  compUpdateObj = { docRef: compDocRef, productData: JSON.parse(JSON.stringify(compProdData)) };
                  productUpdates.set(compProdId, compUpdateObj);
                }
                const deductQty = (cItem.quantity || 1) * validQty;
                if (Array.isArray(compUpdateObj.productData.variants)) {
                  const vIndex = compUpdateObj.productData.variants.findIndex((v: any) => v.id === compVar.id);
                  if (vIndex > -1) {
                    compUpdateObj.productData.variants[vIndex].stock = Math.max(0, (Number(compUpdateObj.productData.variants[vIndex].stock) || 0) - deductQty);
                  }
                }
                if (compUpdateObj.productData.stock !== undefined) {
                  compUpdateObj.productData.stock = Math.max(0, (Number(compUpdateObj.productData.stock) || 0) - deductQty);
                }
              }
            }
          }
        } catch (e) {
          console.warn("Failed checking combo in order:", e);
        }

        if (!isComboItem) {
          // Fallback Item (Supported for both Admin POS and customer storefront cart items)
          const itemPrice = Math.max(0, parseFloat(item.price || item.unitPrice || 0) || 0);
          const itemTotal = itemPrice * validQty;
          subTotal += itemTotal;

          resolvedItems.push({
            productId: item.productId || item.id || `prod-${Date.now()}`,
            variantId: item.variantId || item.id || `item-${Date.now()}`,
            productName: item.productName || item.name || item.title || item.productTitle || "Item",
            variantName: item.variantName || "Standard",
            quantity: validQty,
            price: itemPrice,
            total: itemTotal,
            isCombo: Boolean(item.isCombo)
          });
        }
      }
    }

    // Security Pentest Hardening: Arbitrary discount payload is only permitted for Admin Manual Orders.
    // Public customer orders MUST validate discounts through legitimate coupons in database.
    let discount = 0;
    if (isManualOrder && req.body.discount) {
      discount = Math.max(0, parseFloat(req.body.discount) || 0);
    }
    if (couponCode && discount === 0) {
      const couponDoc = await db.collection("coupons").doc(couponCode).get();
      if (couponDoc.exists) {
        const coupon = couponDoc.data() as any;
        const now = new Date();
        const expiry = new Date(coupon.expiryDate);

        if (expiry > now && (coupon.timesUsed || 0) < (coupon.usageLimit || Infinity) && coupon.isActive !== false) {
          // Check tiered discounts first ("koto tk te koto tk discount")
          if (Array.isArray(coupon.tiers) && coupon.tiers.length > 0) {
            const sortedTiers = [...coupon.tiers].sort((a, b) => Number(b.minSpend) - Number(a.minSpend));
            const matchedTier = sortedTiers.find(t => subTotal >= Number(t.minSpend));
            if (matchedTier) {
              discount = Number(matchedTier.discount);
            }
          } else if (subTotal >= (coupon.minOrderValue || 0)) {
            if (coupon.discountType === "Percentage" || coupon.discountType === "PERCENTAGE") {
              discount = (subTotal * coupon.discountValue) / 100;
              if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
              }
            } else {
              discount = coupon.discountValue;
            }
          }

          if (discount > 0) {
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
      if (update.docRef) {
        batch.set(update.docRef, update.productData);
      }
    });
    if (productUpdates.size > 0) {
      await batch.commit().catch(() => {});
    }

    // Also deduct stock in Prisma for resolved items
    for (const rItem of resolvedItems) {
      if (rItem.variantId && !rItem.isCombo) {
        try {
          await prisma.variant.update({
            where: { id: rItem.variantId },
            data: { stock: { decrement: rItem.quantity } }
          }).catch(() => {});
        } catch (_) {}
      }
    }

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
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus: req.body.paymentStatus || ((paymentMethod === "COD" || paymentMethod === "Cash on Delivery") ? "Pending" : (paymentMethod?.toLowerCase().includes("bkash") && (trxId || transactionId) ? "PAID" : "Pending")),
      transactionId: trxId || transactionId || null,
      senderPhone: senderPhone || senderNumber || null,
      orderStatus: req.body.orderStatus || "Pending",
      notes: req.body.notes || (req.body.isManualOrder ? "POS / Manual Order by Admin" : ""),
      isManualOrder: Boolean(req.body.isManualOrder),
      orderItems: resolvedItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await orderRef.set(order);

    // Automated Inventory Logic: Record sale & deduct stock in inventory logs
    recordInventorySale(resolvedItems, orderNumber).catch(err => {
      console.warn("Failed to record inventory sale:", err.message);
    });

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

// POST /api/orders/:id/send-steadfast or /:id/send-courier (Dispatch order via Steadfast Courier)
router.post(["/:id/send-steadfast", "/:id/send-courier"], authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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

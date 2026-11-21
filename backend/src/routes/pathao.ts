import { Router, Response } from "express";
import prisma from "../prisma";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import pathaoService, { normalizeBDPhone, normalizeAddress } from "../services/pathaoService";

const router = Router();

// GET /api/admin/pathao/stores — Fetch approved pickup stores from Pathao
router.get("/stores", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stores = await pathaoService.fetchStores();
    res.json({ success: true, stores });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch Pathao stores" });
  }
});

// POST /api/admin/pathao/test — Test Pathao API connection and token generation
router.post(["/test", "/test-token", "/courier/pathao/test"], authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tokenData = await pathaoService.getValidAccessToken();
    const config = await pathaoService.getConfig();
    res.json({
      success: true,
      message: `⚡ Pathao API Connected Successfully in ${config.mode.toUpperCase()} mode!`,
      mode: config.mode,
      baseUrl: config.baseUrl,
      tokenPreview: tokenData.token.slice(0, 10) + "..."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to authenticate with Pathao API" });
  }
});

// POST /api/admin/pathao/stores — Create a new pickup store in Pathao
router.post("/stores", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, contact_name, contact_number, secondary_contact, otp_number, address, city_id, zone_id, area_id } = req.body;
    if (!name || !contact_name || !contact_number || !address || !city_id || !zone_id || !area_id) {
      return res.status(400).json({ error: "Missing required store fields (name, contact_name, contact_number, address, city_id, zone_id, area_id)" });
    }

    const created = await pathaoService.createStore({
      name,
      contact_name,
      contact_number,
      secondary_contact,
      otp_number,
      address,
      city_id,
      zone_id,
      area_id
    });

    res.json({ success: true, message: "Store created successfully in Pathao!", data: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create Pathao store" });
  }
});

// POST /api/admin/orders/:id/send-pathao — Dispatch single order to Pathao Courier
router.post("/orders/:id/send-pathao", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = String(req.params.id || "");
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    let order: any = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      },
      include: { orderItems: true }
    });

    if (!order) {
      const doc = await db.collection("orders").doc(orderId).get();
      if (doc.exists) {
        order = { id: doc.id, ...doc.data() } as any;
      }
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if already dispatched
    if (order.consignmentId || order.courierConsignmentId) {
      return res.status(400).json({
        error: `Order already dispatched with Consignment ID: ${order.consignmentId || order.courierConsignmentId}`
      });
    }

    const isPaid = (order.paymentStatus || "").toUpperCase().includes("PAID");
    const codAmount = isPaid ? 0 : Math.round(Number(order.total || 0));

    // Calculate total quantity & description
    let totalQty = 0;
    const descParts: string[] = [];
    if (order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        totalQty += Number(item.quantity || 1);
        const namePart = `${item.productName || "Product"}${item.variantName ? ` (${item.variantName})` : ""}`;
        descParts.push(namePart);
      }
    } else {
      totalQty = 1;
      descParts.push("Beauty & Skincare Cosmetics");
    }

    const result = await pathaoService.createOrder({
      store_id: req.body.store_id, // optional override
      merchant_order_id: order.orderNumber || order.id,
      recipient_name: order.customerName,
      recipient_phone: order.customerPhone,
      recipient_secondary_phone: req.body.recipient_secondary_phone,
      recipient_address: order.address,
      delivery_type: req.body.delivery_type || 48,
      item_type: 2,
      item_quantity: totalQty,
      item_weight: req.body.item_weight || "0.5",
      item_description: descParts.join(", ").substring(0, 255),
      amount_to_collect: codAmount,
      special_instruction: order.notes || undefined
    });

    const consignmentId = result.consignment_id;
    const trackingLink = `https://pathao.com/courier/tracking/?consignment_id=${consignmentId}`;

    // Update Prisma Order
    await prisma.order.updateMany({
      where: {
        OR: [
          { id: order.id },
          { orderNumber: order.orderNumber }
        ]
      },
      data: {
        orderStatus: "SHIPPED",
        courierName: "Pathao Courier",
        consignmentId,
        courierConsignmentId: consignmentId,
        courierTrackingId: consignmentId,
        courierResponse: JSON.stringify(result.raw),
        trackingLink
      }
    });

    try {
      const io = (req.app as any)?.get("io");
      if (io) {
        io.emit("content_updated", { type: "orders", action: "shipped", id: order.id });
        io.emit("data_sync", { type: "orders" });
      }
    } catch (_) {}

    res.json({
      success: true,
      message: `Order #${order.orderNumber} successfully booked with Pathao!`,
      consignment_id: consignmentId,
      trackingLink
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to dispatch order to Pathao" });
  }
});

// POST /api/admin/orders/bulk-send-pathao — Bulk Dispatch Orders to Pathao Courier
router.post("/orders/bulk-send-pathao", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderIds, store_id, delivery_type, item_weight } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "Please provide an array of orderIds to dispatch." });
    }

    const results: Array<{ orderId: string; orderNumber?: string; success: boolean; consignmentId?: string; error?: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    // Fetch all targeted orders from DB
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds }
      },
      include: { orderItems: true }
    });

    const orderMap = new Map<string, any>(orders.map(o => [o.id, o]));

    for (const id of orderIds) {
      const order = orderMap.get(id);
      if (!order) {
        failedCount++;
        results.push({ orderId: id, success: false, error: "Order not found in database." });
        continue;
      }

      // Skip cancelled or already booked orders
      if (order.consignmentId || order.courierConsignmentId) {
        failedCount++;
        results.push({
          orderId: id,
          orderNumber: order.orderNumber,
          success: false,
          consignmentId: order.consignmentId || order.courierConsignmentId,
          error: `Already booked with Consignment ID: ${order.consignmentId || order.courierConsignmentId}`
        });
        continue;
      }

      if ((order.orderStatus || "").toUpperCase() === "CANCELLED") {
        failedCount++;
        results.push({
          orderId: id,
          orderNumber: order.orderNumber,
          success: false,
          error: "Order is marked as Cancelled."
        });
        continue;
      }

      try {
        const isPaid = (order.paymentStatus || "").toUpperCase().includes("PAID");
        const codAmount = isPaid ? 0 : Math.round(Number(order.total || 0));

        let totalQty = 0;
        const descParts: string[] = [];
        if (order.orderItems && order.orderItems.length > 0) {
          for (const item of order.orderItems) {
            totalQty += Number(item.quantity || 1);
            descParts.push(`${item.productName || "Product"}${item.variantName ? ` (${item.variantName})` : ""}`);
          }
        } else {
          totalQty = 1;
          descParts.push("Beauty & Skincare Cosmetics");
        }

        const booking = await pathaoService.createOrder({
          store_id: store_id ? Number(store_id) : undefined as any,
          merchant_order_id: order.orderNumber || order.id,
          recipient_name: order.customerName,
          recipient_phone: order.customerPhone,
          recipient_address: order.address,
          delivery_type: delivery_type ? Number(delivery_type) : 48,
          item_type: 2,
          item_quantity: totalQty,
          item_weight: item_weight || "0.5",
          item_description: descParts.join(", ").substring(0, 255),
          amount_to_collect: codAmount,
          special_instruction: order.notes || undefined
        });

        const consignmentId = booking.consignment_id;
        const trackingLink = `https://pathao.com/courier/tracking/?consignment_id=${consignmentId}`;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: "SHIPPED",
            courierName: "Pathao Courier",
            consignmentId,
            courierConsignmentId: consignmentId,
            courierTrackingId: consignmentId,
            courierResponse: JSON.stringify(booking.raw),
            trackingLink
          }
        });

        successCount++;
        results.push({
          orderId: id,
          orderNumber: order.orderNumber,
          success: true,
          consignmentId
        });
      } catch (itemErr: any) {
        failedCount++;
        results.push({
          orderId: id,
          orderNumber: order.orderNumber,
          success: false,
          error: itemErr.message || "Pathao booking failed"
        });
      }
    }

    try {
      const io = (req.app as any)?.get("io");
      if (io && successCount > 0) {
        io.emit("content_updated", { type: "orders", action: "bulk-shipped", count: successCount });
        io.emit("data_sync", { type: "orders" });
      }
    } catch (_) {}

    res.json({
      success: true,
      successCount,
      failedCount,
      totalProcessed: orderIds.length,
      results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Bulk Pathao dispatch failed" });
  }
});

export default router;

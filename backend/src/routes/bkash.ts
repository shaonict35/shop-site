import { Router, Request, Response } from "express";
import db from "../firebase";
import prisma from "../prisma";
import bkashService from "../services/bkashService";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { sendOrderReceiptEmail } from "../mailer";

const router = Router();

// ─── GET /api/payments/bkash/config or /api/bkash/config ───
router.get(["/config", "/bkash/config"], async (req: Request, res: Response) => {
  try {
    const config = await bkashService.getConfig();
    res.json({
      success: true,
      mode: config.mode,
      isSandbox: config.mode === "sandbox",
      isLive: config.mode === "live",
      isManual: config.mode === "manual",
      merchantNumber: config.merchantNumber,
      currency: "BDT"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load bKash config" });
  }
});

// ─── POST /api/payments/bkash/test (Test connection & token generation) ───
router.post(["/test", "/bkash/test", "/admin/payments/bkash/test"], authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await bkashService.getConfig();
    if (config.mode === "manual") {
      return res.json({
        success: true,
        message: `bKash is currently configured in Manual Mode (Merchant Number: ${config.merchantNumber || "Not configured"}).`,
        mode: "manual"
      });
    }
    const tokenData = await bkashService.getValidIdToken();
    res.json({
      success: true,
      message: `⚡ bKash Tokenized Checkout API Connected Successfully in ${config.mode.toUpperCase()} mode!`,
      mode: config.mode,
      baseUrl: config.baseUrl,
      tokenPreview: tokenData.idToken.slice(0, 10) + "..."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to authenticate with bKash API" });
  }
});

// ─── POST /api/payments/bkash/create or /api/bkash/create ───
router.post(["/create", "/bkash/create", "/create-payment"], async (req: Request, res: Response) => {
  try {
    const { amount, orderId, customerPhone, customerName } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid order amount is required for bKash payment" });
    }
    if (!orderId) {
      return res.status(400).json({ error: "Order ID (invoice number) is required" });
    }

    const config = await bkashService.getConfig();

    // If Manual mode, return instructions immediately
    if (config.mode === "manual") {
      return res.json({
        success: true,
        mode: "manual",
        merchantNumber: config.merchantNumber,
        amount,
        orderId,
        message: `Please send BDT ${amount} to bKash Merchant Number ${config.merchantNumber} and provide your TrxID.`
      });
    }

    const frontendBase = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const backendBase = `http://localhost:${process.env.PORT || 5000}`;
    const callbackUrl = `${backendBase}/api/payments/bkash/callback`;

    const payment = await bkashService.createPayment({
      amount,
      orderId,
      payerReference: customerPhone || "Customer",
      callbackUrl
    });

    res.json({
      success: true,
      mode: config.mode,
      paymentID: payment.paymentID,
      bkashURL: payment.bkashURL,
      merchantNumber: config.merchantNumber,
      amount
    });
  } catch (err: any) {
    console.error("[bKash Create Error]:", err);
    res.status(500).json({ error: err.message || "Failed to initiate bKash payment" });
  }
});

// ─── GET /api/payments/bkash/callback or /api/bkash/callback ───
router.get(["/callback", "/bkash/callback"], async (req: Request, res: Response) => {
  try {
    const paymentID = String(req.query.paymentID || "");
    const status = String(req.query.status || "");
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

    if (status === "cancel" || status === "failure") {
      return res.redirect(`${frontendUrl}/checkout?payment=failed&status=${status}`);
    }

    if (status === "success" && paymentID) {
      const executeResult = await bkashService.executePayment(paymentID);

      const isCompleted = executeResult.transactionStatus === "Completed" || executeResult.statusCode === "0000";
      const trxID = executeResult.trxID || `TRX${Date.now()}`;
      const orderNumber = executeResult.merchantInvoiceNumber || "";

      if (isCompleted && orderNumber) {
        // Update Prisma Order
        const updatedOrders = await prisma.order.findMany({
          where: {
            OR: [
              { orderNumber: orderNumber },
              { id: orderNumber }
            ]
          },
          include: { orderItems: true }
        });

        if (updatedOrders.length > 0) {
          const targetOrder = updatedOrders[0];
          await prisma.order.update({
            where: { id: targetOrder.id },
            data: {
              paymentStatus: "PAID",
              paymentMethod: "bKash Tokenized",
              transactionId: trxID,
              trxId: trxID,
              paymentId: paymentID
            }
          });

          // Trigger automated Order Receipt Email
          try {
            await sendOrderReceiptEmail(targetOrder);
          } catch (mailErr) {
            console.error("Failed to send order confirmation email on bKash callback:", mailErr);
          }

          // Trigger realtime updates
          try {
            const io = (req.app as any)?.get("io");
            if (io) {
              io.emit("content_updated", { type: "orders", action: "paid", id: targetOrder.id });
              io.emit("data_sync", { type: "orders" });
            }
          } catch (_) {}

          return res.redirect(`${frontendUrl}/thank-you?orderNumber=${encodeURIComponent(targetOrder.orderNumber)}&total=${targetOrder.total}&paymentMethod=bKash&status=success&trxId=${encodeURIComponent(trxID)}`);
        }
      }

      return res.redirect(`${frontendUrl}/thank-you?orderNumber=${encodeURIComponent(orderNumber)}&paymentMethod=bKash&status=success&trxId=${encodeURIComponent(trxID)}`);
    }

    res.redirect(`${frontendUrl}/checkout?payment=failed`);
  } catch (err: any) {
    console.error("[bKash Callback Error]:", err);
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    res.redirect(`${frontendUrl}/checkout?payment=error&message=${encodeURIComponent(err.message || "Payment execution failed")}`);
  }
});

// ─── GET /api/admin/payments/bkash/query/:paymentID (Admin only) ───
router.get("/admin/payments/bkash/query/:paymentID", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paymentID = String(req.params.paymentID || "");
    if (!paymentID) return res.status(400).json({ error: "paymentID is required" });

    const result = await bkashService.queryPayment(paymentID);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to query bKash payment" });
  }
});

// ─── POST /api/admin/payments/bkash/refund (Admin only) ───
router.post("/admin/payments/bkash/refund", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentID, amount, trxID, sku, reason, orderId } = req.body;
    if (!paymentID || !amount || !trxID) {
      return res.status(400).json({ error: "paymentID, amount, and trxID are required to process refund." });
    }

    const refundRes = await bkashService.refundPayment({
      paymentID,
      amount,
      trxID,
      sku: sku || "REFUND",
      reason: reason || "Admin initiated refund"
    });

    if (orderId) {
      await prisma.order.updateMany({
        where: {
          OR: [{ id: orderId }, { orderNumber: orderId }]
        },
        data: {
          paymentStatus: "Refunded",
          notes: `Refunded BDT ${amount} on bKash TrxID: ${refundRes.refundTrxID || trxID}`
        }
      });
    }

    res.json({ success: true, message: "bKash Refund processed successfully", data: refundRes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process bKash refund" });
  }
});

export default router;

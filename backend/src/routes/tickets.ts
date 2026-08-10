import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Get support tickets
router.get("/admin/tickets", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("support_tickets").get();
    const tickets: any[] = [];
    snapshot.forEach(doc => {
      tickets.push({ id: doc.id, ...doc.data() });
    });

    if (tickets.length === 0) {
      const mockTickets = [
        {
          id: "TICK-701",
          customerName: "Sharmin Sultana",
          customerPhone: "01788990011",
          subject: "Damaged Package Received",
          category: "Damage Claim",
          orderNumber: "GG-8842",
          priority: "High",
          status: "Open",
          message: "The toner bottle leak inside the courier parcel. Need replacement.",
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        {
          id: "TICK-702",
          customerName: "Mahmud Hasan",
          customerPhone: "01911223344",
          subject: "Shade exchange request",
          category: "Return / Exchange",
          orderNumber: "GG-8810",
          priority: "Medium",
          status: "In Progress",
          message: "Ordered shade 21N, want to exchange with 23N.",
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        }
      ];
      return res.json(mockTickets);
    }

    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket status
router.patch("/admin/tickets/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, adminNotes } = req.body;
    const docRef = db.collection("support_tickets").doc(req.params.id);
    await docRef.set({ status, adminNotes: adminNotes || "", updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ message: "Ticket status updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

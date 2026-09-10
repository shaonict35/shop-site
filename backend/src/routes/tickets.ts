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

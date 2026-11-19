import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Get audit logs
router.get("/admin/audit-logs", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("audit_logs").get();
    const logs: any[] = [];
    snapshot.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record new audit entry
router.post("/admin/audit-logs", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, details } = req.body;
    if (!action) {
      return res.status(400).json({ error: "Action description required" });
    }
    const docRef = db.collection("audit_logs").doc();
    const logEntry = {
      userName: (req.user as any)?.name || (req.user as any)?.email || "Admin",
      userRole: req.user?.role || "Admin",

      action,
      details: details || "",
      ipAddress: req.ip || "127.0.0.1",
      timestamp: new Date().toISOString(),
    };
    await docRef.set(logEntry);
    res.status(201).json({ id: docRef.id, ...logEntry });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

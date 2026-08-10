import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Send message (Customer)
router.post("/chat/send", async (req: Request, res: Response) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
       res.status(400).json({ error: "chatId and message are required" });
       return;
    }

    const docRef = db.collection("chatMessages").doc();
    const newMessage = {
      chatId,
      sender: "Customer",
      message,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(newMessage);

    res.status(201).json({ id: docRef.id, ...newMessage });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history for customer
router.get("/chat/history/:chatId", async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const snapshot = await db.collection("chatMessages")
      .where("chatId", "==", chatId)
      .get();
      
    const history: any[] = [];
    snapshot.forEach(doc => {
      history.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort in memory by createdAt ascending
    history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique chat threads (Admin only)
router.get("/chat/admin/threads", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("chatMessages").get();
    const messages: any[] = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    // Sort in memory descending to get latest messages first
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Group by chatId and keep the last message
    const threadsMap = new Map();
    for (const msg of messages) {
      if (!threadsMap.has(msg.chatId)) {
        threadsMap.set(msg.chatId, {
          chatId: msg.chatId,
          lastMessage: msg.message,
          lastSender: msg.sender,
          updatedAt: msg.createdAt
        });
      }
    }

    res.json(Array.from(threadsMap.values()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin reply to thread
router.post("/chat/admin/reply", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
       res.status(400).json({ error: "chatId and message are required" });
       return;
    }

    const docRef = db.collection("chatMessages").doc();
    const reply = {
      chatId,
      sender: "Admin",
      message,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(reply);

    res.status(201).json({ id: docRef.id, ...reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Send message (Customer)
router.post("/chat/send", async (req: Request, res: Response) => {
  try {
    const { chatId, message, customerName } = req.body;
    if (!chatId || !message) {
       res.status(400).json({ error: "chatId and message are required" });
       return;
    }

    const trimmedName = customerName ? String(customerName).trim() : "";
    const docRef = db.collection("chatMessages").doc();
    const newMessage = {
      chatId,
      customerName: trimmedName,
      sender: "Customer",
      message,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(newMessage);

    // If customerName provided, also persist/merge in chatSessions
    if (trimmedName) {
      try {
        await db.collection("chatSessions").doc(chatId).set({
          chatId,
          customerName: trimmedName,
          lastMessage: message,
          lastSender: "Customer",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to update chatSessions in chat/send", err);
      }
    }

    res.status(201).json({ id: docRef.id, ...newMessage });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register / Update customer name for chat session
router.post("/chat/register-customer", async (req: Request, res: Response) => {
  try {
    const { chatId, customerName } = req.body;
    if (!chatId || !customerName) {
      res.status(400).json({ error: "chatId and customerName are required" });
      return;
    }

    const trimmedName = String(customerName).trim();
    if (!trimmedName) {
      res.status(400).json({ error: "customerName cannot be empty" });
      return;
    }

    // Persist in chatSessions
    await db.collection("chatSessions").doc(chatId).set({
      chatId,
      customerName: trimmedName,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Update existing customer messages with this name
    try {
      const snapshot = await db.collection("chatMessages").where("chatId", "==", chatId).get();
      snapshot.forEach(async (doc: any) => {
        const data = doc.data();
        if (data.sender === "Customer" && !data.customerName) {
          await db.collection("chatMessages").doc(doc.id).set({ customerName: trimmedName }, { merge: true });
        }
      });
    } catch (e) {}

    res.json({ success: true, chatId, customerName: trimmedName });
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

    // Also get all registered customer names from chatSessions
    const sessionsMap = new Map<string, string>();
    try {
      const sessionsSnapshot = await db.collection("chatSessions").get();
      sessionsSnapshot.forEach(doc => {
        const sData = doc.data();
        if (sData && sData.customerName) {
          sessionsMap.set(doc.id, sData.customerName);
        }
      });
    } catch (e) {}

    // Sort in memory descending to get latest messages first
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Group by chatId and keep the last message
    const threadsMap = new Map();
    for (const msg of messages) {
      const sessionName = sessionsMap.get(msg.chatId) || "";
      const customerName = sessionName || msg.customerName || "";

      if (!threadsMap.has(msg.chatId)) {
        threadsMap.set(msg.chatId, {
          chatId: msg.chatId,
          customerName: customerName,
          lastMessage: msg.message,
          lastSender: msg.sender,
          updatedAt: msg.createdAt
        });
      } else {
        const thread = threadsMap.get(msg.chatId);
        if (!thread.customerName && (sessionName || msg.customerName)) {
          thread.customerName = sessionName || msg.customerName;
        }
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

    // Update last message in chatSessions
    try {
      await db.collection("chatSessions").doc(chatId).set({
        lastMessage: message,
        lastSender: "Admin",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {}

    res.status(201).json({ id: docRef.id, ...reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

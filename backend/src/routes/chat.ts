import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import fs from "fs";
import path from "path";

const router = Router();

// Local fallback persistence for chat messages so they never disappear
const CHAT_BACKUP_FILE = path.join(__dirname, "../../chat_messages_backup.json");

function getLocalBackupMessages(): any[] {
  try {
    if (fs.existsSync(CHAT_BACKUP_FILE)) {
      const data = fs.readFileSync(CHAT_BACKUP_FILE, "utf-8");
      return JSON.parse(data) || [];
    }
  } catch (e) {}
  return [];
}

function saveLocalBackupMessage(msg: any) {
  try {
    const list = getLocalBackupMessages();
    list.push(msg);
    // Keep last 5000 messages
    const trimmed = list.slice(-5000);
    fs.writeFileSync(CHAT_BACKUP_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (e) {}
}

// Helper to extract customer name from greeting message if not explicitly sent
function extractCustomerNameFromText(text?: string): string | null {
  if (!text) return null;
  const match = text.match(/হ্যালো\s+([^!🌸\n]+)[!🌸]/i) || text.match(/Hello\s+([^!🌸\n]+)[!🌸]/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (candidate && candidate.length < 40 && !candidate.toLowerCase().includes("customer")) {
      return candidate;
    }
  }
  return null;
}

// Send message (Customer or System/Bot)
router.post("/chat/send", async (req: Request, res: Response) => {
  try {
    const { chatId, message, customerName, customerPhone, sender } = req.body;
    if (!chatId || !message) {
       res.status(400).json({ error: "chatId and message are required" });
       return;
    }

    const docRef = db.collection("chatMessages").doc();
    const msgSender = sender || "Customer";
    
    // Auto-detect customer name if sent in welcome message
    const resolvedName = customerName || extractCustomerNameFromText(message) || null;

    const newMessage = {
      id: docRef.id,
      chatId,
      sender: msgSender,
      message,
      customerName: resolvedName,
      customerPhone: customerPhone || null,
      createdAt: new Date().toISOString(),
    };

    try {
      await docRef.set(newMessage);
    } catch (dbErr) {
      console.warn("Firestore chat save warning:", dbErr);
    }

    // Always persist to local backup as well
    saveLocalBackupMessage(newMessage);

    // Socket.io real-time broadcast to Admin Panel & connected visitors
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("chat:new_message", newMessage);
        io.emit("new_chat_message", newMessage);
        io.emit("chat:threads_updated", {
          chatId,
          lastMessage: message,
          lastSender: msgSender,
          customerName: resolvedName,
          customerPhone: customerPhone || null,
          updatedAt: newMessage.createdAt,
        });
      }
    } catch (sErr) {}

    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history for customer
router.get("/chat/history/:chatId", async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const historyMap = new Map<string, any>();

    try {
      const snapshot = await db.collection("chatMessages")
        .where("chatId", "==", chatId)
        .get();
        
      snapshot.forEach(doc => {
        historyMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    } catch (dbErr) {
      console.warn("Firestore history warning:", dbErr);
    }

    // Merge with local backup
    const backup = getLocalBackupMessages().filter((m: any) => m.chatId === chatId);
    backup.forEach((b: any) => {
      const key = b.id || (b.chatId + "_" + b.createdAt);
      if (!historyMap.has(key)) {
        historyMap.set(key, b);
      }
    });
    
    const history = Array.from(historyMap.values());
    // Sort in memory by createdAt ascending
    history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique chat threads (Admin only)
router.get("/chat/admin/threads", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager", "Staff", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messagesMap = new Map<string, any>();

    try {
      const snapshot = await db.collection("chatMessages").get();
      snapshot.forEach(doc => {
        messagesMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    } catch (dbErr) {
      console.warn("Firestore admin threads warning:", dbErr);
    }

    // Merge backup messages
    const backup = getLocalBackupMessages();
    backup.forEach((b: any) => {
      const key = b.id || (b.chatId + "_" + b.createdAt);
      if (!messagesMap.has(key)) {
        messagesMap.set(key, b);
      }
    });

    const messages = Array.from(messagesMap.values());

    // Sort in memory descending to get latest messages first
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // First pass: extract any known customerName or phone per chatId across ANY message
    const customerInfoByChatId = new Map<string, { name: string | null; phone: string | null }>();
    for (const msg of messages) {
      const current = customerInfoByChatId.get(msg.chatId) || { name: null, phone: null };
      if (!current.name) {
        if (msg.customerName) {
          current.name = msg.customerName;
        } else {
          const fromText = extractCustomerNameFromText(msg.message);
          if (fromText) current.name = fromText;
        }
      }
      if (!current.phone && msg.customerPhone) {
        current.phone = msg.customerPhone;
      }
      customerInfoByChatId.set(msg.chatId, current);
    }

    // Group by chatId and keep the last message and resolved customer info
    const threadsMap = new Map();
    for (const msg of messages) {
      if (!threadsMap.has(msg.chatId)) {
        const info = customerInfoByChatId.get(msg.chatId);
        const resolvedName = info?.name || msg.customerName || extractCustomerNameFromText(msg.message) || null;
        const resolvedPhone = info?.phone || msg.customerPhone || null;
        const shortId = msg.chatId.replace(/^chat_/, "").slice(-5).toUpperCase();
        const displayName = resolvedName 
          ? resolvedName 
          : (resolvedPhone ? `Customer (${resolvedPhone})` : `Customer #${shortId}`);

        threadsMap.set(msg.chatId, {
          chatId: msg.chatId,
          displayName,
          customerName: resolvedName,
          customerPhone: resolvedPhone,
          lastMessage: msg.message,
          lastSender: msg.sender,
          updatedAt: msg.createdAt
        });
      }
    }

    // Return threads sorted strictly by updatedAt descending (latest on top)
    const threadList = Array.from(threadsMap.values());
    threadList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json(threadList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin reply to thread
router.post("/chat/admin/reply", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager", "Staff", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
       res.status(400).json({ error: "chatId and message are required" });
       return;
    }

    const docRef = db.collection("chatMessages").doc();
    const reply = {
      id: docRef.id,
      chatId,
      sender: "Admin",
      message,
      createdAt: new Date().toISOString(),
    };

    try {
      await docRef.set(reply);
    } catch (dbErr) {
      console.warn("Firestore reply save warning:", dbErr);
    }

    saveLocalBackupMessage(reply);

    // Socket.io real-time broadcast to Customer Chat Widget
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("chat:new_message", reply);
        io.emit("admin_reply", reply);
        io.emit("new_chat_message", reply);
        io.emit("chat:threads_updated", { chatId, lastMessage: message, lastSender: "Admin", updatedAt: reply.createdAt });
      }
    } catch (sErr) {}

    res.status(201).json(reply);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

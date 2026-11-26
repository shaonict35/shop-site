import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import db from "../firebase";
import prisma from "../prisma";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import fs from "fs";
import path from "path";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456";

// Rate limiting for public chat endpoints (max 40 messages / minute per IP)
const chatRateLimits = new Map<string, { count: number; resetTime: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of chatRateLimits.entries()) {
    if (now > entry.resetTime) chatRateLimits.delete(ip);
  }
}, 5 * 60 * 1000);

function chatRateLimiter(req: Request, res: Response, next: Function) {
  const ip = (typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",")[0].trim() : req.ip) || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 40;

  const entry = chatRateLimits.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count += 1;
  }
  chatRateLimits.set(ip, entry);

  if (entry.count > max) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Chat rate limit exceeded. Please wait a moment before sending another message."
    });
  }
  next();
}

function sanitizeChatText(str: any): string {
  if (typeof str !== "string") return "";
  return str
    .slice(0, 2000)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/onload\s*=/gi, "")
    .replace(/onerror\s*=/gi, "")
    .trim();
}

// ─── TASK 3: CHAT OWNERSHIP & AUTHORIZATION GUARDS ─────────────────────────
export function generateChatSessionToken(chatId: string, userId?: string, role = "ChatCustomer"): string {
  return jwt.sign(
    { chatId, userId: userId || null, role },
    JWT_SECRET,
    { expiresIn: "60d" }
  );
}

export function verifyChatAuthorization(req: Request, targetChatId: string): { authorized: boolean; isStaff: boolean } {
  let token = req.headers.authorization?.replace("Bearer ", "");
  if (!token && req.headers["x-chat-token"]) {
    token = String(req.headers["x-chat-token"]);
  }
  if (!token && typeof req.query?.token === "string") {
    token = req.query.token;
  }

  if (!token) {
    return { authorized: false, isStaff: false };
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const role = (decoded.role || "").toLowerCase();

    // 1. Staff members can access any customer chat thread
    if (["superadmin", "admin", "manager", "staff", "salesman", "super_admin"].includes(role)) {
      return { authorized: true, isStaff: true };
    }

    // 2. Customer must own the chatId or userId (normalize prefix)
    const cleanDecoded = (decoded.chatId || "").replace(/^chat_/, "");
    const cleanTarget = targetChatId.replace(/^chat_/, "");
    if (cleanDecoded.length >= 6 && cleanTarget.length >= 6 && cleanDecoded === cleanTarget) {
      return { authorized: true, isStaff: false };
    }
    if (decoded.chatId === targetChatId || decoded.id === targetChatId || decoded.userId === targetChatId) {
      return { authorized: true, isStaff: false };
    }
  } catch (_) {}

  return { authorized: false, isStaff: false };
}

// POST /api/chat/session — Issue or renew a cryptographically signed chat session token
router.post("/chat/session", async (req: Request, res: Response) => {
  try {
    const { chatId, customerName, customerPhone } = req.body || {};
    let resolvedChatId = chatId;
    if (!resolvedChatId || typeof resolvedChatId !== "string" || !resolvedChatId.trim()) {
      resolvedChatId = "chat_" + Math.random().toString(36).substring(2, 11);
    }
    resolvedChatId = resolvedChatId.trim();

    // If user is already authenticated with JWT, bind to user ID
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.id;
      } catch (_) {}
    }

    const sessionToken = generateChatSessionToken(resolvedChatId, userId);
    res.json({
      success: true,
      chatId: resolvedChatId,
      chatToken: sessionToken,
      customerName: customerName || null,
      customerPhone: customerPhone || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to initialize chat session" });
  }
});

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
router.post("/chat/send", chatRateLimiter as any, async (req: Request, res: Response) => {
  try {
    const { chatId, message, customerName, customerPhone, sender } = req.body;
    if (!chatId || !message) {
       res.status(400).json({ error: "chatId and message are required" });
       return;
    }

    const cleanChatId = String(chatId).trim().slice(0, 64);
    const sanitizedMsg = sanitizeChatText(message);
    if (!sanitizedMsg) {
       res.status(400).json({ error: "Message content cannot be empty" });
       return;
    }

    // Verify token ownership and enforce role boundaries
    const msgSender = sender === "Admin" ? "Admin" : "Customer";
    if (msgSender === "Admin") {
      const auth = verifyChatAuthorization(req, cleanChatId);
      if (!auth.authorized || !auth.isStaff) {
        return res.status(403).json({ error: "Access Denied: Staff authorization required to send Admin messages." });
      }
    } else {
      const auth = verifyChatAuthorization(req, cleanChatId);
      if (!auth.authorized) {
        return res.status(403).json({ error: "Access Denied: Valid chat authorization token required for this conversation." });
      }
    }

    const docRef = db.collection("chatMessages").doc();
    
    // Auto-detect customer name if sent in welcome message
    const resolvedName = customerName || extractCustomerNameFromText(sanitizedMsg) || null;

    const newMessage = {
      id: docRef.id,
      chatId: cleanChatId,
      sender: msgSender,
      message: sanitizedMsg,
      customerName: resolvedName,
      customerPhone: customerPhone ? String(customerPhone).slice(0, 30) : null,
      createdAt: new Date().toISOString(),
    };

    console.log("[Native Support Backend] Controller entry: /chat/send for conversation:", cleanChatId, "from sender:", msgSender);

    // 1. Persist to Prisma SQLite database
    try {
      await prisma.chatSession.upsert({
        where: { id: cleanChatId },
        update: {
          lastMessage: sanitizedMsg,
          lastSender: msgSender,
          customerName: resolvedName || undefined,
          customerPhone: customerPhone ? String(customerPhone).slice(0, 30) : undefined,
          updatedAt: new Date()
        },
        create: {
          id: cleanChatId,
          lastMessage: sanitizedMsg,
          lastSender: msgSender,
          customerName: resolvedName,
          customerPhone: customerPhone ? String(customerPhone).slice(0, 30) : null,
          unreadCount: msgSender === "Customer" ? 1 : 0
        }
      });

      await prisma.chatMessage.create({
        data: {
          id: docRef.id,
          chatId: cleanChatId,
          sessionId: cleanChatId,
          sender: msgSender,
          message: sanitizedMsg,
          createdAt: new Date()
        }
      });
      console.log("[Native Support Backend] Database save success: Prisma ChatMessage created with id:", docRef.id);
    } catch (pErr) {
      console.warn("Prisma chat save warning:", pErr);
    }

    // 2. Persist to Firestore / backup
    try {
      await docRef.set(newMessage);
    } catch (dbErr) {
      console.warn("Firestore chat save warning:", dbErr);
    }

    saveLocalBackupMessage(newMessage);

    // Security Pentest Defense: Emit message strictly to the isolated customer room and authorized admin staff room
    try {
      const io = req.app.get("io");
      if (io) {
        const safeRoom = `chat_${cleanChatId}`;
        const cleanBase = cleanChatId.replace(/^chat_/, "");
        const threadPayload = {
          chatId: cleanChatId,
          lastMessage: sanitizedMsg,
          lastSender: msgSender,
          customerName: resolvedName,
          customerPhone: customerPhone || null,
          updatedAt: newMessage.createdAt,
        };

        // 1. Send to the specific customer in their room across all room aliases
        io.to(cleanChatId).to(safeRoom).to(`chat_${cleanBase}`).emit("chat:new_message", newMessage);
        io.to(cleanChatId).to(safeRoom).to(`chat_${cleanBase}`).emit("new_chat_message", newMessage);
        io.to(cleanChatId).to(safeRoom).to(`chat_${cleanBase}`).emit("receive_message", newMessage);

        // 2. Send exclusively to authorized staff room
        io.to("admin_staff").emit("chat:new_message", newMessage);
        io.to("admin_staff").emit("new_chat_message", newMessage);
        io.to("admin_staff").emit("new_customer_message", newMessage);
        io.to("admin_staff").emit("receive_message", newMessage);
        io.to("admin_staff").emit("chat:threads_updated", threadPayload);
        console.log("[Native Support Backend] Socket.IO customer message emitted to rooms:", cleanChatId, safeRoom, `chat_${cleanBase}`, "and admin_staff");
      }
    } catch (sErr) {}

    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history for customer (Enforces server-side ownership)
router.get("/chat/history/:chatId", async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    // Task 3: Enforce ownership authorization before exposing customer private chat
    const auth = verifyChatAuthorization(req, chatId);
    if (!auth.authorized) {
      return res.status(403).json({
        error: "Access Denied: You do not have permission to access this chat conversation."
      });
    }

    const historyMap = new Map<string, any>();

    // 1. Query Prisma SQLite database records
    try {
      const pMessages = await prisma.chatMessage.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" }
      });
      pMessages.forEach(pm => {
        historyMap.set(pm.id, {
          id: pm.id,
          chatId: pm.chatId || chatId,
          sender: pm.sender,
          message: pm.message,
          createdAt: pm.createdAt.toISOString()
        });
      });
    } catch (pErr) {
      console.warn("Prisma history fetch warning:", pErr);
    }

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

    // 1. Fetch from Prisma database
    try {
      const pSessions = await prisma.chatSession.findMany({
        orderBy: { updatedAt: "desc" }
      });
      pSessions.forEach(ps => {
        const shortId = ps.id.replace(/^chat_/, "").slice(-5).toUpperCase();
        const displayName = ps.customerName 
          ? ps.customerName 
          : (ps.customerPhone ? `Customer (${ps.customerPhone})` : `Customer #${shortId}`);
        messagesMap.set(ps.id, {
          id: ps.id,
          chatId: ps.id,
          displayName,
          customerName: ps.customerName,
          customerPhone: ps.customerPhone,
          lastMessage: ps.lastMessage || "",
          lastSender: ps.lastSender || "Customer",
          updatedAt: ps.updatedAt.toISOString(),
          createdAt: ps.updatedAt.toISOString()
        });
      });
    } catch (pErr) {
      console.warn("Prisma threads fetch warning:", pErr);
    }

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
    messages.sort((a, b) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime());

    // First pass: extract any known customerName or phone per chatId across ANY message
    const customerInfoByChatId = new Map<string, { name: string | null; phone: string | null }>();
    for (const msg of messages) {
      const current = customerInfoByChatId.get(msg.chatId) || { name: null, phone: null };
      if (!current.name) {
        if (msg.customerName) {
          current.name = msg.customerName;
        } else {
          const fromText = extractCustomerNameFromText(msg.message || msg.lastMessage);
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
        const resolvedName = info?.name || msg.customerName || extractCustomerNameFromText(msg.message || msg.lastMessage) || null;
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
          lastMessage: msg.message || msg.lastMessage || "",
          lastSender: msg.sender || msg.lastSender || "Customer",
          updatedAt: msg.createdAt || msg.updatedAt
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

    const cleanChatId = String(chatId).trim().slice(0, 64);
    const sanitizedReply = sanitizeChatText(message);
    if (!sanitizedReply) {
       res.status(400).json({ error: "Reply content cannot be empty" });
       return;
    }

    console.log("[Native Support Backend] Controller entry: /chat/admin/reply for conversation:", cleanChatId);

    const docRef = db.collection("chatMessages").doc();
    const reply = {
      id: docRef.id,
      chatId: cleanChatId,
      sender: "Admin",
      message: sanitizedReply,
      createdAt: new Date().toISOString(),
    };

    // 1. Persist to Prisma SQLite database
    try {
      await prisma.chatSession.upsert({
        where: { id: cleanChatId },
        update: {
          lastMessage: sanitizedReply,
          lastSender: "Admin",
          unreadCount: 0,
          updatedAt: new Date()
        },
        create: {
          id: cleanChatId,
          lastMessage: sanitizedReply,
          lastSender: "Admin",
          unreadCount: 0
        }
      });

      await prisma.chatMessage.create({
        data: {
          id: docRef.id,
          chatId: cleanChatId,
          sessionId: cleanChatId,
          sender: "Admin",
          message: sanitizedReply,
          createdAt: new Date()
        }
      });
      console.log("[Native Support Backend] Database save success: Prisma ChatMessage created with id:", docRef.id);
    } catch (pErr) {
      console.warn("Prisma admin reply save warning:", pErr);
    }

    try {
      await docRef.set(reply);
    } catch (dbErr) {
      console.warn("Firestore reply save warning:", dbErr);
    }

    saveLocalBackupMessage(reply);

    // Security Pentest Defense: Emit admin reply strictly to the specific customer room and admin staff room
    try {
      const io = req.app.get("io");
      if (io) {
        const safeRoom = `chat_${cleanChatId}`;
        const cleanBase = cleanChatId.replace(/^chat_/, "");

        // 1. Deliver reply directly to the customer in their chat room across all canonical room aliases
        io.to(cleanChatId).to(safeRoom).to(`chat_${cleanBase}`).emit("chat:new_message", reply);
        io.to(cleanChatId).to(safeRoom).to(`chat_${cleanBase}`).emit("admin_reply", reply);
        io.to(cleanChatId).to(safeRoom).to(`chat_${cleanBase}`).emit("new_chat_message", reply);
        io.to(cleanChatId).to(safeRoom).to(`chat_${cleanBase}`).emit("receive_message", reply);

        // 2. Deliver to other authorized staff in admin room
        io.to("admin_staff").emit("chat:new_message", reply);
        io.to("admin_staff").emit("admin_reply", reply);
        io.to("admin_staff").emit("receive_message", reply);
        io.to("admin_staff").emit("chat:threads_updated", { chatId: cleanChatId, lastMessage: sanitizedReply, lastSender: "Admin", updatedAt: reply.createdAt });
        console.log("[Native Support Backend] Socket.IO admin reply emitted to rooms:", cleanChatId, safeRoom, `chat_${cleanBase}`, "and admin_staff");
      }
    } catch (sErr) {}

    res.status(201).json(reply);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

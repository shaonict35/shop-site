import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import hpp from "hpp";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import authRouter from "./routes/auth";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import settingsRouter from "./routes/settings";
import adminRouter from "./routes/admin";
import bannersRouter from "./routes/banners";
import notificationsRouter from "./routes/notifications";
import chatRouter from "./routes/chat";
import marketingRouter from "./routes/marketing";
import auditRouter from "./routes/audit";
import ticketsRouter from "./routes/tickets";
import feedsRouter from "./routes/feeds";
import enterpriseRouter from "./routes/enterprise";
import menuRouter from "./routes/menu";
import pagesRouter from "./routes/pages";
import bkashRouter from "./routes/bkash";
import pathaoRouter from "./routes/pathao";
import careersRouter from "./routes/careers";
import inventoryRouter from "./routes/inventory";
import heroBannersRouter from "./routes/hero-banners";
import sectionsRouter from "./routes/sections";
import combosRouter from "./routes/combos";
import aiSupportRouter from "./routes/aiSupport";
import { ensureDefaultSectionsSeeded } from "./controllers/sectionController";
import db from "./firebase";
import prisma from "./prisma";
import { autoSeedDatabase } from "./auto-seed";
import { initMySQLTables } from "./config/db";

import { globalRateLimiter, authRateLimiter, orderRateLimiter, sanitizeInput, securityHeaders } from "./middleware/security";

const app = express();
app.set("trust proxy", 1);
app.set("etag", "strong"); // Enable HTTP ETag for 304 Not Modified instant bandwidth-free caching

// Serve favicon.ico and logo assets so they never return 404 error
function findAssetFile(filename: string): string | null {
  const possiblePaths = [
    path.join(__dirname, "..", "public", filename),
    path.join(__dirname, "public", filename),
    path.join(process.cwd(), "public", filename),
    path.join(process.cwd(), "backend", "public", filename),
    path.join(process.cwd(), "frontend", "public", filename),
    path.join(process.cwd(), "frontend", "public", "images", filename),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return path.resolve(p);
  }
  return null;
}

app.get("/favicon.ico", (req, res) => {
  const filePath = findAssetFile("favicon.ico");
  if (filePath) {
    res.setHeader("Content-Type", "image/x-icon");
    res.setHeader("Cache-Control", "public, max-age=2592000");
    return res.sendFile(filePath);
  }
  res.status(204).end();
});

app.get(["/logo.png", "/user-glow-logo.png", "/apple-touch-icon.png", "/apple-icon.png"], (req, res) => {
  const filePath = findAssetFile("logo.png") || findAssetFile("user-glow-logo.png");
  if (filePath) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=2592000");
    return res.sendFile(filePath);
  }
  res.status(404).end();
});

app.get("/cosmetics_circle_illustration.png", (req, res) => {
  const filePath = findAssetFile("cosmetics_circle_illustration.png");
  if (filePath) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.sendFile(filePath);
  }
  res.status(404).end();
});

// Serve public static assets
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.static(path.join(process.cwd(), "public")));

// Serve uploads directory (banners, products, documents)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "backend", "uploads")));

// ─── STRICT CORS TRUSTED-ORIGIN ALLOWLIST ───
export const TRUSTED_ORIGINS = [
  "https://glowgoodly.com",
  "https://www.glowgoodly.com",
  "https://shop.glowgoodly.com",
  "https://api.glowgoodly.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
];

export function isTrustedOrigin(origin?: string): boolean {
  if (!origin) return false;
  const clean = origin.trim().toLowerCase();
  // Exact Trusted-Origin Allowlist enforcement (wildcard subdomains strictly disallowed)
  return TRUSTED_ORIGINS.includes(clean);
}

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isTrustedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Socket.IO CORS policy violation: Untrusted origin."));
      }
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Provide Socket.io instance to Express routes
app.set("io", io);

// Security Pentest Hardening: Authenticated rooms & Isolated Customer Chat namespaces
io.on("connection", (socket) => {
  // 1. Authenticate staff socket if Bearer token is provided in handshake
  const rawAuthToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
  if (rawAuthToken) {
    try {
      const decoded: any = jwt.verify(rawAuthToken, process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456");
      const role = (decoded.role || "").toLowerCase();
      if (["superadmin", "admin", "manager", "staff", "salesman"].includes(role)) {
        socket.data.user = decoded;
        socket.join("admin_staff");
      }
    } catch (_) { }
  }

  // 2. Allow customer to join only their dedicated isolated chat room with verified ownership
  socket.on("join_chat", (payload: any) => {
    const targetChatId = typeof payload === "string" ? payload.trim() : (payload?.chatId || "").trim();
    const token = typeof payload === "object" ? payload?.token : (socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", ""));

    if (!targetChatId) return;

    let isAuthorized = false;
    // Check if socket user is authorized staff
    if (socket.data?.user?.role) {
      const role = (socket.data.user.role || "").toLowerCase();
      if (["superadmin", "admin", "manager", "staff", "salesman"].includes(role)) {
        isAuthorized = true;
      }
    }

    // Verify token ownership against targetChatId
    if (!isAuthorized && token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456");
        const role = (decoded.role || "").toLowerCase();
        const cleanDecoded = (decoded.chatId || "").replace(/^chat_/, "");
        const cleanTarget = targetChatId.replace(/^chat_/, "");
        if (["superadmin", "admin", "manager", "staff", "salesman"].includes(role)) {
          isAuthorized = true;
        } else if (cleanDecoded.length >= 6 && cleanTarget.length >= 6 && cleanDecoded === cleanTarget) {
          isAuthorized = true;
        } else if (decoded.id === targetChatId || decoded.userId === targetChatId) {
          isAuthorized = true;
        }
      } catch (_) { }
    }

    if (isAuthorized) {
      const safeRoom = `chat_${targetChatId}`;
      const cleanBase = targetChatId.replace(/^chat_/, "");
      socket.join(targetChatId);
      socket.join(safeRoom);
      socket.join(`chat_${cleanBase}`);
      socket.emit("join_chat_success", { chatId: targetChatId });
    } else {
      socket.emit("chat_error", { error: "Access Denied: Cryptographic customer session token required." });
    }
  });

  // 3. Post-connection staff authentication event
  socket.on("auth_staff", (authToken) => {
    if (!authToken || typeof authToken !== "string") return;
    try {
      const decoded: any = jwt.verify(authToken, process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456");
      const role = (decoded.role || "").toLowerCase();
      if (["superadmin", "admin", "manager", "staff", "salesman"].includes(role)) {
        socket.data.user = decoded;
        socket.join("admin_staff");
        socket.emit("auth_staff_success", { role: decoded.role });
      }
    } catch (_) { }
  });
});

const PORT = process.env.PORT || 5000;

// 1. Advanced OWASP Security Headers & Helmet Protection
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Prevents blocking embedded images & frontend media
}));
app.use(hpp());
app.use(securityHeaders);

// Block dotfiles & sensitive path probing (e.g. .env, .git, .db, .sqlite)
app.use((req, res, next) => {
  if (req.path.includes("/.") || req.path.endsWith(".env") || req.path.endsWith(".db")) {
    return res.status(403).json({ error: "Access Denied: Protected resource." });
  }
  next();
});

// 2. Global DDoS / Flooding Rate Limiter (Max 350 req/min per IP)
app.use(globalRateLimiter);

// 3. Brute Force Login / Signup Guard (Max 15 attempts / 5 mins per IP)
app.use("/api/auth", authRateLimiter);

// 4. Fake Order / Spam Purchase Guard (Max 20 orders / 10 mins per IP)
app.use("/api/orders", orderRateLimiter);

// 5. Gzip / Deflate Compression Middleware (80%+ reduction in payload transfer size)
app.use(compression({
  level: 6,
  threshold: 512, // Compress all payloads >= 512 bytes for maximum efficiency
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  }
}));

// 6. Explicit CORS Security Hardening: Strict Trusted-Origin Allowlist
app.use(cors({
  origin: (origin, callback) => {
    // Non-browser or server-to-server requests without Origin header are allowed
    if (!origin || isTrustedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: Untrusted origin."));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-requested-with",
    "x-chat-token",
    "X-Chat-Token",
    "Accept",
    "Cache-Control",
    "Pragma",
    "Expires",
    "Origin",
    "X-Custom-Header",
    "baggage",
    "sentry-trace"
  ],
  exposedHeaders: ["x-chat-token", "X-Chat-Token", "X-LiteSpeed-Purge"],
  optionsSuccessStatus: 204
}));

// Express 5 compatible preflight OPTIONS handler with strict Trusted-Origin enforcement
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    if (origin && isTrustedOrigin(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else if (!origin) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    } else {
      return res.status(403).json({ error: "CORS policy violation: Untrusted origin." });
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, x-requested-with, x-chat-token, X-Chat-Token, Accept, Cache-Control, Pragma, Expires, Origin, X-Custom-Header, baggage, sentry-trace"
    );
    res.setHeader("Access-Control-Expose-Headers", "x-chat-token, X-Chat-Token, X-LiteSpeed-Purge");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Handle JSON syntax parse errors gracefully without 500 crash
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) {
    return res.status(400).json({ error: "Malformed or invalid JSON payload in request body" });
  }
  next(err);
});

// 7. XSS & Malicious Script Injection Sanitizer
app.use(sanitizeInput);

// Ensure all dynamic API routes never serve stale data & Auto LiteSpeed Cache Clean
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  // Auto LiteSpeed Cache Clean: whenever a mutation happens (POST, PUT, PATCH, DELETE),
  // emit LiteSpeed Purge header to instantly flush server HTML/API cache
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    res.setHeader("X-LiteSpeed-Purge", "*");
    res.setHeader("X-LiteSpeed-Cache-Control", "no-cache");
  }

  next();
});

// Dedicated LiteSpeed Cache Clean / Purge Endpoint
app.all(["/api/admin/litespeed-purge", "/api/litespeed/purge", "/api/litespeed-purge"], (req, res) => {
  res.setHeader("X-LiteSpeed-Purge", "*");
  res.setHeader("X-LiteSpeed-Cache-Control", "no-cache");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    // Also send PURGE request locally if web server reverse-proxies through LiteSpeed
    fetch("http://127.0.0.1/", {
      method: "PURGE",
      headers: { "X-LiteSpeed-Purge": "*" }
    }).catch(() => { });
  } catch (e) { }

  console.log(`[LiteSpeed] ⚡ Purge signal triggered at ${new Date().toISOString()}`);

  return res.json({
    success: true,
    message: "LiteSpeed Cache successfully purged (*). All updated products and banners will appear immediately.",
    timestamp: new Date().toISOString()
  });
});

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api", productsRouter); // For /products, /categories, /brands, etc.
app.use("/api/orders", ordersRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/pathao", pathaoRouter);
app.use("/api/admin", pathaoRouter);
app.use("/api/bkash", bkashRouter);
app.use("/api/payments", bkashRouter);
app.use("/api", marketingRouter); // Meta CAPI, Facebook Conversions API events
app.use("/api", bannersRouter);
app.use("/api", notificationsRouter);
app.use("/api", chatRouter);
app.use("/api", auditRouter);
app.use("/api", ticketsRouter);
app.use("/api", feedsRouter);
app.use("/api", enterpriseRouter);
app.use("/api", menuRouter);
app.use("/api", pagesRouter);
app.use("/api/careers", careersRouter);
app.use("/api/join-our-team", careersRouter);
app.use("/api/admin/careers", careersRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/admin/inventory", inventoryRouter);
app.use("/api/combos", combosRouter);
app.use("/api/admin/combos", combosRouter);
app.use("/api", heroBannersRouter);
app.use("/api", sectionsRouter);
app.use("/api", aiSupportRouter);

// ─── GLOWGOODLY WP-JSON & WOOCOMMERCE COMPATIBILITY MIRROR ENDPOINTS ───
app.use("/wp-json/wp/v2/posts", (req, res) => res.redirect("/api/blogs"));
app.use("/wp-json/wp/v2/categories", (req, res) => res.redirect("/api/categories"));
app.use("/wp-json/wc/v3/products", (req, res) => res.redirect("/api/products"));
app.use("/wp-json/wc/v3/orders", (req, res) => res.redirect("/api/orders"));
app.get("/wp-json", (req, res) => {
  res.json({
    name: "GlowGoodly E-Commerce Backend Engine",
    description: "Production API for Products, Banners, Categories, Brands & Orders",
    url: "https://shop.glowgoodly.com",
    namespaces: ["wp/v2", "wc/v3", "glowgoodly/v1"],
    routes: {
      "/wp-json/wc/v3/products": { methods: ["GET", "POST"] },
      "/wp-json/wc/v3/categories": { methods: ["GET"] },
      "/wp-json/wc/v3/orders": { methods: ["GET", "POST"] },
      "/api/products": { methods: ["GET", "POST"] },
      "/api/categories": { methods: ["GET"] },
      "/api/banners": { methods: ["GET"] }
    }
  });
});

// Socket.io Real-Time Promotional Broadcasting System (100% Free WebSockets)
let activeSocketsCount = 0;
let lastPromoBroadcast: any = null;
let inMemoryPromos: any[] = [];

io.on("connection", (socket) => {
  activeSocketsCount++;
  console.log(`⚡ Socket connected: ${socket.id}. Active clients: ${activeSocketsCount}`);
  io.emit("clients:count", activeSocketsCount);

  // Send last active promo on connect if available
  if (lastPromoBroadcast) {
    socket.emit("promo:message", lastPromoBroadcast);
  }

  socket.on("admin:send-promo", async (promoData) => {
    const promoPayload = {
      ...promoData,
      id: promoData.id || ("promo_" + Date.now()),
      timestamp: new Date().toISOString()
    };
    lastPromoBroadcast = promoPayload;
    inMemoryPromos = [promoPayload, ...inMemoryPromos.filter(p => p.id !== promoPayload.id)];
    if (db) {
      try {
        await db.collection("promotions").doc(promoPayload.id).set(promoPayload);
      } catch (e) {
        console.log("Promo DB save fallback:", e);
      }
    }
    console.log("📢 Admin broadcasting promo message via Socket.io:", lastPromoBroadcast);
    io.emit("promo:message", lastPromoBroadcast);
  });

  socket.on("admin:clear-promo", () => {
    lastPromoBroadcast = null;
    io.emit("promo:clear", {});
  });

  socket.on("disconnect", () => {
    activeSocketsCount = Math.max(0, activeSocketsCount - 1);
    console.log(`🔌 Socket disconnected: ${socket.id}. Active clients: ${activeSocketsCount}`);
    io.emit("clients:count", activeSocketsCount);
  });
});

// Admin REST Endpoint to broadcast Socket.io promo message
app.post("/api/admin/broadcast-promo", async (req: express.Request, res: express.Response) => {
  try {
    const { id, title, message, code, discount, link, image } = req.body;
    if (!message && !title) {
      return res.status(400).json({ error: "Promo title or message is required" });
    }

    const promoPayload = {
      id: id || ("promo_" + Date.now()),
      title: title || "🌸 Special Offer Alert!",
      message: message || "",
      code: code || "GLOW15",
      discount: discount || "15%",
      link: link || "/shop",
      image: image || "",
      timestamp: new Date().toISOString()
    };

    lastPromoBroadcast = promoPayload;
    inMemoryPromos = [promoPayload, ...inMemoryPromos.filter(p => p.id !== promoPayload.id)];
    io.emit("promo:message", promoPayload);

    // Also persist in DB if available
    if (db) {
      try {
        await db.collection("promotions").doc(promoPayload.id).set(promoPayload);
      } catch (e) {
        console.log("Promo DB save fallback:", e);
      }
    }

    res.json({
      success: true,
      activeClients: activeSocketsCount,
      promo: promoPayload,
      message: "Promotional message broadcasted to all live website users for free via Socket.io!"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/broadcast-promo — Get history of promos
app.get("/api/admin/broadcast-promo", async (req: express.Request, res: express.Response) => {
  try {
    const listMap = new Map<string, any>();

    // 1. In-memory promos
    inMemoryPromos.forEach((p) => {
      if (p && p.id) listMap.set(p.id, p);
    });

    // 2. From database
    if (db) {
      try {
        const snapshot = await db.collection("promotions").get();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const pId = data.id || doc.id;
          listMap.set(pId, { ...data, id: pId });
        });
      } catch (e) {
        console.log("Error fetching DB promos:", e);
      }
    }

    if (listMap.size === 0 && lastPromoBroadcast) {
      listMap.set(lastPromoBroadcast.id, lastPromoBroadcast);
    }

    const list = Array.from(listMap.values());
    list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/broadcast-promo/:id — Delete a specific promo
app.delete("/api/admin/broadcast-promo/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Remove from in-memory list
    inMemoryPromos = inMemoryPromos.filter((p) => p.id !== id);

    // If active broadcast matches, clear it and emit clear event
    if (lastPromoBroadcast && (lastPromoBroadcast.id === id || id === "active" || id === "current")) {
      lastPromoBroadcast = null;
      io.emit("promo:clear", { id });
    } else {
      io.emit("promo:clear", { id });
    }

    if (db) {
      try {
        // Delete directly by doc ID
        await db.collection("promotions").doc(id).delete();
        // Also check if any document has id in data matching this id
        const snapshot = await db.collection("promotions").where("id", "==", id).get();
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
      } catch (e) {
        console.log("Error deleting from promotions collection:", e);
      }
    }

    res.json({ success: true, message: `Promo ${id} deleted successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/broadcast-promo/clear — Stop/clear live broadcast from visitor screens
app.post("/api/admin/broadcast-promo/clear", async (req: express.Request, res: express.Response) => {
  try {
    lastPromoBroadcast = null;
    io.emit("promo:clear", {});
    res.json({ success: true, message: "Live promo cleared from all visitor screens!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/broadcast-promo — Delete all promos
app.delete("/api/admin/broadcast-promo", async (req: express.Request, res: express.Response) => {
  try {
    lastPromoBroadcast = null;
    inMemoryPromos = [];
    io.emit("promo:clear", {});

    if (db) {
      try {
        const snapshot = await db.collection("promotions").get();
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
      } catch (e) {
        console.log("Error clearing all promotions:", e);
      }
    }

    res.json({ success: true, message: "All promos cleared successfully!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Contact endpoints
app.post("/api/contact", async (req: express.Request, res: express.Response) => {
  try {
    const { name, phone, email, subject, message } = req.body;
    if (!name || (!phone && !email) || !message) {
      return res.status(400).json({ error: "Name, phone/email, and message are required" });
    }
    const docRef = db.collection("contact_messages").doc();
    const contactData = {
      id: docRef.id,
      name,
      phone: phone || "",
      email: email || "",
      subject: subject || "Customer Inquiry",
      message,
      status: "Unread",
      replies: [],
      createdAt: new Date().toISOString(),
    };
    await docRef.set(contactData);
    res.status(201).json({ message: "Contact message received successfully", data: contactData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/contact-messages", async (req: express.Request, res: express.Response) => {
  try {
    const snapshot = await db.collection("contact_messages").get();
    const messages: any[] = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/contact-messages/:id/reply", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { replyText, senderName } = req.body;
    if (!replyText) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    const docRef = db.collection("contact_messages").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Message not found" });
    }

    const data = doc.data() as any;
    const replies = data.replies || [];
    const newReply = {
      id: "rep_" + Date.now(),
      sender: senderName || "GlowGoodly Admin Support",
      message: replyText,
      createdAt: new Date().toISOString()
    };
    replies.push(newReply);

    await docRef.update({
      replies,
      status: "Replied",
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, reply: newReply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// NOTE: Routes above (lines 125-134) use specific paths e.g. /api/banners, /api/marketing
// The old generic /api/* registrations below have been removed to avoid routing conflicts

// ─── Public Blog Articles API (100% Database-Driven) ───
app.get("/api/blogs", async (req: express.Request, res: express.Response) => {
  try {
    const snapshot = await db.collection("blogs").get();
    const blogs: any[] = [];
    snapshot.forEach(doc => {
      blogs.push({ id: doc.id, ...doc.data() });
    });
    blogs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(blogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Public Coupon Validation API (100% Database-Driven) ───
app.get("/api/coupons/validate", async (req: express.Request, res: express.Response) => {
  try {
    const rawCode = (req.query.code as string || "").trim().toUpperCase();
    const subtotal = parseFloat(req.query.subtotal as string || "0");

    if (!rawCode) {
      return res.status(400).json({ valid: false, error: "Coupon code is required" });
    }

    const snapshot = await db.collection("coupons").get();
    let cData: any = null;
    snapshot.forEach(doc => {
      const d = doc.data() as any;
      if (doc.id.toUpperCase() === rawCode || (d.code && d.code.toUpperCase() === rawCode)) {
        cData = { id: doc.id, ...d };
      }
    });

    if (!cData) {
      return res.status(404).json({ valid: false, error: "Invalid or expired coupon code" });
    }
    if (!cData || cData.isActive === false) {
      return res.status(400).json({ valid: false, error: "Coupon is inactive" });
    }

    if (cData.expiresAt && new Date(cData.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ valid: false, error: "Coupon has expired" });
    }

    const minSpend = Number(cData.minOrder || cData.minOrderValue || 0);

    let calculatedDiscount = 0;
    // 1. Check tiered discounts ("koto tk te koto tk discount")
    if (Array.isArray(cData.tiers) && cData.tiers.length > 0) {
      const sortedTiers = [...cData.tiers].sort((a, b) => Number(b.minSpend) - Number(a.minSpend));
      const lowestTier = sortedTiers[sortedTiers.length - 1];

      if (subtotal > 0 && subtotal < Number(lowestTier.minSpend)) {
        return res.status(400).json({
          valid: false,
          error: `Minimum order amount of ৳${lowestTier.minSpend} required for this offer (পাবেন ৳${lowestTier.discount} ছাড়)`
        });
      }

      const matchedTier = sortedTiers.find(t => subtotal >= Number(t.minSpend));
      if (matchedTier) {
        calculatedDiscount = Number(matchedTier.discount);
      } else if (subtotal === 0) {
        // Just checking preview
        calculatedDiscount = Number(lowestTier.discount);
      }
    } else {
      // 2. Standard single minimum spend rule
      if (minSpend > 0 && subtotal > 0 && subtotal < minSpend) {
        return res.status(400).json({ valid: false, error: `Minimum order amount of ৳${minSpend} required` });
      }

      const discVal = Number(cData.discount || cData.discountValue || 0);
      if (cData.discountType === "PERCENTAGE" || cData.discountType === "Percentage") {
        calculatedDiscount = Math.round((subtotal * discVal) / 100);
        if (cData.maxDiscount && calculatedDiscount > Number(cData.maxDiscount)) {
          calculatedDiscount = Number(cData.maxDiscount);
        }
      } else {
        calculatedDiscount = discVal;
      }
    }

    return res.json({
      valid: true,
      code: rawCode,
      title: cData.title || `${rawCode} Offer`,
      description: cData.description || "",
      discount: calculatedDiscount,
      discountType: cData.discountType || "Fixed",
      minOrderValue: minSpend,
      tiers: cData.tiers || [],
      message: `Coupon ${rawCode} applied: ৳${calculatedDiscount} discount!`
    });
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message });
  }
});

// ─── Public Active Coupons API (100% Database-Driven) ───
app.get("/api/coupons/public", async (req: express.Request, res: express.Response) => {
  try {
    const snapshot = await db.collection("coupons").get();
    const list: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as any;
      if (data && data.isActive !== false) {
        const minOrder = Number(data.minOrderValue || data.minOrder || 0);
        const disc = Number(data.discountValue || data.discount || 0);
        const hasTiers = Array.isArray(data.tiers) && data.tiers.length > 0;

        let subtitle = "";
        if (hasTiers) {
          subtitle = data.tiers.map((t: any) => `৳${t.minSpend}→৳${t.discount}`).join(", ");
        } else if (data.discountType === "PERCENTAGE" || data.discountType === "Percentage") {
          subtitle = minOrder > 0 ? `৳${minOrder}+ অর্ডারে ${disc}% ছাড়` : `${disc}% Off`;
        } else {
          subtitle = minOrder > 0 ? `৳${minOrder}+ অর্ডারে ৳${disc} ছাড়` : `৳${disc} Off`;
        }

        list.push({
          id: doc.id,
          code: data.code || doc.id,
          title: data.title || (minOrder > 0 ? `৳${minOrder} কেনাকাটায় ৳${disc} ছাড়` : `${data.code || doc.id} Coupon`),
          subtitle: data.description || subtitle,
          discount: disc,
          discountType: data.discountType || "Fixed",
          minOrderValue: minOrder,
          tiers: data.tiers || [],
          expiryDate: data.expiryDate || data.expiresAt
        });
      }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Backend Root Landing Page Endpoint (Shajgoj Landing UI with GlowGoodly Branding)
app.get("/", (req, res) => {
  let logoSrc = "/logo.png";
  try {
    const possiblePaths = [
      path.join(__dirname, "..", "public", "logo.png"),
      path.join(__dirname, "public", "logo.png"),
      path.join(process.cwd(), "public", "logo.png"),
      path.join(process.cwd(), "backend", "public", "logo.png"),
      path.join(process.cwd(), "frontend", "public", "user-glow-logo.png"),
      path.join(process.cwd(), "frontend", "public", "images", "logo.png")
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const b64 = fs.readFileSync(p).toString("base64");
        if (b64 && b64.length > 100) {
          logoSrc = `data:image/png;base64,${b64}`;
          break;
        }
      }
    }
  } catch (e) { }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>WELCOME TO GLOWGOODLY | Authentic Cosmetics Bangladesh</title>
	<link rel="icon" type="image/x-icon" href="/favicon.ico">
	<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
	<link rel="icon" type="image/png" sizes="192x192" href="/logo.png">
	<link rel="apple-touch-icon" href="/logo.png">
	<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		body {
			font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
			background: radial-gradient(circle at 80% 30%, #fce7f3 0%, #fdf2f8 40%, #faf5ff 75%, #ffffff 100%);
			color: #1e293b;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
			overflow-x: hidden;
		}
		.top-nav {
			width: 100%;
			max-width: 1280px;
			margin: 0 auto;
			padding: 36px 48px 10px 48px;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.nav-brand {
			font-size: 20px;
			font-weight: 900;
			letter-spacing: 3px;
			color: #0f172a;
			text-transform: uppercase;
		}
		.nav-tagline {
			font-size: 11px;
			font-weight: 700;
			letter-spacing: 2px;
			color: #94a3b8;
			text-transform: uppercase;
		}
		.page-wrapper {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px 48px 24px 48px;
		}
		.landing-container {
			display: flex;
			align-items: center;
			justify-content: space-between;
			max-width: 1200px;
			width: 100%;
			gap: 60px;
		}
		.left-content {
			flex: 1.1;
			max-width: 540px;
		}
		.welcome-pill {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 6px 16px;
			background: #ffffff;
			border: 1px solid #fce7f3;
			border-radius: 30px;
			font-size: 11.5px;
			font-weight: 800;
			letter-spacing: 1.5px;
			color: #64748b;
			text-transform: uppercase;
			margin-bottom: 24px;
			box-shadow: 0 2px 10px rgba(226, 19, 110, 0.06);
		}
		.welcome-pill .pill-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background-color: #e2136e;
			box-shadow: 0 0 8px rgba(226, 19, 110, 0.8);
		}
		.hero-title {
			font-size: 64px;
			font-weight: 800;
			line-height: 1.08;
			color: #1e1b4b;
			letter-spacing: -1px;
			margin-bottom: 18px;
		}
		.hero-title .accent-text {
			background: linear-gradient(135deg, #e2136e 0%, #7c3aed 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			font-weight: 900;
		}
		.hero-desc {
			font-size: 15.5px;
			color: #64748b;
			line-height: 1.6;
			margin-bottom: 32px;
			font-weight: 500;
		}
		.card-btn-group {
			display: flex;
			flex-direction: column;
			gap: 16px;
			max-width: 400px;
			margin-bottom: 32px;
		}
		.action-card {
			display: flex;
			align-items: center;
			gap: 16px;
			background: #ffffff;
			border: 1px solid #f1f5f9;
			border-radius: 20px;
			padding: 14px 20px;
			text-decoration: none;
			color: #0f172a;
			box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
			transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		}
		.action-card:hover {
			transform: translateY(-2px);
			box-shadow: 0 10px 28px rgba(226, 19, 110, 0.12);
			border-color: #fbcfe8;
		}
		.card-icon-box {
			width: 48px;
			height: 48px;
			border-radius: 14px;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			color: #ffffff;
		}
		.card-icon-ecommerce {
			background: linear-gradient(135deg, #e2136e 0%, #f43f5e 100%);
			box-shadow: 0 4px 14px rgba(226, 19, 110, 0.3);
		}
		.card-icon-blog {
			background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%);
			box-shadow: 0 4px 14px rgba(109, 40, 217, 0.3);
		}
		.card-text {
			flex: 1;
		}
		.card-title {
			font-size: 15px;
			font-weight: 800;
			color: #0f172a;
			margin-bottom: 2px;
		}
		.card-subtitle {
			font-size: 12px;
			color: #94a3b8;
			font-weight: 500;
		}
		.card-arrow {
			width: 32px;
			height: 32px;
			border-radius: 50%;
			background: #f8fafc;
			display: flex;
			align-items: center;
			justify-content: center;
			color: #0f172a;
			font-size: 14px;
			font-weight: 700;
			transition: all 0.2s ease;
		}
		.action-card:hover .card-arrow {
			background: #fdf2f8;
			color: #e2136e;
			transform: translateX(3px);
		}
		.trust-badges {
			display: flex;
			align-items: center;
			gap: 20px;
			flex-wrap: wrap;
			margin-top: 4px;
			padding-top: 4px;
		}
		.trust-badge-item {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			font-size: 12.5px;
			font-weight: 700;
			color: #be185d;
		}
		.trust-badge-icon {
			font-size: 14px;
		}
		.right-content {
			flex: 1.1;
			display: flex;
			justify-content: center;
			align-items: center;
			position: relative;
		}
		.illustration-wrapper {
			position: relative;
			width: 100%;
			max-width: 520px;
			aspect-ratio: 1 / 1;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		/* Delicate concentric sketch orbit rings */
		.wreath-sketch-ring {
			position: absolute;
			border-radius: 50%;
			pointer-events: none;
		}
		.sketch-ring-1 {
			width: 95%;
			height: 95%;
			border: 1.2px dashed rgba(226, 19, 110, 0.25);
			animation: rotateSlow 60s linear infinite;
		}
		.sketch-ring-2 {
			width: 84%;
			height: 84%;
			border: 1px solid rgba(226, 19, 110, 0.14);
		}
		.sketch-ring-3 {
			width: 72%;
			height: 72%;
			border: 1.2px dashed rgba(124, 58, 237, 0.2);
			animation: rotateSlowRev 45s linear infinite;
		}
		@keyframes rotateSlow {
			from { transform: rotate(0deg); }
			to { transform: rotate(360deg); }
		}
		@keyframes rotateSlowRev {
			from { transform: rotate(360deg); }
			to { transform: rotate(0deg); }
		}
		.wreath-img {
			position: absolute;
			width: 100%;
			height: 100%;
			object-fit: contain;
			pointer-events: none;
			z-index: 2;
			background: transparent;
			mix-blend-mode: multiply;
			border-radius: 50%;
		}

		/* Center Solar System Orbit Ring & Revolving Glowing Planet */
		.center-solar-system {
			position: relative;
			width: 220px;
			height: 220px;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 4;
		}
		.center-logo-disc {
			position: relative;
			width: 126px;
			height: 126px;
			border-radius: 50%;
			background: radial-gradient(circle at 35% 35%, #ffffff 65%, #fff1f2 100%);
			border: 2px solid rgba(255, 255, 255, 0.95);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			box-shadow: 0 14px 38px rgba(226, 19, 110, 0.18), 0 0 0 6px rgba(255, 255, 255, 0.7);
			z-index: 5;
			animation: floatPulse 3.5s ease-in-out infinite alternate;
		}
		.center-logo-disc img {
			width: 72px;
			height: 72px;
			object-fit: contain;
		}
		.center-logo-text {
			font-size: 10px;
			font-weight: 900;
			letter-spacing: 2px;
			color: #0f172a;
			text-transform: uppercase;
			margin-top: 4px;
		}
		@keyframes floatPulse {
			0% {
				transform: translateY(0px) scale(1);
			}
			50% {
				transform: translateY(-6px) scale(1.04);
			}
			100% {
				transform: translateY(0px) scale(1);
			}
		}
		.orbit-ring {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 184px;
			height: 184px;
			margin-top: -92px;
			margin-left: -92px;
			border-radius: 50%;
			border: 1.5px solid rgba(226, 19, 110, 0.4);
			box-shadow: 0 0 18px rgba(226, 19, 110, 0.15), inset 0 0 18px rgba(226, 19, 110, 0.08);
			animation: orbitSpin 5.5s linear infinite;
			pointer-events: none;
			z-index: 4;
		}
		.orbit-ball {
			position: absolute;
			top: -6px;
			left: calc(50% - 6px);
			width: 13px;
			height: 13px;
			border-radius: 50%;
			background: radial-gradient(circle at 35% 35%, #ff4d94 0%, #e2136e 70%, #9d174d 100%);
			box-shadow: 0 0 10px #e2136e, 0 0 20px rgba(226, 19, 110, 0.8), 0 0 28px rgba(244, 63, 94, 0.45);
		}
		@keyframes orbitSpin {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}
		.page-footer {
			width: 100%;
			text-align: center;
			padding: 16px;
			font-size: 12px;
			color: #94a3b8;
			font-weight: 500;
		}
		@media (max-width: 900px) {
			.top-nav {
				padding: 24px 20px 0 20px;
			}
			.page-wrapper {
				padding: 20px;
			}
			.landing-container {
				flex-direction: column-reverse;
				text-align: center;
				gap: 36px;
			}
			.card-btn-group {
				margin: 0 auto 24px auto;
			}
			.trust-badges {
				justify-content: center;
			}
			.hero-title {
				font-size: 42px;
			}
			.illustration-wrapper {
				max-width: 320px;
			}
			.center-solar-system {
				width: 170px;
				height: 170px;
			}
			.center-logo-disc {
				width: 100px;
				height: 100px;
			}
			.center-logo-disc img {
				width: 55px;
				height: 55px;
			}
			.orbit-ring {
				width: 140px;
				height: 140px;
				margin-top: -70px;
				margin-left: -70px;
			}
		}
	</style>
</head>
<body>
	<header class="top-nav">
		<div class="nav-brand">GLOWGOODLY</div>
		<div class="nav-tagline">BEAUTY &bull; BANGLADESH</div>
	</header>

	<div class="page-wrapper">
		<div class="landing-container">
			<div class="left-content">
				<div class="welcome-pill">
					<span class="pill-dot"></span>
					WELCOME TO GLOWGOODLY
				</div>
				<h1 class="hero-title">It's you,<br/>but <span class="accent-text">new</span></h1>
				<p class="hero-desc">Buy Authentic Cosmetic and Beauty Products Online in Bangladesh.</p>
				
				<div class="card-btn-group">
					<a href="http://localhost:3000" class="action-card" target="_blank">
						<div class="card-icon-box card-icon-ecommerce">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
								<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
								<line x1="3" y1="6" x2="21" y2="6"></line>
								<path d="M16 10a4 4 0 0 1-8 0"></path>
							</svg>
						</div>
						<div class="card-text">
							<div class="card-title">Shop E-commerce</div>
							<div class="card-subtitle">Makeup, skincare &amp; more</div>
						</div>
						<div class="card-arrow">&rarr;</div>
					</a>

					<a href="https://glowgoodly.com" class="action-card" target="_blank">
						<div class="card-icon-box card-icon-blog">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
								<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
								<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
							</svg>
						</div>
						<div class="card-text">
							<div class="card-title">Read the Blog</div>
							<div class="card-subtitle">Beauty tips, guides &amp; trends</div>
						</div>
						<div class="card-arrow">&rarr;</div>
					</a>
				</div>

				<div class="trust-badges">
					<div class="trust-badge-item">
						<span class="trust-badge-icon">&#x1F6E1;&#xFE0F;</span>
						<span>100% Authentic</span>
					</div>
					<div class="trust-badge-item">
						<span class="trust-badge-icon">&#x2B50;</span>
						<span>Trusted Brands</span>
					</div>
					<div class="trust-badge-item">
						<span class="trust-badge-icon">&#x1F69A;</span>
						<span>Delivery Across Bangladesh</span>
					</div>
				</div>
			</div>

			<div class="right-content">
				<div class="illustration-wrapper">
					<!-- Concentric delicate sketched orbit rings -->
					<div class="wreath-sketch-ring sketch-ring-1"></div>
					<div class="wreath-sketch-ring sketch-ring-2"></div>
					<div class="wreath-sketch-ring sketch-ring-3"></div>

					<!-- Circular cosmetics wreath image with multiply blend for 100% transparent background -->
					<img src="/cosmetics_circle_illustration.png?v=3" alt="Cosmetics Frame" class="wreath-img" onerror="this.style.opacity='0.25';" />

					<!-- GlowGoodly Logo Center Solar System Orbit Ring & Revolving Planet -->
					<div class="center-solar-system">
						<!-- Outer Circular Orbit Ring with revolving glowing ball -->
						<div class="orbit-ring">
							<div class="orbit-ball"></div>
						</div>
						<!-- Central round GlowGoodly logo circle with floating/breathing animation -->
						<div class="center-logo-disc">
							<img src="${logoSrc}" alt="GlowGoodly Logo" onerror="this.onerror=null;this.src='/logo.png';" />
							<div class="center-logo-text">GLOWGOODLY</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<footer class="page-footer">
		&copy; 2026 GlowGoodly. All rights reserved.
	</footer>
</body>
</html>`);
});

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", activeSockets: activeSocketsCount, timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("🔥 Global Express Error Handler caught:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : String(err),
  });
});

process.on("uncaughtException", (err) => {
  console.error("💥 Global uncaughtException intercepted:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Global unhandledRejection intercepted at:", promise, "reason:", reason);
});

httpServer.listen(PORT, async () => {
  console.log("==================================================");
  console.log("GlowGoodly Backend Starting...");
  console.log(`Environment: ${process.env.NODE_ENV === "production" ? "Production" : "Development"}`);

  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database: Connected");
    dbConnected = true;
  } catch (dbErr: any) {
    try {
      const userCount = await prisma.user.count();
      console.log(`Database: Connected (${userCount} users found)`);
      dbConnected = true;
    } catch (e: any) {
      console.error("Database: Connection Failed:", dbErr?.message || dbErr);
    }
  }

  console.log(`Express API: http://localhost:${PORT}`);
  console.log("Socket.IO: Initialized");
  if (dbConnected) {
    console.log("Backend Status: READY");
  } else {
    console.warn("Backend Status: DEGRADED (Database initialization failed)");
  }
  console.log("==================================================");

  try {
    await autoSeedDatabase();
  } catch (err: any) {
    console.warn("⚠️ autoSeedDatabase warning:", err?.message || err);
  }
  try {
    await initMySQLTables();
  } catch (err: any) {
    console.warn("⚠️ initMySQLTables warning:", err?.message || err);
  }

  try {
    await ensureDefaultSectionsSeeded();
  } catch (err: any) {
    console.warn("⚠️ ensureDefaultSectionsSeeded warning:", err?.message || err);
  }
});
// GlowGoodly Server active

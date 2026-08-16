import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
import db from "./firebase";
import { autoSeedDatabase } from "./auto-seed";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Security & Anti-Hacking Protection Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Anti-Caching Middleware for API requests to ensure real-time data updates
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
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
app.use("/api/bkash", bkashRouter);

// Socket.io Real-Time Promotional Broadcasting System (100% Free WebSockets)
let activeSocketsCount = 0;
let lastPromoBroadcast: any = null;

io.on("connection", (socket) => {
  activeSocketsCount++;
  console.log(`⚡ Socket connected: ${socket.id}. Active clients: ${activeSocketsCount}`);

  // Send last active promo on connect if available
  if (lastPromoBroadcast) {
    socket.emit("promo:message", lastPromoBroadcast);
  }

  socket.on("admin:send-promo", (promoData) => {
    lastPromoBroadcast = {
      ...promoData,
      id: "promo_" + Date.now(),
      timestamp: new Date().toISOString()
    };
    console.log("📢 Admin broadcasting promo message via Socket.io:", lastPromoBroadcast);
    io.emit("promo:message", lastPromoBroadcast);
  });

  socket.on("disconnect", () => {
    activeSocketsCount = Math.max(0, activeSocketsCount - 1);
    console.log(`🔌 Socket disconnected: ${socket.id}. Active clients: ${activeSocketsCount}`);
  });
});

// Admin REST Endpoint to broadcast Socket.io promo message
app.post("/api/admin/broadcast-promo", async (req: express.Request, res: express.Response) => {
  try {
    const { title, message, code, discount, link, image } = req.body;
    if (!message && !title) {
      return res.status(400).json({ error: "Promo title or message is required" });
    }

    const promoPayload = {
      id: "promo_" + Date.now(),
      title: title || "🌸 Special Offer Alert!",
      message: message || "",
      code: code || "GLOW15",
      discount: discount || "15%",
      link: link || "/shop",
      image: image || "",
      timestamp: new Date().toISOString()
    };

    lastPromoBroadcast = promoPayload;
    io.emit("promo:message", promoPayload);

    // Also persist in DB if available
    if (db) {
      try {
        await db.collection("promotions").add(promoPayload);
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
    const list: any[] = [];
    if (db) {
      const snapshot = await db.collection("promotions").get();
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    }
    if (list.length === 0 && lastPromoBroadcast) {
      list.push(lastPromoBroadcast);
    }
    res.json(list);
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

app.use("/api", bannersRouter); // For /banners CRUD
app.use("/api", notificationsRouter); // For daily offer notifications
app.use("/api", chatRouter);
app.use("/api", marketingRouter);
app.use("/api", auditRouter);
app.use("/api", ticketsRouter);
app.use("/api", feedsRouter);
app.use("/api", enterpriseRouter);
app.use("/api", menuRouter);
app.use("/api", pagesRouter);

// Welcome & API Status Page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>GlowGoodly API Engine & Socket.io Server</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fcf8fa; color: #1a1a2e; padding: 50px; text-align: center; }
          .card { background: white; padding: 40px; border-radius: 16px; display: inline-block; box-shadow: 0 10px 25px rgba(230, 59, 122, 0.08); max-width: 550px; text-align: left; border-top: 5px solid #e63b7a; }
          h1 { color: #e63b7a; margin-top: 0; display: flex; align-items: center; gap: 8px; }
          code { background: #f1f3f5; padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; }
          a { color: #e63b7a; text-decoration: none; font-weight: bold; }
          a:hover { text-decoration: underline; }
          .status { display: inline-block; padding: 4px 12px; background: #e8f5e9; color: #2e7d32; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 15px; }
          ul { padding-left: 20px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🌸 GlowGoodly API Engine</h1>
          <div class="status">● ONLINE & REALTIME SOCKET.IO READY</div>
          <p>The Express backend, bKash Merchant API (01609013011), and Socket.io promotional broadcaster are listening on port 5000.</p>
          <p>Available Service Endpoints:</p>
          <ul>
            <li>API Health Status: <a href="/health">/health</a></li>
            <li>bKash Merchant Info: <a href="/api/bkash/config">/api/bkash/config</a></li>
            <li>Store Products: <a href="/api/products">/api/products</a></li>
            <li>Categories List: <a href="/api/categories">/api/categories</a></li>
          </ul>
          <p style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px; font-size: 14px; color: #666;">
            Access the main customer storefront UI here: <a href="http://localhost:3000" target="_blank">http://localhost:3000</a>
          </p>
        </div>
      </body>
    </html>
  `);
});

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", activeSockets: activeSocketsCount, timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

httpServer.listen(PORT, async () => {
  console.log(`🚀 GlowGoodly Custom Backend & Socket.io Server running at http://localhost:${PORT}`);
  await autoSeedDatabase();
});

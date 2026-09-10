import express from "express";
import cors from "cors";
import compression from "compression";
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

// Gzip / Deflate Compression Middleware (80%+ reduction in payload transfer size)
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  }
}));

// Security & Anti-Hacking Protection Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Explicit CORS Middleware allowing all origins for seamless client-side fetching
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Cache-Control"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Intelligent Caching Middleware for API requests
app.use("/api", (req, res, next) => {
  const isMutationOrPrivate = 
    req.method !== "GET" || 
    req.path.startsWith("/auth") || 
    req.path.startsWith("/admin") || 
    req.path.startsWith("/orders") || 
    req.path.startsWith("/chat") ||
    req.path.startsWith("/bkash") ||
    req.query.bypass === "true" ||
    req.query.t;

  if (isMutationOrPrivate) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  } else {
    // 5 minutes client/browser cache with 10 minutes stale-while-revalidate for instantaneous repeat loading (<100ms)
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  }
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

// Backend Root Landing Page Endpoint (Shajgoj Landing UI with GlowGoodly Branding)
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>WELCOME TO GLOWGOODLY</title>
	<link rel="icon" href="https://shop.glowgoodly.com/user-glow-logo.png" type="image/png">
	<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		body {
			font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
			background-color: #ffffff;
			color: #1a1a1a;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.landing-container {
			display: flex;
			align-items: center;
			justify-content: space-between;
			max-width: 1100px;
			width: 100%;
			gap: 40px;
		}
		.left-content {
			flex: 1;
			max-width: 500px;
		}
		.left-content h1 {
			font-size: 32px;
			font-weight: 800;
			letter-spacing: 2px;
			color: #1c1917;
			text-transform: uppercase;
			margin-bottom: 12px;
		}
		.left-content p {
			font-size: 15px;
			color: #44403c;
			line-height: 1.5;
			margin-bottom: 28px;
			font-weight: 500;
		}
		.btn-group {
			display: flex;
			flex-direction: column;
			gap: 12px;
			width: 220px;
		}
		.btn {
			display: block;
			text-align: center;
			padding: 12px 24px;
			border-radius: 25px;
			font-size: 14px;
			font-weight: 700;
			text-decoration: none;
			color: #ffffff;
			transition: all 0.2s ease;
			box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		}
		.btn-ecommerce {
			background-color: #d81b60;
		}
		.btn-ecommerce:hover {
			background-color: #c2185b;
			transform: translateY(-1px);
		}
		.btn-blog {
			background-color: #5e35b1;
		}
		.btn-blog:hover {
			background-color: #512da8;
			transform: translateY(-1px);
		}
		.right-content {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			position: relative;
		}
		.illustration-wrapper {
			position: relative;
			width: 100%;
			max-width: 460px;
		}
		.illustration-wrapper img {
			width: 100%;
			height: auto;
			display: block;
		}
		@media (max-width: 768px) {
			.landing-container {
				flex-direction: column-reverse;
				text-align: center;
				gap: 30px;
			}
			.btn-group {
				margin: 0 auto;
			}
			.left-content h1 {
				font-size: 24px;
			}
		}
	</style>
</head>
<body>
	<div class="landing-container">
		<div class="left-content">
			<h1>WELCOME TO GLOWGOODLY</h1>
			<p>Buy Authentic Cosmetic and Beauty Products Online in Bangladesh.</p>
			<div class="btn-group">
				<a href="https://shop.glowgoodly.com" class="btn btn-ecommerce" target="_blank">E-commerce</a>
				<a href="https://glowgoodly.com" class="btn btn-blog" target="_blank">Blog</a>
			</div>
		</div>
		<div class="right-content">
			<div class="illustration-wrapper">
				<svg viewBox="0 0 500 500" width="100%" height="100%">
					<!-- Circular Orbit Lines -->
					<ellipse cx="250" cy="250" rx="190" ry="170" fill="none" stroke="#d6d3d1" stroke-width="1.5" transform="rotate(-15 250 250)"/>
					<ellipse cx="250" cy="250" rx="205" ry="185" fill="none" stroke="#e7e5e4" stroke-width="1" transform="rotate(-8 250 250)"/>
					<ellipse cx="250" cy="250" rx="175" ry="155" fill="none" stroke="#f5f5f4" stroke-width="1" transform="rotate(-25 250 250)"/>
					
					<!-- GlowGoodly Exact User Image Logo Center -->
					<g transform="translate(175, 120)">
						<image href="https://shop.glowgoodly.com/user-glow-logo.png" x="0" y="0" width="150" height="180" />
						<text x="75" y="220" text-anchor="middle" font-family="'Montserrat', sans-serif" font-weight="800" font-size="18" letter-spacing="3" fill="#1c1917">GLOWGOODLY</text>
					</g>

					<!-- Cosmetic Items Around Orbit -->
					<!-- Compact Compact Powder Top Left -->
					<g transform="translate(100, 100) rotate(-20)">
						<rect x="0" y="0" width="60" height="70" rx="10" fill="#292524" />
						<circle cx="30" cy="35" r="22" fill="#e7c4b1" />
					</g>
					<!-- Makeup Brushes -->
					<g transform="translate(280, 110) rotate(45)">
						<rect x="0" y="0" width="8" height="120" rx="4" fill="#1c1917" />
						<path d="M -2,0 L 10,0 L 8,-25 C 6,-35 2,-35 0,-25 Z" fill="#78716c" />
						<path d="M 0,-22 C 3,-30 5,-30 8,-22 Z" fill="#d81b60" />
					</g>
					<!-- Lipstick Bottom Right -->
					<g transform="translate(380, 280) rotate(-30)">
						<rect x="0" y="40" width="30" height="50" rx="4" fill="#292524" />
						<rect x="3" y="20" width="24" height="20" fill="#d6d3d1" />
						<path d="M 5,20 L 25,20 L 22,-10 C 15,-20 8,-10 5,20 Z" fill="#d81b60" />
					</g>
					<!-- Palette Box Bottom Right -->
					<g transform="translate(340, 360) rotate(15)">
						<rect x="0" y="0" width="80" height="60" rx="6" fill="#1c1917" />
						<circle cx="20" cy="20" r="10" fill="#f43f5e" />
						<circle cx="45" cy="20" r="10" fill="#fb7185" />
						<circle cx="20" cy="42" r="10" fill="#fda4af" />
						<circle cx="45" cy="42" r="10" fill="#e879f9" />
					</g>
				</svg>
			</div>
		</div>
	</div>
</body>
</html>`);
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
// GlowGoodly Server active

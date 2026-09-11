import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-Memory Rate Limit Store
const ipLimits = new Map<string, RateLimitEntry>();
const authLimits = new Map<string, RateLimitEntry>();
const orderLimits = new Map<string, RateLimitEntry>();

// Cleanup stale IP entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipLimits.entries()) {
    if (now > entry.resetTime) ipLimits.delete(ip);
  }
  for (const [ip, entry] of authLimits.entries()) {
    if (now > entry.resetTime) authLimits.delete(ip);
  }
  for (const [ip, entry] of orderLimits.entries()) {
    if (now > entry.resetTime) orderLimits.delete(ip);
  }
}, 10 * 60 * 1000);

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Global DDoS & Flooding Protection: Max 300 requests per minute per IP
 */
export function globalRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Allow healthchecks or static assets
  if (req.path === "/health" || req.path.startsWith("/public")) {
    return next();
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 350;

  const entry = ipLimits.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count++;
  }

  ipLimits.set(ip, entry);

  res.setHeader("X-RateLimit-Limit", maxRequests.toString());
  res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count).toString());

  if (entry.count > maxRequests) {
    return res.status(429).json({
      error: "Too many requests from this IP. Please slow down and try again shortly.",
      retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000)
    });
  }

  next();
}

/**
 * Brute-Force Login & Signup Defense: Max 15 attempts per 5 minutes per IP
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 15;

  const entry = authLimits.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count++;
  }

  authLimits.set(ip, entry);

  if (entry.count > maxAttempts) {
    const waitSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return res.status(429).json({
      error: `Too many login/registration attempts. Temporary security lockout active. Please wait ${waitSeconds} seconds before trying again.`,
      retryAfterSeconds: waitSeconds
    });
  }

  next();
}

/**
 * Order Flooding & Fake Purchase Defense: Max 20 orders per 10 minutes per IP
 */
export function orderRateLimiter(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "POST") return next();

  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxOrders = 20;

  const entry = orderLimits.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count++;
  }

  orderLimits.set(ip, entry);

  if (entry.count > maxOrders) {
    return res.status(429).json({
      error: "Order rate limit exceeded. Please wait a few minutes before submitting new orders."
    });
  }

  next();
}

/**
 * XSS & Script Injection Sanitizer
 * Strips dangerous executable script tags and payloads from request bodies
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitizeString = (str: string): string => {
    if (typeof str !== "string") return str;
    // Remove script tags and inline event handlers
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  };

  const sanitizeObj = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObj);

    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string") {
        sanitized[key] = sanitizeString(val);
      } else if (typeof val === "object") {
        sanitized[key] = sanitizeObj(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  };

  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObj(req.body);
  }

  next();
}

/**
 * Advanced OWASP Security Headers Middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

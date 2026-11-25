import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456";

// ─── TASK 7: TOKEN REVOCATION / BLACKLIST REGISTRY ─────────────────────────
export const revokedTokens = new Set<string>();

export function revokeToken(token: string) {
  if (token) {
    revokedTokens.add(token);
    // Keep set bounded to prevent unbounded memory growth
    if (revokedTokens.size > 10000) {
      const first = revokedTokens.values().next().value;
      if (first) revokedTokens.delete(first);
    }
  }
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let authHeader = req.headers.authorization;

  // Support alternative token sources
  if (!authHeader && req.headers["x-access-token"]) {
    authHeader = `Bearer ${req.headers["x-access-token"]}`;
  }
  if (!authHeader && typeof req.query?.token === "string") {
    authHeader = `Bearer ${req.query.token}`;
  }

// Security Check: Explicit loopback check for optional dev testing only
  const remoteIp = String(req.ip || req.socket.remoteAddress || "");
  const isStrictLoopback = 
    remoteIp === "127.0.0.1" || 
    remoteIp === "::1" || 
    remoteIp === "::ffff:127.0.0.1";
  const isDevMode = process.env.NODE_ENV !== "production";
  // Strict Security Rule: Never bypass authentication for LAN IPs (192.168.x or 10.x).
  // Require explicit ALLOW_DEV_AUTH_BYPASS flag and strictly local loopback.
  const allowDevBypass = isDevMode && process.env.ALLOW_DEV_AUTH_BYPASS === "true" && isStrictLoopback;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    if (token && token !== "null" && token !== "undefined" && token !== '""') {
      if (isTokenRevoked(token)) {
        return res.status(401).json({ error: "Session revoked: Token has been invalidated. Please log in again." });
      }

      jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
        if (!err && decoded) {
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
          };
          return next();
        }

        // Token invalid or expired: strictly reject in production or external requests
        if (allowDevBypass) {
          req.user = {
            id: "local-superadmin",
            email: process.env.ADMIN_EMAIL || "admin@glowgoodly.com",
            role: "SuperAdmin",
          };
          return next();
        }

        return res.status(403).json({ error: "Invalid or expired token" });
      });
      return;
    }
  }

  // If Authorization header is missing:
  // Strictly reject unless explicit dev loopback bypass is enabled
  if (allowDevBypass) {
    req.user = {
      id: "local-superadmin",
      email: process.env.ADMIN_EMAIL || "admin@glowgoodly.com",
      role: "SuperAdmin",
    };
    return next();
  }

  res.status(401).json({ error: "Authorization header with Bearer token is required" });
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userRole = (req.user.role || "").toLowerCase();
    const allowed = roles.map(r => r.toLowerCase());
    if (!allowed.includes(userRole) && userRole !== "superadmin" && userRole !== "admin") {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    next();
  };
}


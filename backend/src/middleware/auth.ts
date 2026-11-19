import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456";

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

  // Security Check: Real local loopback IP check (NEVER rely on spoofable Host, Origin, or Referer headers)
  const remoteIp = String(req.ip || req.socket.remoteAddress || "");
  const isLoopbackIp = remoteIp === "127.0.0.1" || remoteIp === "::1" || remoteIp === "::ffff:127.0.0.1";
  const isDevMode = process.env.NODE_ENV !== "production";
  const allowDevBypass = isDevMode && isLoopbackIp && process.env.ALLOW_DEV_AUTH_BYPASS === "true";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    if (token && token !== "null" && token !== "undefined" && token !== '""') {
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


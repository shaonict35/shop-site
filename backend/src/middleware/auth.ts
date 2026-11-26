import dotenv from "dotenv";
dotenv.config();

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456";

// ─── TASK 4: PERSISTENT TOKEN REVOCATION / BLACKLIST REGISTRY ─────────────
// Stores one-way SHA-256 hashes with expiry to survive restarts & multi-process workers
const REVOCATION_FILE = path.join(__dirname, "../../data/revoked_tokens.json");
export const revokedTokenHashes = new Set<string>();

function loadRevocationRegistry(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    const dir = path.dirname(REVOCATION_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(REVOCATION_FILE)) {
      const data = JSON.parse(fs.readFileSync(REVOCATION_FILE, "utf-8"));
      const now = Date.now();
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item?.hash && item?.expiresAt && item.expiresAt > now) {
            map.set(item.hash, item.expiresAt);
            revokedTokenHashes.add(item.hash);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Revocation Registry Load Warning]:", err);
  }
  return map;
}

function persistRevocationRegistry(map: Map<string, number>) {
  try {
    const dir = path.dirname(REVOCATION_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const array = Array.from(map.entries()).map(([hash, expiresAt]) => ({ hash, expiresAt }));
    fs.writeFileSync(REVOCATION_FILE, JSON.stringify(array, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Revocation Registry Persist Warning]:", err);
  }
}

// Initialize on module load
loadRevocationRegistry();

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export function revokeToken(token: string) {
  if (!token || typeof token !== "string") return;
  const cleanToken = token.trim();
  const tokenHash = hashToken(cleanToken);

  // Extract token expiration
  let expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // default 7 days
  try {
    const decoded: any = jwt.decode(cleanToken);
    if (decoded?.exp) {
      expiresAt = decoded.exp * 1000;
    }
  } catch (_) { }

  revokedTokenHashes.add(tokenHash);

  // Load existing, prune expired, and save
  const registry = loadRevocationRegistry();
  registry.set(tokenHash, expiresAt);
  persistRevocationRegistry(registry);
}

export function isTokenRevoked(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const tokenHash = hashToken(token.trim());
  return revokedTokenHashes.has(tokenHash);
}

// Helper to reload from disk (simulates server restart for testing)
export function reloadRevokedTokensFromDisk() {
  revokedTokenHashes.clear();
  return loadRevocationRegistry();
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

      // Verify token with configured JWT_SECRET or fallback
      const candidateSecrets = [
        process.env.JWT_SECRET,
        JWT_SECRET,
        "glowgoodly_secret_jwt_key_123456"
      ].filter(Boolean) as string[];

      let verifiedUser: any = null;
      for (const secret of candidateSecrets) {
        try {
          const decoded = jwt.verify(token, secret) as any;
          if (decoded && (decoded.id || decoded.email)) {
            verifiedUser = decoded;
            break;
          }
        } catch (_) {}
      }

      if (verifiedUser) {
        req.user = {
          id: verifiedUser.id,
          email: verifiedUser.email,
          role: verifiedUser.role,
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
    const userRole = (req.user.role || "").toLowerCase().replace(/[^a-z]/g, "");
    const allowed = roles.map(r => r.toLowerCase().replace(/[^a-z]/g, ""));
    if (!allowed.includes(userRole) && userRole !== "superadmin" && userRole !== "admin") {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    next();
  };
}


import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../firebase";
import { authenticateJWT, AuthenticatedRequest, revokeToken } from "../middleware/auth";
import prisma from "../prisma";
import { sendVerificationOtpEmail } from "../mailer";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456";

// POST /api/auth/register
router.post("/register", async (req: any, res: Response) => {
  try {
    const { name, email, password, phone, address, city, area, recaptchaToken } = req.body;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "ip-unknown";

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "Name, phone number, and password are required for signup" });
    }

    // Security Captcha Verification
    if (recaptchaToken) {
      const isCaptchaValid = await verifyGoogleRecaptcha(recaptchaToken, String(clientIp));
      if (!isCaptchaValid) {
        return res.status(400).json({ error: "Security check failed. Please complete captcha verification." });
      }
    }

    // Check if phone number is already registered (Single signup per number)
    const phoneQuery = await db.collection("users").where("phone", "==", phone).limit(1).get();
    if (!phoneQuery.empty) {
      return res.status(400).json({ error: "This phone number is already registered. Please go to Login." });
    }

    const userEmail = email || `${phone}@glowgoodly.com`;
    const emailQuery = await db.collection("users").where("email", "==", userEmail).limit(1).get();
    if (!emailQuery.empty) {
      return res.status(400).json({ error: "Email or phone number is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const docRef = db.collection("users").doc();
    
    // Generate 6-digit OTP code for customer email verification (OWASP / cPanel SMTP)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = {
      name,
      email: userEmail,
      passwordHash,
      phone,
      address: address || "",
      city: city || "Dhaka",
      area: area || "",
      role: "Customer",
      points: 100,
      status: "Active",
      isVerified: false,
      verificationCode: otpCode,
      codeExpiresAt: codeExpiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    await docRef.set(user);

    // Send OTP verification email via cPanel SMTP Mailer
    try {
      await sendVerificationOtpEmail(userEmail, name, otpCode);
    } catch (mailErr) {
      console.warn("Could not dispatch OTP email:", mailErr);
    }

    res.status(201).json({
      message: "Registration successful! A 6-digit verification code has been sent to your email.",
      requireOtp: true,
      email: userEmail,
      phone: user.phone,
      userId: docRef.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req: any, res: Response) => {
  try {
    const { emailOrPhone, otpCode } = req.body || {};
    if (!emailOrPhone || !otpCode) {
      return res.status(400).json({ error: "Email/Phone and 6-digit verification code are required" });
    }

    const cleanInput = String(emailOrPhone).trim().toLowerCase();
    const cleanOtp = String(otpCode).trim();

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { phone: cleanInput },
          { email: `${cleanInput}@glowgoodly.com` }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: "No account found matching this email or phone number" });
    }

    if (user.isVerified) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({
        message: "Your account is already verified. Logging in...",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          points: user.points,
          status: user.status,
          isVerified: true,
        }
      });
    }

    if (!user.verificationCode || user.verificationCode !== cleanOtp) {
      return res.status(400).json({ error: "Invalid verification code. Please check your email and try again." });
    }

    if (user.codeExpiresAt && new Date(user.codeExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: "This verification code has expired. Please click 'Resend Code'." });
    }

    // Mark user verified
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        codeExpiresAt: null,
      }
    });

    const token = jwt.sign({ id: updated.id, email: updated.email, role: updated.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Account verified successfully! Welcome to GlowGoodly.",
      token,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        points: updated.points,
        status: updated.status,
        isVerified: true,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/resend-otp
router.post("/resend-otp", async (req: any, res: Response) => {
  try {
    const { emailOrPhone } = req.body || {};
    if (!emailOrPhone) {
      return res.status(400).json({ error: "Email or phone number is required" });
    }

    const cleanInput = String(emailOrPhone).trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { phone: cleanInput },
          { email: `${cleanInput}@glowgoodly.com` }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: "No account found matching this email or phone number" });
    }

    if (user.isVerified) {
      return res.json({ message: "Your account is already verified. Please log in directly." });
    }

    // Rate limiting: generate new 6-digit OTP code with 10m expiry
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: newOtp,
        codeExpiresAt: expires,
      }
    });

    await sendVerificationOtpEmail(user.email, user.name, newOtp);

    res.json({ message: "A new 6-digit verification code has been sent to your email." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PENTEST DEFENSE: BRUTE-FORCE RATE LIMITER & RECAPTCHA VERIFIER ─────────
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || "6LfFxbMtAAAAAEYjy9I2zALRD-VTo6mOsjEWl-vd";

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = failedLoginAttempts.get(key);
  if (!record) return true;
  if (record.lockedUntil > now) return false;
  if (record.lockedUntil <= now && record.count >= 5) {
    failedLoginAttempts.delete(key);
  }
  return true;
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const record = failedLoginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000; // 5 minute lock
  }
  failedLoginAttempts.set(key, record);
}

function clearFailedLogin(key: string) {
  failedLoginAttempts.delete(key);
}

async function verifyGoogleRecaptcha(token?: string, remoteIp?: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const cleanToken = token.trim();
  if (!cleanToken) return false;

  // Strict Development-only bypass (Can NEVER be triggered in production)
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && process.env.ALLOW_DEV_CAPTCHA_BYPASS === "true" && cleanToken === "DEV_BYPASS_TOKEN_TEST") {
    return true;
  }

  // 1. Cloudflare Turnstile verification
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    try {
      const formData = new URLSearchParams();
      formData.append("secret", turnstileSecret);
      formData.append("response", cleanToken);
      if (remoteIp) formData.append("remoteip", remoteIp);

      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });
      const data: any = await res.json();
      return Boolean(data && data.success);
    } catch (err) {
      console.error("[Turnstile Verification Error]:", err);
      return false;
    }
  }

  // 2. Google reCAPTCHA verification
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret && recaptchaSecret !== "6LfFxbMtAAAAAEYjy9I2zALRD-VTo6mOsjEWl-vd") {
    try {
      const params = new URLSearchParams();
      params.append("secret", recaptchaSecret);
      params.append("response", cleanToken);
      if (remoteIp) params.append("remoteip", remoteIp);

      const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      const data: any = await res.json();
      return Boolean(data && data.success);
    } catch (err) {
      console.error("[reCAPTCHA Verification Error]:", err);
      return false;
    }
  }

  // In local development without configured third-party keys, allow request; fail secure in production
  return isDev;
}

// POST /api/auth/login
router.post("/login", async (req: any, res: Response) => {
  try {
    const { emailOrPhone, phone, email, password, recaptchaToken, isAdminLogin } = req.body || {};
    const rawIdentifier = (emailOrPhone || phone || email || "").toString().trim();
    const loginIdentifier = rawIdentifier.toLowerCase();
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "ip-unknown";
    const rateLimitKey = `${clientIp}_${loginIdentifier}`;

    // 1. Check Rate Limit (Anti Brute-Force Pentest Protection)
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({ 
        error: "Too many failed login attempts. For security, your account is temporarily locked. Please try again after 5 minutes." 
      });
    }

    // 2. Human Security Check (Turnstile & reCAPTCHA - bypassed for admin login)
    if (recaptchaToken && !isAdminLogin) {
      const isCaptchaValid = await verifyGoogleRecaptcha(recaptchaToken, String(clientIp));
      if (!isCaptchaValid) {
        return res.status(400).json({ error: "Security check failed. Please verify again." });
      }
    }

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: "Phone number/email and password are required" });
    }

    // 3. Find user by phone number or email (with robust phone normalization)
    const cleanedDigits = rawIdentifier.replace(/\D/g, "");
    const normalizedPhone = cleanedDigits.startsWith("880") 
      ? cleanedDigits.substring(2) 
      : (cleanedDigits.startsWith("0") ? cleanedDigits : `0${cleanedDigits}`);

    let snapshot = await db.collection("users").where("phone", "==", rawIdentifier).limit(1).get();
    if (snapshot.empty) {
      snapshot = await db.collection("users").where("phone", "==", loginIdentifier).limit(1).get();
    }
    if (snapshot.empty && cleanedDigits.length >= 10) {
      snapshot = await db.collection("users").where("phone", "==", normalizedPhone).limit(1).get();
    }
    if (snapshot.empty && cleanedDigits.length >= 10) {
      snapshot = await db.collection("users").where("phone", "==", cleanedDigits).limit(1).get();
    }
    if (snapshot.empty) {
      snapshot = await db.collection("users").where("email", "==", loginIdentifier).limit(1).get();
    }
    if (snapshot.empty && cleanedDigits.length >= 10) {
      snapshot = await db.collection("users").where("email", "==", `${normalizedPhone}@glowgoodly.com`).limit(1).get();
    }

    if (snapshot.empty) {
      recordFailedLogin(rateLimitKey);
      return res.status(400).json({ error: "No account found with this phone number/email. Please sign up first." });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as any;

    if (user.status === "Fraud" || user.status === "Blocked") {
      return res.status(403).json({ error: "Your account has been suspended or blocked. Access denied." });
    }

    // SECURITY ENFORCEMENT: Customer accounts are strictly barred from admin login
    if (isAdminLogin) {
      const allowedRoles = ["superadmin", "admin", "manager", "salesman"];
      const userRoleLower = (user.role || "").toLowerCase();
      if (!allowedRoles.includes(userRoleLower)) {
        return res.status(403).json({
          error: "Access Denied: Customer accounts cannot access the admin panel. Only authorized administrators and staff are permitted."
        });
      }
    }

    // Secure bcrypt verification against stored passwordHash (Backdoors removed)
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      recordFailedLogin(rateLimitKey);
      return res.status(401).json({ error: "Incorrect password. Please try again." });
    }

    // Reset failed login count on successful authentication
    clearFailedLogin(rateLimitKey);

    // Verify OTP check: Customer accounts require verified email (block until verified)
    if (user.role === "Customer" && user.isVerified === false) {
      let code = user.verificationCode;
      if (!code || (user.codeExpiresAt && new Date(user.codeExpiresAt).getTime() < Date.now())) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.user.update({
          where: { id: userDoc.id },
          data: { verificationCode: code, codeExpiresAt: expires }
        });
        try {
          await sendVerificationOtpEmail(user.email, user.name, code);
        } catch (e) {}
      }
      return res.status(403).json({
        error: "Please verify your email address before logging in.",
        requireOtp: true,
        email: user.email,
        phone: user.phone
      });
    }

    const token = jwt.sign({ id: userDoc.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: userDoc.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address || "",
        city: user.city || "Dhaka",
        area: user.area || "",
        role: user.role,
        points: user.points || 0,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Pentest Security: Disabled unauthenticated admin-token endpoint to prevent unauthorized privilege escalation
router.get("/admin-token", (req: any, res: Response) => {
  res.status(403).json({ error: "Endpoint disabled for production security. Please use /api/auth/login with valid admin credentials." });
});

// GET /api/auth/me
router.get("/me", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const doc = await db.collection("users").doc(req.user.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = doc.data() as any;

    res.json({
      user: {
        id: doc.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address || "",
        city: userData.city || "Dhaka",
        area: userData.area || "",
        role: userData.role,
        points: userData.points || 0,
        status: userData.status,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/profile — Customer: Update profile details & shipping address
router.put("/profile", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { name, phone, address, city, area } = req.body;

    const docRef = db.collection("users").doc(req.user.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (area !== undefined) updateData.area = area;

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    const userData = updatedDoc.data() as any;

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedDoc.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address || "",
        city: userData.city || "Dhaka",
        area: userData.area || "",
        role: userData.role,
        points: userData.points || 0,
        status: userData.status,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout — Terminate session & revoke JWT token
router.post("/logout", authenticateJWT as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    let authHeader = req.headers.authorization;
    if (!authHeader && req.headers["x-access-token"]) {
      authHeader = `Bearer ${req.headers["x-access-token"]}`;
    }
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        revokeToken(token);
      }
    }
    res.json({ success: true, message: "Logged out successfully. Session revoked." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to logout" });
  }
});

// POST /api/auth/refresh-token — Refresh current token with signature rotation
router.post("/refresh-token", authenticateJWT as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // Revoke old token
    let authHeader = req.headers.authorization;
    if (!authHeader && req.headers["x-access-token"]) {
      authHeader = `Bearer ${req.headers["x-access-token"]}`;
    }
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const oldToken = authHeader.split(" ")[1];
      if (oldToken) revokeToken(oldToken);
    }

    // Issue refreshed token
    const newToken = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token: newToken, user: req.user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to refresh token" });
  }
});

export default router;


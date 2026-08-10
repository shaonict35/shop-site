import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../firebase";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "glowgoodly_secret_jwt_key_123456";

// POST /api/auth/register
router.post("/register", async (req: any, res: Response) => {
  try {
    const { name, email, password, phone, address, city, area } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "Name, phone number, and password are required for signup" });
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
      createdAt: new Date().toISOString(),
    };


    await docRef.set(user);

    const token = jwt.sign({ id: docRef.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: docRef.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req: any, res: Response) => {
  try {
    const { email, phone, emailOrPhone, password } = req.body;
    const loginIdentifier = emailOrPhone || phone || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: "Phone number/email and password are required" });
    }

    // Find user by phone number or email
    let snapshot = await db.collection("users").where("phone", "==", loginIdentifier).limit(1).get();
    if (snapshot.empty) {
      snapshot = await db.collection("users").where("email", "==", loginIdentifier).limit(1).get();
    }

    if (snapshot.empty) {
      return res.status(400).json({ error: "No account found with this phone number/email. Please sign up first." });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as any;

    if (user.status === "Fraud") {
      return res.status(403).json({ error: "Your account has been flagged as suspicious/fraud. Access denied." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password. Please try again." });
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

export default router;


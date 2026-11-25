import { emitStorefrontUpdate } from "../utils/socketSync";
import { Router, Response } from "express";
import db, { invalidatePrismaCache } from "../firebase";
import prisma from "../prisma";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import bcrypt from "bcryptjs";
import { sendWelcomeUserEmail } from "../mailer";
import { clearProductsCache, resolveCategory, resolveBrand, MASTER_CATEGORIES_DATA, MASTER_BRANDS_DATA } from "./products";
import { invalidateHeroBannersCache } from "./hero-banners";
import { invalidateBannersCache } from "./banners";
import { deleteUploadedFile } from "../utils/file-cleanup";
import { cleanAllDummyData } from "../clean-dummy-products";

const router = Router();

// POST /api/admin/clean-dummy-data (Permanently disabled for data safety)
router.post("/clean-dummy-data", authenticateJWT as any, requireRole(["SuperAdmin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  res.status(403).json({
    error: "Automatic dummy data cleanup is permanently disabled to prevent data loss. Please use verified database migrations."
  });
});

// GET /api/admin/reviews (Admin only - Get all or unapproved reviews)
router.get("/reviews", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Manager", "Admin", "Staff", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let queryRef: any = db.collection("reviews");
    if (req.query.unapprovedOnly === "true") {
      queryRef = queryRef.where("isApproved", "==", false);
    }
    const snapshot = await queryRef.get();
      
    const reviews: any[] = [];
    snapshot.forEach((doc: any) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/reviews/:id/approve (Admin only - Approve review)
router.put("/reviews/:id/approve", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Manager", "Admin", "Staff", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("reviews").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    await docRef.update({ isApproved: true });
    emitStorefrontUpdate(req, "reviews", { action: "approve", id });
    res.json({
      message: "Review approved successfully",
      review: { id, ...doc.data(), isApproved: true },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/reviews/:id (Admin only - Reject/Delete review)
router.delete("/reviews/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Manager", "Admin", "Staff", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("reviews").doc(id as string);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.delete();
    }
    emitStorefrontUpdate(req, "reviews", { action: "delete", id });
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/dashboard-stats (Admin only)
router.get("/dashboard-stats", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Total Products
    const productsSnapshot = await db.collection("products").get();
    const totalProducts = productsSnapshot.size;

    // 2. New Users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usersSnapshot = await db.collection("users").get();
    let newUsers = 0;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.createdAt && new Date(data.createdAt) >= thirtyDaysAgo) {
        newUsers++;
      }
    });

    // 3. Orders analytics (last 30 days, profits, statuses, months)
    const ordersSnapshot = await db.collection("orders").get();
    let newOrders = 0;
    let totalProfit = 0;
    let paidInvoices = 0;
    let unpaidInvoices = 0;
    const allOrders: any[] = [];

    ordersSnapshot.forEach(doc => {
      const data = doc.data() as any;
      const order = { id: doc.id, ...data };
      allOrders.push(order);

      const created = new Date(data.createdAt);
      if (created >= thirtyDaysAgo) {
        newOrders++;
      }

      if (data.orderStatus === "Delivered") {
        totalProfit += data.total || 0;
      }

      if (["Delivered", "Shipped"].includes(data.orderStatus)) {
        paidInvoices++;
      } else if (["Pending", "Processing"].includes(data.orderStatus)) {
        unpaidInvoices++;
      }
    });

    // 4. Sort and get 4 latest orders for recent buyers
    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentOrders = allOrders.slice(0, 4);

    const recentBuyers = recentOrders.map((order) => ({
      name: order.customerName,
      amount: order.total,
      tags: (order.orderItems || []).map((item: any) => ({ label: item.productName.substring(0, 10), color: "tag-cyan" })).slice(0, 2),
      img: `https://i.pravatar.cc/150?u=${order.id}`
    }));

    // 5. 12-Month Sales Data (Cyan: Revenue, Orange: Cost, Pink: Profit)
    const currentYear = new Date().getFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const salesData = months.map((month, idx) => {
      const monthOrders = allOrders.filter(o => {
        const created = new Date(o.createdAt);
        return created.getFullYear() === currentYear && created.getMonth() === idx;
      });
      const totalRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const profit = totalRevenue * 0.3; // 30% profit margin
      const cost = totalRevenue * 0.7; // 70% cost
      
      return {
        name: month,
        cyan: totalRevenue,
        orange: cost,
        pink: profit
      };
    });

    res.json({
      totalProducts,
      newUsers,
      newOrders,
      totalProfit,
      paidInvoices,
      unpaidInvoices,
      recentBuyers,
      salesData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/staff (Admin only)
router.get("/staff", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("users")
      .where("role", "in", ["SuperAdmin", "Manager", "Salesman", "Rider"])
      .get();
      
    const staff: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as any;
      staff.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt,
      });
    });
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users (SuperAdmin & Manager & Admin)
router.get("/users", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("users").get();
    const usersList: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as any;
      usersList.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role || "Customer",
        status: data.status || "Active",
        avatarUrl: data.avatarUrl || data.imageUrl || data.photoURL || data.image || null,
        points: data.points || 0,
        createdAt: data.createdAt,
      });
    });
    res.json(usersList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/staff & /api/admin/users (SuperAdmin & Manager & Admin)
router.post(["/staff", "/users"], authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, phone, role, status, avatarUrl, imageUrl, points } = req.body;
    
    // Strict Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Full Name is required." });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email Address is required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: "Phone Number is required." });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: "Password is required." });
    }
    if (password.trim().length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ error: "User Role is required." });
    }

    // Duplicate Email Check in both Prisma & Firestore mock
    const existingPrisma = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingPrisma) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    const emailQuery = await db.collection("users").where("email", "==", cleanEmail).limit(1).get();
    if (!emailQuery.empty) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    // Role Normalization (supports SUPER_ADMIN, ADMIN, STAFF, CUSTOMER, etc.)
    const normalizedRoleMap: Record<string, string> = {
      SUPER_ADMIN: "SuperAdmin",
      SUPERADMIN: "SuperAdmin",
      ADMIN: "Admin",
      STAFF: "Manager",
      MANAGER: "Manager",
      SALESMAN: "Salesman",
      CUSTOMER: "Customer",
      RIDER: "Rider",
    };
    const roleKey = (role || "").trim().toUpperCase();
    const userRole = normalizedRoleMap[roleKey] || (req.path.includes("staff") ? "Salesman" : (role.trim() || "Customer"));

    // Secure Password Hashing with bcrypt
    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const docId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=${["Admin", "SuperAdmin"].includes(userRole) ? "7c3aed" : "e63b7a"}&color=fff&bold=true`;
    const finalAvatar = avatarUrl || imageUrl || defaultAvatar;

    // 1. Save directly into Prisma User table
    await prisma.user.create({
      data: {
        id: docId,
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        phone: phone.trim(),
        role: userRole,
        status: status || "Active",
        points: Number(points || 0),
      }
    });

    // 2. Keep in-memory mock collection synced
    const docRef = db.collection("users").doc(docId);
    const userObj = {
      id: docId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      phone: phone.trim(),
      role: userRole,
      status: status || "Active",
      points: Number(points || 0),
      avatarUrl: finalAvatar,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(userObj);
    invalidatePrismaCache("users");

    res.status(201).json({
      id: docId,
      name: userObj.name,
      email: userObj.email,
      phone: userObj.phone,
      role: userObj.role,
      status: userObj.status,
      avatarUrl: userObj.avatarUrl,
      points: userObj.points,
      createdAt: userObj.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id & /api/admin/staff/:id
const handleUpdateUserOrStaff = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone, role, status, avatarUrl, imageUrl, points } = req.body;
    
    // Normalize role if provided
    let updatedRole = role;
    if (role) {
      const rKey = String(role).trim().toUpperCase();
      const rMap: Record<string, string> = {
        SUPER_ADMIN: "SuperAdmin",
        SUPERADMIN: "SuperAdmin",
        ADMIN: "Admin",
        STAFF: "Manager",
        MANAGER: "Manager",
        SALESMAN: "Salesman",
        CUSTOMER: "Customer",
        RIDER: "Rider",
      };
      updatedRole = rMap[rKey] || role;
    }

    // Find doc by ID or Email
    let docRef = db.collection("users").doc(id as string);
    let doc = await docRef.get();
    
    if (!doc.exists && email) {
      const cleanEmail = String(email).trim().toLowerCase();
      const snapshot = await db.collection("users").where("email", "==", cleanEmail).limit(1).get();
      if (!snapshot.empty) {
        docRef = snapshot.docs[0].ref;
        doc = snapshot.docs[0];
      }
    }

    // Allow user to edit their own profile OR SuperAdmin/Manager to edit any user
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role || "Customer";
    const isSelf = currentUserId === id || (doc.exists && doc.data()?.email === req.user?.email);
    const isAuthorizedRole = ["SuperAdmin", "Manager", "Admin"].includes(currentUserRole);

    if (!isSelf && !isAuthorizedRole) {
      return res.status(403).json({ error: "Access denied. You can only update your own account." });
    }

    const userData = doc.exists ? (doc.data() as any) : {};

    // Prevent removing the last SuperAdmin
    if (updatedRole && updatedRole !== "SuperAdmin" && userData.role === "SuperAdmin") {
      const superAdminsSnapshot = await db.collection("users").where("role", "==", "SuperAdmin").get();
      if (superAdminsSnapshot.size <= 1) {
        return res.status(400).json({ error: "Cannot change role of the last SuperAdmin." });
      }
    }

    const updatePayload: any = {
      updatedAt: new Date().toISOString()
    };
    if (name) updatePayload.name = name.trim();
    if (email) updatePayload.email = email.trim().toLowerCase();
    if (phone !== undefined) updatePayload.phone = phone ? String(phone).trim() : null;
    if (updatedRole && isAuthorizedRole) updatePayload.role = updatedRole;
    if (status && isAuthorizedRole) updatePayload.status = status;
    if (points !== undefined) updatePayload.points = Number(points);
    if (avatarUrl || imageUrl) updatePayload.avatarUrl = avatarUrl || imageUrl;
    if (password && password.trim().length > 0) {
      updatePayload.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // Update in Prisma User table
    try {
      const prismaUpdateData: any = {};
      if (updatePayload.name) prismaUpdateData.name = updatePayload.name;
      if (updatePayload.email) prismaUpdateData.email = updatePayload.email;
      if (updatePayload.phone !== undefined) prismaUpdateData.phone = updatePayload.phone;
      if (updatePayload.role) prismaUpdateData.role = updatePayload.role;
      if (updatePayload.status) prismaUpdateData.status = updatePayload.status;
      if (updatePayload.points !== undefined) prismaUpdateData.points = updatePayload.points;
      if (updatePayload.passwordHash) prismaUpdateData.passwordHash = updatePayload.passwordHash;

      await prisma.user.upsert({
        where: { id: docRef.id },
        update: prismaUpdateData,
        create: {
          id: docRef.id,
          name: updatePayload.name || "User",
          email: updatePayload.email || `user_${docRef.id}@glowgoodly.com`,
          passwordHash: updatePayload.passwordHash || "default_hash",
          phone: updatePayload.phone || null,
          role: updatePayload.role || "Customer",
          status: updatePayload.status || "Active",
          points: updatePayload.points || 0,
        }
      });
      invalidatePrismaCache("users");
    } catch (pErr) {
      console.warn("Prisma user direct update fallback note:", pErr);
    }

    if (doc.exists) {
      await docRef.update(updatePayload);
    } else {
      updatePayload.id = id;
      updatePayload.createdAt = new Date().toISOString();
      updatePayload.role = updatedRole || "SuperAdmin";
      updatePayload.status = status || "Active";
      await docRef.set(updatePayload);
    }

    res.json({ id: docRef.id, message: "User updated successfully!", ...userData, ...updatePayload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

router.put("/staff/:id", authenticateJWT as any, handleUpdateUserOrStaff as any);
router.put("/users/:id", authenticateJWT as any, handleUpdateUserOrStaff as any);
router.patch("/users/:id", authenticateJWT as any, handleUpdateUserOrStaff as any);

// DELETE /api/admin/staff/:id & /api/admin/users/:id (SuperAdmin & Admin)
router.delete(["/staff/:id", "/users/:id"], authenticateJWT as any, requireRole(["SuperAdmin", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === "admin-master" || id === "local-superadmin") {
      return res.status(400).json({ error: "Master SuperAdmin account cannot be deleted." });
    }
    const docRef = db.collection("users").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = doc.data() as any;
    if (userData.role === "SuperAdmin") {
      const superAdminsSnapshot = await db.collection("users").where("role", "==", "SuperAdmin").get();
      if (superAdminsSnapshot.size <= 1) {
        return res.status(400).json({ error: "Cannot delete the last SuperAdmin account." });
      }
    }

    // Safely delete in Prisma (cascade/nullify)
    try {
      await prisma.user.deleteMany({ where: { id: String(id) } });
    } catch (pErr) {
      console.warn("Prisma user delete fallback note:", pErr);
    }

    await docRef.delete();
    invalidatePrismaCache("users");
    res.json({ success: true, id, message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/customers (Fraud Tracking)
router.get("/customers", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersSnapshot = await db.collection("users").where("role", "==", "Customer").get();
    const ordersSnapshot = await db.collection("orders").get();

    // Map: customerId -> list of orders
    const customerOrders = new Map<string, any[]>();
    ordersSnapshot.forEach(doc => {
      const o = doc.data() as any;
      if (o.customerId) {
        let list = customerOrders.get(o.customerId) || [];
        list.push(o);
        customerOrders.set(o.customerId, list);
      }
    });

    const enrichedCustomers: any[] = [];
    usersSnapshot.forEach(doc => {
      const c = doc.data() as any;
      const orders = customerOrders.get(doc.id) || [];

      const totalOrders = orders.length;
      const totalSpent = orders.filter(o => o.orderStatus === "Delivered" || o.orderStatus === "Shipped").reduce((sum, o) => sum + (o.total || 0), 0);
      const incompleteOrders = orders.filter(o => ["Pending", "Cancelled", "Failed"].includes(o.orderStatus)).length;
      
      let fraudRisk = "Low";
      if (incompleteOrders > 3 && totalOrders > 0 && incompleteOrders / totalOrders > 0.5) fraudRisk = "High";
      else if (incompleteOrders > 1) fraudRisk = "Medium";
      if (c.status === "Fraud") fraudRisk = "Banned";

      enrichedCustomers.push({
        id: doc.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        totalOrders,
        totalSpent,
        incompleteOrders,
        fraudRisk,
        createdAt: c.createdAt
      });
    });

    res.json(enrichedCustomers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/customers/:id/status
router.put("/customers/:id/status", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const docRef = db.collection("users").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await docRef.update({ status, updatedAt: new Date().toISOString() });
    res.json({ id, ...doc.data(), status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// GET /api/admin/inventory
router.get("/inventory", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productsSnapshot = await db.collection("products").get();
    const inventoryLogsSnapshot = await db.collection("inventoryLogs").get();

    // Map: variantId -> logs list
    const logsMap = new Map<string, any[]>();
    inventoryLogsSnapshot.forEach(doc => {
      const data = doc.data() as any;
      let logs = logsMap.get(data.variantId) || [];
      logs.push({ id: doc.id, ...data });
      logsMap.set(data.variantId, logs);
    });

    const inventoryList: any[] = [];
    productsSnapshot.forEach(doc => {
      const p = doc.data() as any;
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach((v: any) => {
          const logs = logsMap.get(v.id) || [];
          logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          inventoryList.push({
            id: v.id,
            name: v.name,
            sku: v.sku,
            stock: v.stock,
            price: v.price,
            discountPrice: v.discountPrice,
            product: { name: p.name },
            productId: doc.id,
            inventoryLogs: logs.slice(0, 5)
          });
        });
      }
    });

    inventoryList.sort((a, b) => a.stock - b.stock);
    res.json(inventoryList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/inventory/adjust
router.post("/inventory/adjust", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { variantId, quantity, reason } = req.body;
    if (!variantId || quantity === undefined || !reason) {
      res.status(400).json({ error: "variantId, quantity, and reason are required" });
      return;
    }

    // Search product doc in products collection that contains the variantId
    const snapshot = await db.collection("products").get();
    let targetDocRef: any = null;
    let targetProductData: any = null;
    let targetVariantIndex = -1;

    snapshot.forEach(doc => {
      const data = doc.data() as any;
      if (data.variants && Array.isArray(data.variants)) {
        const vIdx = data.variants.findIndex((v: any) => v.id === variantId);
        if (vIdx > -1) {
          targetDocRef = doc.ref;
          targetProductData = data;
          targetVariantIndex = vIdx;
        }
      }
    });

    if (!targetDocRef) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    const currentVariant = targetProductData.variants[targetVariantIndex];
    const newStock = Math.max(0, currentVariant.stock + Number(quantity));

    // Update variant stock in array
    targetProductData.variants[targetVariantIndex].stock = newStock;
    await targetDocRef.update({
      variants: targetProductData.variants,
      updatedAt: new Date().toISOString()
    });

    // Create inventory log doc
    const logRef = db.collection("inventoryLogs").doc();
    const log = {
      variantId,
      quantity: Number(quantity),
      reason,
      userId: req.user?.id || null,
      createdAt: new Date().toISOString(),
    };
    await logRef.set(log);

    res.json({ id: variantId, ...currentVariant, stock: newStock });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/vendors
router.get("/vendors", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("vendors").get();
    const vendors: any[] = [];
    snapshot.forEach(doc => {
      vendors.push({ id: doc.id, ...doc.data() });
    });
    vendors.sort((a, b) => a.name.localeCompare(b.name));
    res.json(vendors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/vendors
router.post("/vendors", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, contactName, email, phone, address, status } = req.body;
    if (!name) {
      res.status(400).json({ error: "Vendor name is required" });
      return;
    }

    const docRef = db.collection("vendors").doc();
    const vendor = {
      name,
      contactName: contactName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      status: status || "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(vendor);
    res.status(201).json({ id: docRef.id, ...vendor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/vendors/:id
router.put("/vendors/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactName, email, phone, address, status } = req.body;
    
    const docRef = db.collection("vendors").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const updated = {
      ...doc.data(),
      name: name !== undefined ? name : (doc.data() as any).name,
      contactName: contactName !== undefined ? contactName : (doc.data() as any).contactName,
      email: email !== undefined ? email : (doc.data() as any).email,
      phone: phone !== undefined ? phone : (doc.data() as any).phone,
      address: address !== undefined ? address : (doc.data() as any).address,
      status: status !== undefined ? status : (doc.data() as any).status,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updated);
    res.json({ id, ...updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/vendors/:id
router.delete("/vendors/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("vendors").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    await docRef.delete();
    res.json({ success: true, message: "Vendor deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/coupons
router.get("/coupons", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("coupons").get();
    const coupons: any[] = [];
    snapshot.forEach(doc => {
      coupons.push({ id: doc.id, ...doc.data() });
    });
    coupons.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/coupons
router.post("/coupons", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, title, description, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit, tiers, isActive } = req.body;
    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      res.status(400).json({ error: "code, discountType, discountValue, and expiryDate are required" });
      return;
    }

    const docId = code.trim().toUpperCase();
    const docRef = db.collection("coupons").doc(docId);
    const doc = await docRef.get();
    if (doc.exists) {
      return res.status(400).json({ error: "Coupon code already exists." });
    }

    const coupon = {
      code: docId,
      title: title || `${docId} Offer`,
      description: description || "",
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue !== undefined && minOrderValue !== "" ? Number(minOrderValue) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiryDate: new Date(expiryDate).toISOString(),
      usageLimit: usageLimit ? Number(usageLimit) : 1,
      timesUsed: 0,
      tiers: Array.isArray(tiers) ? tiers.map((t: any) => ({ minSpend: Number(t.minSpend), discount: Number(t.discount) })) : [],
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(coupon);
    res.status(201).json({ id: docId, ...coupon });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/admin/coupons/:id
router.put("/coupons/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit, tiers, isActive } = req.body;
    
    const docRef = db.collection("coupons").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const existing = doc.data() as any;
    const updated = {
      ...existing,
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      discountType: discountType || existing.discountType,
      discountValue: discountValue !== undefined ? Number(discountValue) : existing.discountValue,
      minOrderValue: minOrderValue !== undefined ? Number(minOrderValue) : existing.minOrderValue,
      maxDiscount: maxDiscount !== undefined ? (maxDiscount ? Number(maxDiscount) : null) : existing.maxDiscount,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : existing.expiryDate,
      usageLimit: usageLimit !== undefined ? Number(usageLimit) : existing.usageLimit,
      tiers: Array.isArray(tiers) ? tiers.map((t: any) => ({ minSpend: Number(t.minSpend), discount: Number(t.discount) })) : existing.tiers || [],
      isActive: isActive !== undefined ? Boolean(isActive) : (existing.isActive !== false),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updated);
    res.json({ id, ...updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/coupons/:id/toggle
router.patch("/coupons/:id/toggle", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("coupons").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const existing = doc.data() as any;
    const newStatus = !existing.isActive;
    await docRef.update({ isActive: newStatus, updatedAt: new Date().toISOString() });
    res.json({ success: true, id, isActive: newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/coupons/:id
router.delete("/coupons/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("coupons").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    await docRef.delete();
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/categories/:id/image
router.put("/categories/:id/image", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    
    const docRef = db.collection("categories").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Category not found" });
    }

    await docRef.update({ imageUrl, updatedAt: new Date().toISOString() });
    res.json({ id, ...doc.data(), imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/brands/:id/logo
router.put("/brands/:id/logo", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { logoUrl } = req.body;

    const docRef = db.collection("brands").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Brand not found" });
    }

    await docRef.update({ logoUrl, updatedAt: new Date().toISOString() });
    res.json({ id, ...doc.data(), logoUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/contact OR /api/contact (Public contact submission)
router.post("/contact", async (req: any, res: any) => {
  try {
    const { name, phone, email, message } = req.body || {};
    if (!name || !phone || !message) {
      return res.status(400).json({ error: "Name, phone number, and message are required" });
    }

    const docRef = db.collection("contact_messages").doc();
    const contactData = {
      id: docRef.id,
      name,
      phone,
      email: email || "",
      message,
      createdAt: new Date().toISOString(),
    };

    await docRef.set(contactData);
    res.status(201).json({ message: "Contact message received successfully", data: contactData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/contact-messages (Admin - View all contact messages)
router.get("/contact-messages", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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

// DELETE /api/admin/contact-messages/:id (Admin - Delete contact message)
router.delete("/contact-messages/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("contact_messages").doc(id as string);
    await docRef.delete();
    res.json({ message: "Deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/categories (Admin - View all categories with popup images)
router.get("/categories", async (req: any, res: any) => {
  try {
    const snapshot = await db.collection("categories").get();
    const categories: any[] = [];
    snapshot.forEach(doc => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    let result = categories;
    if (result.length === 0) {
      result = MASTER_CATEGORIES_DATA;
    } else {
      MASTER_CATEGORIES_DATA.forEach(mc => {
        if (!result.some(r => r.id === mc.id || r.slug === mc.slug || r.name.toLowerCase() === mc.name.toLowerCase())) {
          result.push(mc);
        }
      });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/categories/:id (Admin - Update category popup images and details)
router.put("/categories/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { popupImage1, popupImage2, name, description } = req.body;

    const docRef = db.collection("categories").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Category not found" });
    }

    const updateData: any = {};
    if (popupImage1 !== undefined) updateData.popupImage1 = popupImage1;
    if (popupImage2 !== undefined) updateData.popupImage2 = popupImage2;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await docRef.update(updateData);
    res.json({ message: "Category updated successfully", category: { id, ...doc.data(), ...updateData } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// GET /api/admin/blogs
router.get("/blogs", async (req: any, res: any) => {
  try {
    const snapshot = await db.collection("blogs").get();
    const blogs: any[] = [];
    snapshot.forEach(doc => {
      blogs.push({ id: doc.id, ...doc.data() });
    });
    res.json(blogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/blogs
router.post("/blogs", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { id, title, description, imageUrl } = req.body || {};
    if (!title) return res.status(400).json({ error: "Title is required" });
    const docId = id || db.collection("blogs").doc().id;
    const docRef = db.collection("blogs").doc(docId);
    const data = {
      id: docId,
      title,
      description: description || "",
      imageUrl: imageUrl || "/placeholder-product.svg",
      createdAt: new Date().toISOString()
    };
    await docRef.set(data, { merge: true });
    res.json({ message: "Blog saved successfully", blog: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/blogs/:id
router.delete("/blogs/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await db.collection("blogs").doc(id).delete();
    res.json({ message: "Blog deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/brands
router.get("/brands", async (req: any, res: any) => {
  try {
    const snapshot = await db.collection("brands").get();
    const brands: any[] = [];
    snapshot.forEach(doc => {
      brands.push({ id: doc.id, ...doc.data() });
    });
    let result = brands;
    if (result.length === 0) {
      result = MASTER_BRANDS_DATA;
    } else {
      MASTER_BRANDS_DATA.forEach(mb => {
        if (!result.some(b => b.id === mb.id || b.slug === mb.slug || b.name.toLowerCase() === mb.name.toLowerCase())) {
          result.push(mb);
        }
      });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/brands (Add/Update Brand with image upload support)
router.post("/brands", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { id, name, logoUrl, originCountry } = req.body || {};
    if (!name) return res.status(400).json({ error: "Brand name is required" });
    const docId = id || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const cleanSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const docRef = db.collection("brands").doc(docId);
    const existingDoc = await docRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    
    const data = {
      ...existingData,
      id: docId,
      name,
      slug: cleanSlug,
      originCountry: originCountry !== undefined ? originCountry : (existingData?.originCountry || "International"),
      logoUrl: logoUrl || existingData?.logoUrl || "/placeholder-product.svg",
      isFeatured: true,
      updatedAt: new Date().toISOString()
    };
    await docRef.set(data, { merge: true });

    // Sync permanently to Prisma ORM
    try {
      await prisma.brand.upsert({
        where: { id: docId },
        create: {
          id: docId,
          name,
          slug: cleanSlug,
          logoUrl: data.logoUrl,
          originCountry: data.originCountry,
          isFeatured: true
        },
        update: {
          name,
          slug: cleanSlug,
          logoUrl: data.logoUrl,
          originCountry: data.originCountry,
          isFeatured: true
        }
      });
    } catch (pe) {
      console.warn("Prisma brand sync in admin.ts fallback:", pe);
    }

    clearProductsCache();
    invalidatePrismaCache("brands");
    res.json({ message: "Brand saved successfully", brand: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT & PATCH /api/admin/brands/:id (Update brand image/name/originCountry)
const handleUpdateBrand = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, logoUrl, originCountry } = req.body || {};
    const docRef = db.collection("brands").doc(id);
    const existingDoc = await docRef.get();
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (originCountry !== undefined) updateData.originCountry = originCountry;
    
    await docRef.set(updateData, { merge: true });

    // Sync permanently to Prisma ORM
    try {
      await prisma.brand.upsert({
        where: { id },
        create: {
          id,
          name: name || id,
          slug: updateData.slug || id.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          logoUrl: logoUrl || "/placeholder-product.svg",
          originCountry: originCountry || "International",
          isFeatured: true
        },
        update: {
          ...(name && { name, slug: updateData.slug }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(originCountry !== undefined && { originCountry })
        }
      });
    } catch (_) {}

    clearProductsCache();
    invalidatePrismaCache("brands");
    const updated = existingDoc.exists ? { id, ...existingDoc.data(), ...updateData } : { id, ...updateData };
    res.json({ message: "Brand updated successfully", brand: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
router.put("/brands/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleUpdateBrand);
router.patch("/brands/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, handleUpdateBrand);

// DELETE /api/admin/brands/:id
router.delete("/brands/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await db.collection("brands").doc(id).delete();
    try {
      await prisma.brand.delete({ where: { id } }).catch(() => null);
    } catch (_) {}
    clearProductsCache();
    invalidatePrismaCache("brands");
    res.json({ message: "Brand deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/products/:id — Admin: update product name, description, images, categories
router.patch("/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, brandId, categoryId, subcategoryId, metaTitle, metaDescription, metaKeywords, campaignName, imageUrl, imageUrl2, imageUrl3, imageUrl4, price, discountPrice, costPrice, stock } = req.body;

    const docRef = db.collection("products").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const current = doc.data() as any;
    const updateData: any = { updatedAt: new Date().toISOString() };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
    if (campaignName !== undefined) updateData.campaignName = campaignName;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    if (req.body.inStock !== undefined) updateData.inStock = Boolean(req.body.inStock);

    if (brandId !== undefined) {
      const resolvedBrand = await resolveBrand(brandId);
      updateData.brandId = resolvedBrand.brandId || brandId;
      updateData.brand = resolvedBrand.brand;
    }

    if (categoryId !== undefined || subcategoryId !== undefined) {
      const targetCat = categoryId !== undefined ? categoryId : current.categoryId;
      const targetSub = subcategoryId !== undefined ? subcategoryId : current.subcategoryId;
      const resolvedCat = await resolveCategory(targetCat, targetSub);
      updateData.categoryId = resolvedCat.categoryId || targetCat;
      updateData.subcategoryId = resolvedCat.subcategoryId || targetSub || null;
      updateData.category = resolvedCat.category;
      updateData.subcategory = resolvedCat.subcategory;
    }

    const numPrice = price !== undefined && price !== null && !isNaN(Number(price)) ? Number(price) : current.price;
    const numCostPrice = costPrice !== undefined && costPrice !== null && !isNaN(Number(costPrice)) ? Number(costPrice) : current.costPrice;
    const numDiscountPrice = discountPrice !== undefined && discountPrice !== null && !isNaN(Number(discountPrice)) ? Number(discountPrice) : current.discountPrice;
    const numStock = stock !== undefined && stock !== null && !isNaN(Number(stock)) ? Number(stock) : current.stock;

    if (price !== undefined) updateData.price = numPrice;
    if (costPrice !== undefined) updateData.costPrice = numCostPrice;
    if (discountPrice !== undefined) updateData.discountPrice = numDiscountPrice;
    if (stock !== undefined) updateData.stock = numStock;

    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (imageUrl2 !== undefined) updateData.imageUrl2 = imageUrl2;
    if (imageUrl3 !== undefined) updateData.imageUrl3 = imageUrl3;
    if (imageUrl4 !== undefined) updateData.imageUrl4 = imageUrl4;

    // Update variants (including per-shade/variant images)
    if (req.body.variants && Array.isArray(req.body.variants)) {
      const mappedVars = req.body.variants.map((v: any, idx: number) => ({
        id: v.id || `var-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        name: v.name || "Default",
        price: (idx === 0 && price !== undefined) ? numPrice : (v.price !== undefined && v.price !== null && !isNaN(Number(v.price)) ? parseFloat(v.price) : (numPrice || 0)),
        discountPrice: (idx === 0 && discountPrice !== undefined) ? numDiscountPrice : (v.discountPrice ? parseFloat(v.discountPrice) : null),
        costPrice: (idx === 0 && costPrice !== undefined) ? numCostPrice : (v.costPrice ? parseFloat(v.costPrice) : null),
        stock: (idx === 0 && stock !== undefined) ? numStock : (v.stock !== undefined && v.stock !== null && !isNaN(Number(v.stock)) ? parseInt(v.stock) : (numStock || 50)),
        shadeColor: v.shadeColor || null,
        sizeValue: v.sizeValue || null,
        imageUrl: v.imageUrl || null,
        sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }));
      updateData.variants = mappedVars;

      // Rebuild product images list strictly from main cover & active variants
      const newImagesList: any[] = [];
      const primaryUrl = req.body.imageUrl || current.imageUrl || current.images?.[0]?.url;
      if (primaryUrl) {
        newImagesList.push({ id: `img-primary-${id}`, url: primaryUrl, isPrimary: true });
      }
      const finalImg2 = imageUrl2 !== undefined ? imageUrl2 : current.imageUrl2;
      if (finalImg2) newImagesList.push({ id: `img-2-${id}`, url: finalImg2, isPrimary: false });
      const finalImg3 = imageUrl3 !== undefined ? imageUrl3 : current.imageUrl3;
      if (finalImg3) newImagesList.push({ id: `img-3-${id}`, url: finalImg3, isPrimary: false });
      const finalImg4 = imageUrl4 !== undefined ? imageUrl4 : current.imageUrl4;
      if (finalImg4) newImagesList.push({ id: `img-4-${id}`, url: finalImg4, isPrimary: false });

      mappedVars.forEach((v: any, idx: number) => {
        if (v.imageUrl && v.imageUrl.trim() !== "" && !newImagesList.some(img => img.url === v.imageUrl)) {
          newImagesList.push({ id: `img-var-${v.id || idx}`, url: v.imageUrl, isPrimary: false });
        }
      });
      updateData.images = newImagesList;
    } else if (price !== undefined || discountPrice !== undefined || costPrice !== undefined || stock !== undefined) {
      const variants = current.variants || [];
      if (variants.length > 0) {
        if (price !== undefined) variants[0].price = numPrice;
        if (discountPrice !== undefined) variants[0].discountPrice = numDiscountPrice;
        if (costPrice !== undefined) variants[0].costPrice = numCostPrice;
        if (stock !== undefined) variants[0].stock = numStock;
        updateData.variants = variants;
      }
    }

    await docRef.update(updateData);

    // Sync with Prisma
    try {
      await prisma.product.upsert({
        where: { id: String(id) },
        create: {
          id: String(id),
          name: updateData.name || current.name,
          slug: current.slug,
          description: updateData.description !== undefined ? updateData.description : current.description,
          price: updateData.price !== undefined ? updateData.price : current.price,
          discountPrice: updateData.discountPrice !== undefined ? updateData.discountPrice : current.discountPrice,
          stock: updateData.stock !== undefined ? updateData.stock : current.stock,
          imageUrl: updateData.imageUrl || current.imageUrl,
          brandId: updateData.brandId || current.brandId,
          categoryId: updateData.categoryId || current.categoryId,
          status: updateData.status || current.status || "Active"
        },
        update: {
          name: updateData.name || current.name,
          description: updateData.description !== undefined ? updateData.description : current.description,
          price: updateData.price !== undefined ? updateData.price : current.price,
          discountPrice: updateData.discountPrice !== undefined ? updateData.discountPrice : current.discountPrice,
          stock: updateData.stock !== undefined ? updateData.stock : current.stock,
          imageUrl: updateData.imageUrl || current.imageUrl,
          brandId: updateData.brandId || current.brandId,
          categoryId: updateData.categoryId || current.categoryId,
          status: updateData.status || current.status || "Active"
        }
      }).catch(() => null);
    } catch (_) {}
    clearProductsCache(); // Clear backend in-memory products cache immediately!
    invalidatePrismaCache("products");
    try {
      const io = (req.app as any)?.get("io");
      if (io) {
        io.emit("content_updated", { type: "products", id });
        io.emit("data_sync", { type: "products", id });
      }
    } catch (_) {}
    emitStorefrontUpdate(req, "products", { action: "patch", id });
    res.json({ id, ...current, ...updateData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// POST /api/admin/courier/carrybee/issue-token
router.post("/courier/carrybee/issue-token", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { client_id, client_secret, username, password, base_url } = req.body;
    const baseUrl = (base_url || "https://api.carrybee.com").replace(/\/$/, "");
    const targetUrl = `${baseUrl}/aladdin/api/v1/issue-token`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: client_id || "",
        client_secret: client_secret || "",
        grant_type: "password",
        username: username || "",
        password: password || ""
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to issue CarryBee token" });
  }
});

// POST /api/admin/courier/pathao/test
router.post("/courier/pathao/test", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { client_id, client_secret, username, password, base_url } = req.body;
    const baseUrl = (base_url || "https://api-hermes.pathao.com").replace(/\/$/, "");
    const targetUrl = `${baseUrl}/aladdin/api/v1/issue-token`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GlowGoodly/1.0"
      },
      body: JSON.stringify({
        client_id: client_id || "",
        client_secret: client_secret || "",
        grant_type: "password",
        username: username || "",
        password: password || ""
      })
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { message: text || "Pathao server returned an empty or non-JSON response. Please verify Client ID & Secret." };
    }
    res.status(response.status || 200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to connect to Pathao API" });
  }
});

// POST /api/admin/courier/steadfast/test
router.post("/courier/steadfast/test", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { api_key, secret_key, base_url } = req.body;
    const baseUrl = (base_url || "https://portal.packzy.com/api/v1").replace(/\/$/, "");
    const targetUrl = `${baseUrl}/get_balance`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Api-Key": api_key || "",
        "Secret-Key": secret_key || "",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to connect to Steadfast API" });
  }
});

// POST /api/admin/courier/redx/test
router.post("/courier/redx/test", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { access_token, base_url } = req.body;
    const baseUrl = (base_url || "https://openapi.redx.com.bd/v1.0.0").replace(/\/$/, "");
    const targetUrl = `${baseUrl}/stores`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "API-ACCESS-TOKEN": access_token?.startsWith("Bearer ") ? access_token : `Bearer ${access_token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to connect to REDX API" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/orders/:id/send-courier — Dispatch order to Courier & update tracking
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  ["/orders/:id/send-courier", "/api/admin/orders/:id/send-courier"],
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = String(req.params.id || "");
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }

      // Find order in Prisma or db
      let order: any = await prisma.order.findFirst({
        where: {
          OR: [
            { id: orderId },
            { orderNumber: orderId }
          ]
        },
        include: { orderItems: true }
      });

      if (!order) {
        const doc = await db.collection("orders").doc(orderId).get();
        if (doc.exists) {
          order = { id: doc.id, ...doc.data() } as any;
        }
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const courierApiUrl = (process.env.COURIER_API_URL || "https://portal.steadfast.com.bd/api/v1").replace(/\/$/, "");
      const courierApiKey = process.env.COURIER_API_KEY || "";
      const courierSecretKey = process.env.COURIER_SECRET_KEY || "";

      // COD calculation: 0 if payment is already PAID (e.g. via bKash / Card), or total amount if COD
      const isPaid = (order.paymentStatus || "").toUpperCase().includes("PAID");
      const codAmount = isPaid ? 0 : Math.round(Number(order.total || 0));

      let trackingCode = `STDF-${Math.floor(1000000 + Math.random() * 9000000)}`;
      let consignmentId = `CN-${Date.now()}`;
      let courierResponseText = "";

      if (courierApiKey && courierSecretKey) {
        try {
          const courierRes = await fetch(`${courierApiUrl}/create_order`, {
            method: "POST",
            headers: {
              "Api-Key": courierApiKey,
              "Secret-Key": courierSecretKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              invoice: order.orderNumber,
              recipient_name: order.customerName,
              recipient_phone: order.customerPhone,
              recipient_address: order.address,
              cod_amount: codAmount,
              note: order.notes || "GlowGoodly Cosmetics & Skincare"
            })
          });

          const resData = await courierRes.json();
          courierResponseText = JSON.stringify(resData);
          if (resData.status === 200 && resData.consignment) {
            trackingCode = resData.consignment.tracking_code || trackingCode;
            consignmentId = String(resData.consignment.consignment_id || consignmentId);
          }
        } catch (apiErr: any) {
          console.warn("Live courier API failed, falling back to mock booking:", apiErr.message);
          courierResponseText = apiErr.message;
        }
      } else {
        courierResponseText = "Mock Courier Dispatch (Set COURIER_API_KEY & COURIER_SECRET_KEY in .env for live API)";
      }

      const trackingLink = `https://steadfast.com.bd/t/${trackingCode}`;

      // Update Order in Prisma
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "Shipped",
          courierTrackingId: trackingCode,
          courierConsignmentId: consignmentId,
          courierName: "Steadfast Courier",
          courierResponse: courierResponseText,
          trackingLink: trackingLink,
        }
      });

      // Also sync to db collection
      try {
        await db.collection("orders").doc(order.id).update({
          orderStatus: "Shipped",
          courierTrackingId: trackingCode,
          courierConsignmentId: consignmentId,
          courierName: "Steadfast Courier",
          trackingLink: trackingLink,
          updatedAt: new Date().toISOString()
        });
      } catch (_) {}

      // Emit real-time socket event
      const io = req.app.get("io");
      if (io) {
        io.emit("order_updated", {
          id: order.id,
          orderStatus: "Shipped",
          courierTrackingId: trackingCode,
          trackingLink: trackingLink
        });
      }

      res.json({
        message: "Order successfully submitted to courier and marked as Shipped!",
        trackingCode,
        consignmentId,
        trackingLink,
        courierName: "Steadfast Courier",
        order: updatedOrder
      });
    } catch (error: any) {
      console.error("Failed to send order to courier:", error);
      res.status(500).json({ error: error.message || "Failed to dispatch order to courier" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/clear-cache — Clear all in-memory, DB, and frontend sync caches
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  ["/clear-cache", "/api/admin/clear-cache"],
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 1. Purge memory caches
      clearProductsCache();
      invalidateHeroBannersCache();
      invalidateBannersCache();
      invalidatePrismaCache("products");
      invalidatePrismaCache("categories");
      invalidatePrismaCache("brands");
      invalidatePrismaCache("banners");
      invalidatePrismaCache("hero_banners");

      const timestamp = Date.now().toString();

      // 2. Persist CACHE_VERSION in DB setting
      try {
        await prisma.setting.upsert({
          where: { key: "CACHE_VERSION" },
          update: { value: timestamp },
          create: { key: "CACHE_VERSION", value: timestamp }
        });
      } catch (_) {}

      try {
        await db.collection("settings").doc("CACHE_VERSION").set({
          value: timestamp,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (_) {}

      // 3. Emit real-time Socket.io events
      try {
        const io = (req.app as any)?.get("io");
        if (io) {
          emitStorefrontUpdate(req, "all", { action: "cache_cleared", timestamp });
        io.emit("cache_cleared", { timestamp });
          io.emit("content_updated", { type: "all", timestamp });
          io.emit("data_sync", { type: "all", timestamp });
        }
      } catch (_) {}

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.json({
        success: true,
        message: "All website & server cache successfully cleared!",
        timestamp: Number(timestamp)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to clear cache" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users/bulk-delete — Bulk Delete Users / Staff
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  ["/users/bulk-delete", "/api/admin/users/bulk-delete"],
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Admin"]) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: "Please provide an array of user IDs to delete" });
      }

      const protectedEmails = ["admin@glowgoodly.com", "support@glowgoodly.com"];
      const currentUserId = req.user?.id;

      let deletedCount = 0;
      for (const rawId of ids) {
        const id = String(rawId);
        if (currentUserId && id === currentUserId) continue; // Do not delete own account

        try {
          const targetUser = await prisma.user.findUnique({ where: { id } }).catch(() => null);
          if (targetUser && protectedEmails.includes(targetUser.email.toLowerCase())) {
            continue; // Skip master admin accounts
          }

          if (targetUser?.avatar) deleteUploadedFile(targetUser.avatar);

          await prisma.user.delete({ where: { id } }).catch(() => null);
          await db.collection("users").doc(id).delete().catch(() => null);
          deletedCount++;
        } catch (itemErr) {
          console.warn(`Failed to delete user ${id}:`, itemErr);
        }
      }

      res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} user(s)`,
        count: deletedCount
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to bulk delete users" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/contact-messages/bulk-delete — Bulk Delete Messages
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  ["/contact-messages/bulk-delete", "/messages/bulk-delete", "/api/admin/contact-messages/bulk-delete"],
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Admin"]) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: "Please provide an array of message IDs to delete" });
      }

      let deletedCount = 0;
      for (const id of ids) {
        try {
          await db.collection("contact_messages").doc(String(id)).delete().catch(() => null);
          deletedCount++;
        } catch (_) {}
      }

      res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} message(s)`,
        count: deletedCount
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to bulk delete messages" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/coupons/bulk-delete — Bulk Delete Coupons / Offers
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  ["/coupons/bulk-delete", "/offers/bulk-delete", "/api/admin/coupons/bulk-delete"],
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Admin"]) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: "Please provide an array of coupon IDs to delete" });
      }

      let deletedCount = 0;
      for (const id of ids) {
        try {
          await prisma.coupon.delete({ where: { id: String(id) } }).catch(() => null);
          await db.collection("coupons").doc(String(id)).delete().catch(() => null);
          deletedCount++;
        } catch (_) {}
      }

      res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} coupon(s)`,
        count: deletedCount
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to bulk delete coupons" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/sales-report — Sales Report with Shade / Variant Name & Notes
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  ["/sales-report", "/api/admin/sales-report"],
  authenticateJWT as any,
  requireRole(["SuperAdmin", "Manager", "Salesman", "Admin"]) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const items = await prisma.orderItem.findMany({
        include: {
          order: true,
          variant: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, note: true }
              }
            }
          }
        },
        orderBy: {
          id: "desc"
        }
      });

      let totalRevenue = 0;
      let totalUnits = 0;

      const report = items.map((item) => {
        const shadeName = item.variant?.name || item.variantName || "-";
        const shadeColor = item.variant?.shadeColor || null;
        const itemNote = item.note || "-";
        const orderNote = item.order?.notes || "-";
        const inventoryNote = item.variant?.product?.note || "-";

        totalRevenue += item.total || 0;
        totalUnits += item.quantity || 0;

        return {
          id: item.id,
          orderId: item.orderId,
          orderNumber: item.order?.orderNumber || `ORD-${item.orderId.slice(0, 8)}`,
          date: item.order?.createdAt || new Date(),
          customerName: item.order?.customerName || "-",
          customerPhone: item.order?.customerPhone || "-",
          productName: item.productName || item.variant?.product?.name || "-",
          variantName: shadeName,
          shadeName: shadeName,
          shadeColor: shadeColor,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          paymentMethod: item.order?.paymentMethod || "COD",
          paymentStatus: item.order?.paymentStatus || "Pending",
          orderStatus: item.order?.orderStatus || "Pending",
          itemNote: itemNote,
          orderNote: orderNote,
          inventoryNote: inventoryNote,
          note: [itemNote !== "-" ? itemNote : null, inventoryNote !== "-" ? `Inv: ${inventoryNote}` : null].filter(Boolean).join(" | ") || orderNote
        };
      });

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.json({
        success: true,
        report,
        summary: {
          totalRevenue,
          totalUnits,
          totalOrders: new Set(items.map((i) => i.orderId)).size,
          itemCount: report.length
        }
      });
    } catch (err: any) {
      console.error("Sales report error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate sales report" });
    }
  }
);

export default router;


import { Router, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import bcrypt from "bcryptjs";
import { sendWelcomeUserEmail } from "../mailer";
import { clearProductsCache } from "./products";

const router = Router();

// GET /api/admin/reviews (Admin only - Get unapproved reviews)
router.get("/reviews", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("reviews")
      .where("isApproved", "==", false)
      .get();
      
    const reviews: any[] = [];
    snapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/reviews/:id/approve (Admin only - Approve review)
router.put("/reviews/:id/approve", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("reviews").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    await docRef.update({ isApproved: true });
    res.json({
      message: "Review approved successfully",
      review: { id, ...doc.data(), isApproved: true },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/dashboard-stats (Admin only)
router.get("/dashboard-stats", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.get("/staff", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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

// POST /api/admin/staff (SuperAdmin & Manager)
router.post("/staff", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, phone, role, status, avatarUrl, imageUrl } = req.body;
    
    const emailQuery = await db.collection("users").where("email", "==", email).limit(1).get();
    if (!emailQuery.empty) {
      return res.status(400).json({ error: "Failed to create staff. Email already exists." });
    }

    const passwordHash = await bcrypt.hash(password || "glow123456", 10);
    const docRef = db.collection("users").doc();
    const staffObj = {
      name,
      email,
      passwordHash,
      phone: phone || null,
      role: role || "Manager",
      status: status || "Active",
      avatarUrl: avatarUrl || imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
    };

    await docRef.set(staffObj);

    res.status(201).json({
      id: docRef.id,
      name: staffObj.name,
      email: staffObj.email,
      role: staffObj.role,
      avatarUrl: staffObj.avatarUrl,
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
    
    // Find doc by ID or Email
    let docRef = db.collection("users").doc(id as string);
    let doc = await docRef.get();
    
    if (!doc.exists && email) {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snapshot.empty) {
        docRef = snapshot.docs[0].ref;
        doc = snapshot.docs[0];
      }
    }

    // Allow user to edit their own profile OR SuperAdmin/Manager to edit any user
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role || "Admin";
    const isSelf = currentUserId === id || (doc.exists && doc.data()?.email === req.user?.email);
    const isAuthorizedRole = ["SuperAdmin", "Manager", "Admin"].includes(currentUserRole);

    if (!isSelf && !isAuthorizedRole) {
      return res.status(403).json({ error: "Access denied. You can only update your own account." });
    }

    const userData = doc.exists ? (doc.data() as any) : {};

    // Prevent removing the last SuperAdmin
    if (role && role !== "SuperAdmin" && userData.role === "SuperAdmin") {
      const superAdminsSnapshot = await db.collection("users").where("role", "==", "SuperAdmin").get();
      if (superAdminsSnapshot.size <= 1) {
        return res.status(400).json({ error: "Cannot change role of the last SuperAdmin." });
      }
    }

    const updatePayload: any = {
      updatedAt: new Date().toISOString()
    };
    if (name) updatePayload.name = name;
    if (email) updatePayload.email = email;
    if (phone !== undefined) updatePayload.phone = phone;
    if (role && isAuthorizedRole) updatePayload.role = role;
    if (status && isAuthorizedRole) updatePayload.status = status;
    if (points !== undefined) updatePayload.points = points;
    if (avatarUrl || imageUrl) updatePayload.avatarUrl = avatarUrl || imageUrl;
    if (password && password.trim().length > 0) {
      updatePayload.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    if (doc.exists) {
      await docRef.update(updatePayload);
    } else {
      updatePayload.id = id;
      updatePayload.createdAt = new Date().toISOString();
      updatePayload.role = role || "SuperAdmin";
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

// DELETE /api/admin/staff/:id (SuperAdmin only)
router.delete("/staff/:id", authenticateJWT as any, requireRole(["SuperAdmin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
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

    await docRef.delete();
    res.json({ id, message: "Staff user deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/customers (Fraud Tracking)
router.get("/customers", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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

    const mockEmailsToExclude = ["skillshoppertraining@gmail.com", "skhan.ict@gmail.com", "shahanazamin29@gmail.com"];

    const enrichedCustomers: any[] = [];
    usersSnapshot.forEach(doc => {
      const c = doc.data() as any;
      if (mockEmailsToExclude.includes(c.email?.toLowerCase())) return;

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
router.put("/customers/:id/status", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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

// PUT /api/admin/users/:id (Update name, email, password, phone, role, status, or points)
router.put("/users/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, status, points, name, email, phone, password, avatarUrl, imageUrl } = req.body;

    const docRef = db.collection("users").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = doc.data() as any;
    const updatedData: any = {
      ...(role !== undefined && { role }),
      ...(status !== undefined && { status }),
      ...(points !== undefined && { points: Number(points) }),
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...((avatarUrl !== undefined || imageUrl !== undefined) && { avatarUrl: avatarUrl || imageUrl }),
      updatedAt: new Date().toISOString()
    };

    if (password && password.trim() !== "") {
      updatedData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    await docRef.update(updatedData);
    res.json({ id, message: "User updated successfully!", ...userData, ...updatedData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id (Delete user)
router.delete("/users/:id", authenticateJWT as any, requireRole(["SuperAdmin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("users").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    await docRef.delete();
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/inventory
router.get("/inventory", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.post("/inventory/adjust", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.get("/vendors", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.post("/vendors", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.put("/vendors/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.delete("/vendors/:id", authenticateJWT as any, requireRole(["SuperAdmin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.get("/coupons", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("coupons").get();
    const coupons: any[] = [];
    snapshot.forEach(doc => {
      coupons.push({ id: doc.id, ...doc.data() });
    });
    coupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/coupons
router.post("/coupons", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit } = req.body;
    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      res.status(400).json({ error: "code, discountType, discountValue, and expiryDate are required" });
      return;
    }

    const docId = code.toUpperCase();
    const docRef = db.collection("coupons").doc(docId);
    const doc = await docRef.get();
    if (doc.exists) {
      return res.status(400).json({ error: "Coupon code already exists." });
    }

    const coupon = {
      code: docId,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiryDate: new Date(expiryDate).toISOString(),
      usageLimit: usageLimit ? Number(usageLimit) : 1,
      timesUsed: 0,
      createdAt: new Date().toISOString(),
    };

    await docRef.set(coupon);
    res.status(201).json({ id: docId, ...coupon });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/admin/coupons/:id
router.delete("/coupons/:id", authenticateJWT as any, requireRole(["SuperAdmin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.put("/categories/:id/image", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.put("/brands/:id/logo", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.get("/contact-messages", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Salesman"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.delete("/contact-messages/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/categories/:id (Admin - Update category popup images and details)
router.put("/categories/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.post("/blogs", async (req: any, res: any) => {
  try {
    const { id, title, description, imageUrl } = req.body || {};
    if (!title) return res.status(400).json({ error: "Title is required" });
    const docId = id || db.collection("blogs").doc().id;
    const docRef = db.collection("blogs").doc(docId);
    const data = {
      id: docId,
      title,
      description: description || "",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
      createdAt: new Date().toISOString()
    };
    await docRef.set(data, { merge: true });
    res.json({ message: "Blog saved successfully", blog: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/blogs/:id
router.delete("/blogs/:id", async (req: any, res: any) => {
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
    res.json(brands);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/brands (Add/Update Brand with image upload support)
router.post("/brands", async (req: any, res: any) => {
  try {
    const { id, name, logoUrl, originCountry } = req.body || {};
    if (!name) return res.status(400).json({ error: "Brand name is required" });
    const docId = id || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const docRef = db.collection("brands").doc(docId);
    const existingDoc = await docRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    
    const data = {
      ...existingData,
      id: docId,
      name,
      originCountry: originCountry !== undefined ? originCountry : (existingData?.originCountry || "International"),
      logoUrl: logoUrl || existingData?.logoUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80",
      updatedAt: new Date().toISOString()
    };
    await docRef.set(data, { merge: true });
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
    if (name) updateData.name = name;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (originCountry !== undefined) updateData.originCountry = originCountry;
    
    await docRef.set(updateData, { merge: true });
    const updated = existingDoc.exists ? { id, ...existingDoc.data(), ...updateData } : { id, ...updateData };
    res.json({ message: "Brand updated successfully", brand: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
router.put("/brands/:id", handleUpdateBrand);
router.patch("/brands/:id", handleUpdateBrand);

// DELETE /api/admin/brands/:id
router.delete("/brands/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await db.collection("brands").doc(id).delete();
    res.json({ message: "Brand deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/products/:id — Admin: update product name, description, images
router.patch("/products/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, metaTitle, metaDescription, metaKeywords, imageUrl, imageUrl2, imageUrl3, imageUrl4, price, discountPrice, costPrice, stock } = req.body;

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

    // Update images array
    if (imageUrl !== undefined || imageUrl2 !== undefined || imageUrl3 !== undefined || imageUrl4 !== undefined) {
      const newImages = [];
      if (imageUrl) newImages.push({ url: imageUrl, isPrimary: true });
      if (imageUrl2) newImages.push({ url: imageUrl2, isPrimary: false });
      if (imageUrl3) newImages.push({ url: imageUrl3, isPrimary: false });
      if (imageUrl4) newImages.push({ url: imageUrl4, isPrimary: false });
      if (newImages.length > 0) updateData.images = newImages;
    }

    // Update variants (including per-shade/variant images)
    if (req.body.variants && Array.isArray(req.body.variants)) {
      const mappedVars = req.body.variants.map((v: any) => ({
        id: v.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: v.name || "Default",
        price: v.price !== undefined && v.price !== null ? parseFloat(v.price) : (price ? parseFloat(price) : 0),
        discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
        costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
        stock: v.stock !== undefined && v.stock !== null ? parseInt(v.stock) : 50,
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
      mappedVars.forEach((v: any, idx: number) => {
        if (v.imageUrl && v.imageUrl.trim() !== "" && !newImagesList.some(img => img.url === v.imageUrl)) {
          newImagesList.push({ id: `img-var-${v.id || idx}`, url: v.imageUrl, isPrimary: false });
        }
      });
      updateData.images = newImagesList;
    } else if (price !== undefined || discountPrice !== undefined || costPrice !== undefined || stock !== undefined) {
      const variants = current.variants || [];
      if (variants.length > 0) {
        if (price !== undefined) variants[0].price = parseFloat(price);
        if (discountPrice !== undefined) variants[0].discountPrice = discountPrice ? parseFloat(discountPrice) : null;
        if (costPrice !== undefined) variants[0].costPrice = costPrice ? parseFloat(costPrice) : null;
        if (stock !== undefined) variants[0].stock = parseInt(stock) || 0;
        updateData.variants = variants;
      }
    }

    await docRef.update(updateData);
    clearProductsCache(); // Clear backend in-memory products cache immediately!
    res.json({ id, ...current, ...updateData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/customers — Admin: Get list of all registered customers with full details
router.get("/customers", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection("users").get();
    const mockEmailsToExclude = ["skillshoppertraining@gmail.com", "skhan.ict@gmail.com", "shahanazamin29@gmail.com"];
    const customers: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (mockEmailsToExclude.includes(data.email?.toLowerCase())) return;

      if (!data.role || data.role === "Customer") {
        const { passwordHash, ...safeUser } = data;
        customers.push({ id: doc.id, ...safeUser });
      }
    });

    customers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/courier/carrybee/issue-token
router.post("/courier/carrybee/issue-token", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.post("/courier/pathao/test", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.post("/courier/steadfast/test", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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
router.post("/courier/redx/test", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
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

// POST /api/admin/users — Admin: Create new staff or customer user and dispatch email credentials
router.post("/users", authenticateJWT as any, requireRole(["SuperAdmin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role || "Salesman";

    const docRef = db.collection("users").doc();
    const newUser = {
      name,
      email,
      passwordHash,
      phone: phone || "",
      role: userRole,
      status: "Active",
      points: 0,
      createdAt: new Date().toISOString(),
    };

    await docRef.set(newUser);

    // Dispatch credentials email
    sendWelcomeUserEmail(email, name, password, userRole).catch(console.error);

    res.status(201).json({
      message: `User created successfully and login details sent to ${email}`,
      user: { id: docRef.id, name, email, phone, role: userRole, status: "Active" }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


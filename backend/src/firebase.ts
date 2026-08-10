import * as admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import prisma from "./prisma";

dotenv.config();

let db: any;
const inMemoryCollections = new Map<string, Map<string, any>>();

// ─── FIRESTORE PRISMA MOCK IMPLEMENTATION ──────────────────────────────────

class MockFirestore {
  collection(colName: string) {
    return new MockCollection(colName);
  }
  batch() {
    return new MockBatch();
  }
}

class MockDocRef {
  public colName: string;
  public id: string;

  constructor(colName: string, id: string) {
    this.colName = colName;
    this.id = id;
  }

  async get() {
    const snap = await new MockCollection(this.colName).where("id", "==", this.id).get();
    return {
      exists: snap.docs.length > 0,
      id: this.id,
      data: () => snap.docs[0]?.data() || null
    };
  }

  async set(data: any, options?: any) {
    await mockSetPrisma(this.colName, this.id, data, options);
  }

  async update(data: any) {
    await mockUpdatePrisma(this.colName, this.id, data);
  }

  async delete() {
    await mockDeletePrisma(this.colName, this.id);
  }
}

class MockCollection {
  private colName: string;
  private filters: any[] = [];
  private limitCount: number | null = null;

  constructor(colName: string) {
    this.colName = colName;
  }

  where(field: string, op: string, value: any) {
    this.filters.push({ field, op, value });
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  async get() {
    let data: any[] = [];
    if (this.colName === "products") {
      const items = await prisma.product.findMany({
        include: { brand: true, category: { include: { parent: true } }, variants: true, images: true }
      });
      const DEFAULT_FALLBACK_IMAGES = [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608248597279-f99d160bfbc5?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80"
      ];
      data = items.map((p, idx) => {
        let validImages = (p.images || []).filter(img => img.url && img.url.length > 5 && !img.url.includes("placeholder"));
        if (validImages.length === 0) {
          const fallbackUrl = DEFAULT_FALLBACK_IMAGES[idx % DEFAULT_FALLBACK_IMAGES.length];
          validImages = [{ id: `img-${p.id}`, productId: p.id, url: fallbackUrl, isPrimary: true, createdAt: new Date() }];
        }
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          brandId: p.brandId,
          brand: p.brand,
          categoryId: p.categoryId,
          category: p.category,
          campaignName: p.campaignName,
          status: p.status,
          variants: p.variants,
          images: validImages,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      });
    } else if (this.colName === "categories") {
      const items = await prisma.category.findMany();
      data = items.map(cat => ({
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId || null,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
      }));
    } else if (this.colName === "brands") {
      const items = await prisma.brand.findMany();
      data = items.map(b => ({
        id: b.id,
        name: b.name,
        logoUrl: b.logoUrl || null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }));
    } else if (this.colName === "banners") {
      const items = await prisma.promoBanner.findMany();
      data = items.map(b => ({
        id: b.id,
        title: b.title,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl || null,
        bgColor: b.bgColor || "#1a1a2e",
        page: b.page || "Homepage",
        isActive: b.isActive,
        sortOrder: b.sortOrder,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }));
    } else if (this.colName === "settings") {
      const items = await prisma.setting.findMany();
      data = items.map(s => ({
        id: s.id,
        key: s.key,
        value: s.value,
        updatedAt: s.updatedAt.toISOString(),
      }));
    } else if (this.colName === "notifications") {
      const items = await prisma.notification.findMany();
      data = items.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        imageUrl: (n as any).imageUrl || null,
        linkUrl: n.linkUrl || null,
        isActive: n.isActive,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }));
    } else if (this.colName === "users") {
      const items = await prisma.user.findMany({ include: { addresses: true } });
      data = items.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        phone: u.phone,
        role: u.role,
        points: u.points,
        status: u.status,
        addresses: u.addresses,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      }));
    } else if (this.colName === "orders") {
      const items = await prisma.order.findMany({ include: { orderItems: true } });
      data = items.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        address: o.address,
        zone: o.zone,
        deliveryCharge: o.deliveryCharge,
        subTotal: o.subTotal,
        discount: o.discount,
        total: o.total,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        orderStatus: o.orderStatus,
        notes: o.notes,
        trackingLink: o.trackingLink,
        salesmanId: o.salesmanId,
        orderItems: o.orderItems,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }));
    } else if (this.colName === "reviews") {
      const items = await prisma.review.findMany();
      data = items.map(r => ({
        id: r.id,
        productId: r.productId,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        isApproved: r.isApproved,
        createdAt: r.createdAt.toISOString(),
      }));
    } else {
      const colMap = inMemoryCollections.get(this.colName);
      if (colMap) {
        data = Array.from(colMap.values());
      }
    }

    for (const f of this.filters) {
      data = data.filter(item => {
        const val = item[f.field];
        if (f.op === "==") return val === f.value;
        if (f.op === "!=") return val !== f.value;
        if (f.op === ">") return val > f.value;
        if (f.op === "<") return val < f.value;
        if (f.op === "in") return Array.isArray(f.value) && f.value.includes(val);
        return true;
      });
    }

    if (this.limitCount !== null) {
      data = data.slice(0, this.limitCount);
    }

    const docs = data.map(item => {
      const docRef = new MockDocRef(this.colName, item.id);
      return {
        id: item.id,
        data: () => item,
        ref: docRef
      };
    });

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
      forEach: (cb: (doc: any) => void) => docs.forEach(cb)
    };
  }

  doc(docId?: string) {
    const finalId = docId || `mock-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return new MockDocRef(this.colName, finalId);
  }
}

class MockBatch {
  private ops: Array<() => Promise<void>> = [];

  set(docRef: MockDocRef, data: any, options?: any) {
    this.ops.push(() => docRef.set(data, options));
  }

  update(docRef: MockDocRef, data: any) {
    this.ops.push(() => docRef.update(data));
  }

  delete(docRef: MockDocRef) {
    this.ops.push(() => docRef.delete());
  }

  async commit() {
    for (const op of this.ops) {
      await op();
    }
  }
}

async function mockSetPrisma(colName: string, id: string, data: any, options?: any) {
  if (colName === "banners") {
    await prisma.promoBanner.upsert({
      where: { id },
      update: {
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || null,
        bgColor: data.bgColor || "#1a1a2e",
        page: data.page || "Homepage",
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
      },
      create: {
        id,
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || null,
        bgColor: data.bgColor || "#1a1a2e",
        page: data.page || "Homepage",
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
      }
    });
  } else if (colName === "settings") {
    await prisma.setting.upsert({
      where: { key: data.key || id },
      update: { value: String(data.value) },
      create: { id, key: data.key || id, value: String(data.value) }
    });
  } else if (colName === "notifications") {
    await prisma.notification.upsert({
      where: { id },
      update: {
        title: data.title,
        message: data.message,
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
      create: {
        id,
        title: data.title,
        message: data.message,
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      }
    });
  } else if (colName === "reviews") {
    await prisma.review.upsert({
      where: { id },
      update: {
        productId: data.productId,
        customerName: data.customerName,
        rating: Number(data.rating),
        comment: data.comment,
        isApproved: Boolean(data.isApproved),
      },
      create: {
        id,
        productId: data.productId,
        customerName: data.customerName,
        rating: Number(data.rating),
        comment: data.comment,
        isApproved: Boolean(data.isApproved),
      }
    });
  } else if (colName === "users") {
    await prisma.user.upsert({
      where: { id },
      update: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone || null,
        role: data.role || "Customer",
        points: data.points || 0,
        status: data.status || "Active",
      },
      create: {
        id,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone || null,
        role: data.role || "Customer",
        points: data.points || 0,
        status: data.status || "Active",
      }
    });
  } else if (colName === "orders") {
    await prisma.order.upsert({
      where: { id },
      update: {
        orderStatus: data.orderStatus,
        paymentStatus: data.paymentStatus,
        trackingLink: data.trackingLink || null,
        notes: data.notes || null,
      },
      create: {
        id,
        orderNumber: data.orderNumber || `ORD-${Date.now()}`,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        address: data.address,
        zone: data.zone,
        deliveryCharge: Number(data.deliveryCharge),
        subTotal: Number(data.subTotal),
        discount: Number(data.discount || 0),
        total: Number(data.total),
        paymentStatus: data.paymentStatus || "Pending",
        paymentMethod: data.paymentMethod || "COD",
        orderStatus: data.orderStatus || "Pending",
        notes: data.notes || null,
      }
    });
    if (data.orderItems && Array.isArray(data.orderItems)) {
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      for (const item of data.orderItems) {
        await prisma.orderItem.create({
          data: {
            orderId: id,
            variantId: item.variantId || null,
            productName: item.productName,
            variantName: item.variantName,
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.total),
          }
        });
      }
    }
  } else if (colName === "products") {
    await prisma.product.upsert({
      where: { id },
      update: {
        name: data.name,
        description: data.description || "",
        brandId: data.brandId,
        categoryId: data.categoryId,
        status: data.status || "Active",
        campaignName: data.campaignName || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
      },
      create: {
        id,
        name: data.name,
        description: data.description || "",
        brandId: data.brandId,
        categoryId: data.categoryId,
        status: data.status || "Active",
        campaignName: data.campaignName || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
      }
    });
    if (data.variants && Array.isArray(data.variants)) {
      const keepIds = data.variants.map((v: any) => v.id).filter(Boolean);
      if (keepIds.length > 0) {
        await prisma.variant.deleteMany({
          where: {
            productId: id,
            id: { notIn: keepIds }
          }
        });
      } else {
        await prisma.variant.deleteMany({
          where: { productId: id }
        });
      }

      for (const v of data.variants) {
        await prisma.variant.upsert({
          where: { id: v.id },
          update: {
            name: v.name,
            shadeColor: v.shadeColor || null,
            sizeValue: v.sizeValue || null,
            costPrice: v.costPrice !== undefined && v.costPrice !== null ? Number(v.costPrice) : null,
            imageUrl: v.imageUrl || null,
            price: Number(v.price),
            discountPrice: v.discountPrice !== null ? Number(v.discountPrice) : null,
            stock: Number(v.stock),
            sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          },
          create: {
            id: v.id,
            productId: id,
            name: v.name,
            shadeColor: v.shadeColor || null,
            sizeValue: v.sizeValue || null,
            costPrice: v.costPrice !== undefined && v.costPrice !== null ? Number(v.costPrice) : null,
            imageUrl: v.imageUrl || null,
            price: Number(v.price),
            discountPrice: v.discountPrice !== null ? Number(v.discountPrice) : null,
            stock: Number(v.stock),
            sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          }
        });
      }
    }
    if (data.images && Array.isArray(data.images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      for (const img of data.images) {
        await prisma.productImage.create({
          data: {
            productId: id,
            url: img.url,
            isPrimary: Boolean(img.isPrimary)
          }
        });
      }
    }
  } else {
    if (!inMemoryCollections.has(colName)) {
      inMemoryCollections.set(colName, new Map());
    }
    inMemoryCollections.get(colName)!.set(id, { id, ...data });
  }
}

async function mockUpdatePrisma(colName: string, id: string, data: any) {
  if (colName === "products") {
    const existingDoc = await new MockCollection("products").where("id", "==", id).get();
    const existingData = existingDoc.docs[0]?.data() || {};
    const mergedData = { ...existingData, ...data };
    await mockSetPrisma("products", id, mergedData);
    return;
  }

  const flatData: any = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && typeof v !== "object" && !Array.isArray(v)) {
      flatData[k] = v;
    }
  }
  
  if (colName === "banners") {
    await prisma.promoBanner.update({ where: { id }, data: flatData });
  } else if (colName === "settings") {
    await prisma.setting.update({ where: { id }, data: flatData });
  } else if (colName === "notifications") {
    await prisma.notification.update({ where: { id }, data: flatData });
  } else if (colName === "reviews") {
    await prisma.review.update({ where: { id }, data: flatData });
  } else if (colName === "users") {
    await prisma.user.update({ where: { id }, data: flatData });
  } else if (colName === "orders") {
    await prisma.order.update({ where: { id }, data: flatData });
  } else {
    const colMap = inMemoryCollections.get(colName);
    if (colMap && colMap.has(id)) {
      colMap.set(id, { ...colMap.get(id), ...data });
    }
  }
}

async function mockDeletePrisma(colName: string, id: string) {
  if (colName === "banners") {
    await prisma.promoBanner.delete({ where: { id } });
  } else if (colName === "settings") {
    await prisma.setting.delete({ where: { id } });
  } else if (colName === "notifications") {
    await prisma.notification.delete({ where: { id } });
  } else if (colName === "reviews") {
    await prisma.review.delete({ where: { id } });
  } else if (colName === "users") {
    await prisma.user.delete({ where: { id } });
  } else if (colName === "orders") {
    await prisma.order.delete({ where: { id } });
  } else if (colName === "products") {
    await prisma.product.delete({ where: { id } });
  } else {
    const colMap = inMemoryCollections.get(colName);
    if (colMap) {
      colMap.delete(id);
    }
  }
}

// ─── INITIALIZATION ────────────────────────────────────────────────────────

let dbInstance: any;

const serviceAccountPath = path.join(__dirname, "../firebase-service-account.json");

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    dbInstance = admin.firestore();
    console.log("🔥 Connected to Firebase Firestore using service account JSON file");
  } catch (error: any) {
    console.error("❌ Error initializing Firebase from JSON file:", error.message);
    dbInstance = new MockFirestore();
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      })
    });
    dbInstance = admin.firestore();
    console.log("🔥 Connected to Firebase Firestore using environment variables");
  } catch (error: any) {
    console.error("❌ Error initializing Firebase from env variables:", error.message);
    dbInstance = new MockFirestore();
  }
} else {
  console.warn("\n⚠️  WARNING: Google Firebase credentials not found!");
  console.warn("Please place your service account key in: backend/firebase-service-account.json");
  console.warn("Or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env");
  console.warn("ℹ️  FALLING BACK TO LOCAL SQLITE PRISMA DATABASE MOCK FOR FIREBASE QUERYING\n");
  dbInstance = new MockFirestore();
}

db = dbInstance as any;

export { db, admin };
export default db;

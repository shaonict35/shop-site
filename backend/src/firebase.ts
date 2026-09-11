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
      let items: any[] = [];
      try {
        items = await prisma.promoBanner.findMany();
      } catch (e) {
        items = [];
      }
      data = items.map(b => ({
        id: b.id,
        title: b.title,
        imageUrl: b.imageUrl,
        mobileImageUrl: b.mobileImageUrl || b.imageUrl,
        tabletImageUrl: b.tabletImageUrl || b.imageUrl,
        linkUrl: b.linkUrl || null,
        bgColor: b.bgColor || "#1a1a2e",
        page: b.page || "Homepage",
        isActive: b.isActive,
        sortOrder: b.sortOrder,
        createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: b.updatedAt ? b.updatedAt.toISOString() : new Date().toISOString(),
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
      let items: any[] = [];
      try {
        items = await prisma.user.findMany({ include: { addresses: true } });
      } catch (e) {
        try {
          items = await prisma.user.findMany();
        } catch (e2) {
          items = [];
        }
      }
      data = items.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        phone: u.phone,
        role: u.role,
        points: u.points,
        status: u.status,
        addresses: u.addresses || [],
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: u.updatedAt ? u.updatedAt.toISOString() : new Date().toISOString(),
      }));
    } else if (this.colName === "orders") {
      let items: any[] = [];
      try {
        items = await prisma.order.findMany({ include: { orderItems: true } });
      } catch (e) {
        try {
          items = await prisma.order.findMany();
        } catch (e2) {
          items = [];
        }
      }
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
        orderItems: o.orderItems || [],
        createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: o.updatedAt ? o.updatedAt.toISOString() : new Date().toISOString(),
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
    } else if (this.colName === "menu_items" || this.colName === "menus" || this.colName === "MenuItem") {
      try {
        const items = await prisma.menuItem.findMany({
          orderBy: { sortOrder: "asc" }
        });
        data = items.map(m => ({
          id: m.id,
          title: m.title,
          url: m.url,
          location: m.location,
          parentId: m.parentId,
          sortOrder: m.sortOrder,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        }));
      } catch (err) {
        // Fallback to in-memory if table does not exist
      }
    } else if (this.colName === "cms_pages" || this.colName === "pages" || this.colName === "CmsPage") {
      try {
        const items = await prisma.cmsPage.findMany();
        data = items.map(p => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          contentHtml: p.contentHtml,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));
      } catch (err) {
        // Fallback to in-memory
      }
    }
    
    // Always merge inMemoryCollections to support dynamic memory items
    const colMap = inMemoryCollections.get(this.colName);
    if (colMap && colMap.size > 0) {
      const memoryItems = Array.from(colMap.values());
      const existingIds = new Set(data.map(d => d.id));
      for (const mItem of memoryItems) {
        if (!existingIds.has(mItem.id)) {
          data.push(mItem);
        } else {
          // Update item in data with latest in-memory edits
          data = data.map(d => d.id === mItem.id ? { ...d, ...mItem } : d);
        }
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
    try {
      const safeImageUrl = data.imageUrl;
      const safeMobileUrl = data.mobileImageUrl || null;
      const safeTabletUrl = data.tabletImageUrl || null;

      await prisma.promoBanner.upsert({
        where: { id },
        update: {
          title: data.title,
          imageUrl: safeImageUrl,
          mobileImageUrl: safeMobileUrl,
          tabletImageUrl: safeTabletUrl,
          linkUrl: data.linkUrl || null,
          bgColor: data.bgColor || "#1a1a2e",
          page: data.page || "Homepage",
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
          sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        },
        create: {
          id,
          title: data.title,
          imageUrl: safeImageUrl,
          mobileImageUrl: safeMobileUrl,
          tabletImageUrl: safeTabletUrl,
          linkUrl: data.linkUrl || null,
          bgColor: data.bgColor || "#1a1a2e",
          page: data.page || "Homepage",
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
          sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        }
      });
    } catch (e) {
      console.warn("Prisma banner SQL save note (saving to memory storage):", e);
    } finally {
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      // Store complete full base64 data URL string in memory so client receives 100% full image data
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
    }
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
  } else if (colName === "menu_items" || colName === "menus" || colName === "MenuItem") {
    try {
      await prisma.menuItem.upsert({
        where: { id },
        update: {
          title: data.title || "",
          url: data.url || "",
          location: data.location || "Header",
          parentId: data.parentId || null,
          sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : parseInt(data.sortOrder || "0", 10) || 0,
        },
        create: {
          id,
          title: data.title || "",
          url: data.url || "",
          location: data.location || "Header",
          parentId: data.parentId || null,
          sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : parseInt(data.sortOrder || "0", 10) || 0,
        }
      });
    } catch (e) {}
  } else if (colName === "cms_pages" || colName === "pages" || colName === "CmsPage") {
    try {
      await prisma.cmsPage.upsert({
        where: { slug: data.slug || id },
        update: {
          title: data.title || "",
          contentHtml: data.contentHtml || "",
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
        create: {
          id,
          slug: data.slug || id,
          title: data.title || "",
          contentHtml: data.contentHtml || "",
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        }
      });
    } catch (e) {}
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
    // 1. Ensure valid Brand in MySQL to satisfy foreign key
    const finalBrandId = data.brandId || "brand-default";
    try {
      await prisma.brand.upsert({
        where: { id: finalBrandId },
        update: data.brand?.name ? { name: data.brand.name } : {},
        create: { id: finalBrandId, name: data.brand?.name || "Authentic Brand" }
      });
    } catch (bErr) {}

    // 2. Ensure valid Category in MySQL to satisfy foreign key
    const finalCategoryId = data.categoryId || "cat-default";
    try {
      await prisma.category.upsert({
        where: { id: finalCategoryId },
        update: data.category?.name ? { name: data.category.name } : {},
        create: { id: finalCategoryId, name: data.category?.name || "Cosmetics" }
      });
    } catch (cErr) {}

    await prisma.product.upsert({
      where: { id },
      update: {
        name: data.name,
        description: data.description || "",
        brandId: finalBrandId,
        categoryId: finalCategoryId,
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
        brandId: finalBrandId,
        categoryId: finalCategoryId,
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
  } else if (colName === "categories") {
    try {
      await prisma.category.upsert({
        where: { id },
        update: {
          name: data.name,
          parentId: data.parentId || null,
          imageUrl: data.imageUrl || null,
        },
        create: {
          id,
          name: data.name,
          parentId: data.parentId || null,
          imageUrl: data.imageUrl || null,
        }
      });
    } catch (e) {
      console.warn("Prisma category upsert note:", e);
    } finally {
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
    }
  } else if (colName === "brands") {
    try {
      await prisma.brand.upsert({
        where: { id },
        update: {
          name: data.name,
          logoUrl: data.logoUrl || null,
        },
        create: {
          id,
          name: data.name,
          logoUrl: data.logoUrl || null,
        }
      });
    } catch (e) {
      console.warn("Prisma brand upsert note:", e);
    } finally {
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
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
    try {
      await prisma.promoBanner.update({ where: { id }, data: flatData });
    } catch (e) {
      try {
        await prisma.promoBanner.upsert({
          where: { id },
          update: flatData,
          create: { id, title: flatData.title || "Banner", imageUrl: flatData.imageUrl || "", ...flatData }
        });
      } catch (err) {
        console.warn("Banner prisma update fallback note:", err);
      }
    }
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
  } else if (colName === "menu_items" || colName === "menus" || colName === "MenuItem") {
    try {
      await prisma.menuItem.update({
        where: { id },
        data: {
          title: flatData.title !== undefined ? flatData.title : undefined,
          url: flatData.url !== undefined ? flatData.url : undefined,
          location: flatData.location !== undefined ? flatData.location : undefined,
          parentId: flatData.parentId !== undefined ? flatData.parentId : undefined,
          sortOrder: flatData.sortOrder !== undefined ? (typeof flatData.sortOrder === "number" ? flatData.sortOrder : parseInt(flatData.sortOrder || "0", 10) || 0) : undefined,
        }
      });
    } catch (e) {}
  } else if (colName === "cms_pages" || colName === "pages" || colName === "CmsPage") {
    try {
      await prisma.cmsPage.update({
        where: { id },
        data: {
          title: flatData.title !== undefined ? flatData.title : undefined,
          contentHtml: flatData.contentHtml !== undefined ? flatData.contentHtml : undefined,
          metaTitle: flatData.metaTitle !== undefined ? flatData.metaTitle : undefined,
          metaDescription: flatData.metaDescription !== undefined ? flatData.metaDescription : undefined,
        }
      });
    } catch (e) {}
  }

  // Always keep inMemoryCollections synchronized with latest updates
  if (!inMemoryCollections.has(colName)) {
    inMemoryCollections.set(colName, new Map());
  }
  const colMap = inMemoryCollections.get(colName)!;
  const prevDoc = colMap.get(id) || {};
  colMap.set(id, { ...prevDoc, ...data, id });
}

async function mockDeletePrisma(colName: string, id: string) {
  try {
    if (colName === "banners") {
      await prisma.promoBanner.deleteMany({ where: { id } });
    } else if (colName === "settings") {
      await prisma.setting.deleteMany({ where: { id } });
    } else if (colName === "notifications") {
      await prisma.notification.deleteMany({ where: { id } });
    } else if (colName === "reviews") {
      await prisma.review.deleteMany({ where: { id } });
    } else if (colName === "users") {
      await prisma.user.deleteMany({ where: { id } });
    } else if (colName === "orders") {
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.order.deleteMany({ where: { id } });
    } else if (colName === "products") {
      await prisma.variant.deleteMany({ where: { productId: id } });
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.product.deleteMany({ where: { id } });
    } else if (colName === "categories") {
      await prisma.category.deleteMany({ where: { id } });
    } else if (colName === "brands") {
      await prisma.brand.deleteMany({ where: { id } });
    } else if (colName === "menu_items" || colName === "menus" || colName === "MenuItem") {
      await prisma.menuItem.deleteMany({ where: { id } });
    } else if (colName === "cms_pages" || colName === "pages" || colName === "CmsPage") {
      await prisma.cmsPage.deleteMany({ where: { id } });
    }
  } catch (e) {
    console.warn(`Prisma delete fallback note for ${colName} (${id}):`, e);
  } finally {
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

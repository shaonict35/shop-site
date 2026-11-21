// Google Firebase completely removed - 100% Pure SQL / SQLite Prisma database engine
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import prisma from "./prisma";

dotenv.config();

export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

// Prisma Query Cache for high-speed repeated database reads on hostings
const prismaQueryCache = new Map<string, { data: any[]; expiry: number }>();
const PRISMA_CACHE_TTL = 120 * 1000; // 2 minutes in-memory cache

export function invalidatePrismaCache(colName?: string) {
  if (colName) {
    prismaQueryCache.delete(colName);
  } else {
    prismaQueryCache.clear();
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
    const cached = prismaQueryCache.get(this.colName);
    if (cached && cached.expiry > Date.now() && this.filters.length === 0) {
      data = cached.data;
    } else {
      if (this.colName === "products") {
        const items = await prisma.product.findMany({
          include: { brand: true, category: { include: { parent: true } }, variants: true, images: true }
        });
      const DEFAULT_FALLBACK_IMAGE = "/placeholder-product.svg";
      data = items.map((p, idx) => {
        let validImages = (p.images || []).filter(img => 
          img.url && 
          img.url.length > 5 && 
          !img.url.includes("placeholder")
        );
        if (validImages.length === 0) {
          validImages = [{ id: `img-${p.id}`, productId: p.id, url: DEFAULT_FALLBACK_IMAGE, isPrimary: true, createdAt: new Date() }];
        }
        const cleanedVariants = (p.variants || []).map(v => {
          let vImg = v.imageUrl;
          if (!vImg || vImg.includes("placeholder")) {
            vImg = validImages[0]?.url || DEFAULT_FALLBACK_IMAGE;
          }
          return { ...v, imageUrl: vImg };
        });
        const primaryVariant = cleanedVariants[0];
        const primaryImg = validImages.find(img => img.isPrimary)?.url || validImages[0]?.url || DEFAULT_FALLBACK_IMAGE;
        const totalStock = cleanedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
        const activeStatus = (p.status || "Active").toLowerCase() === "active" || p.status === "ACTIVE";

        return {
          id: p.id,
          name: p.name,
          slug: (p as any).slug || (p.name ? generateSlug(p.name) : p.id),
          description: p.description,
          brandId: p.brandId,
          brand: p.brand,
          categoryId: p.categoryId,
          category: p.category,
          campaignName: p.campaignName,
          status: p.status || "Active",
          isActive: activeStatus,
          inStock: totalStock > 0 || cleanedVariants.length === 0,
          price: primaryVariant ? Number(primaryVariant.price) : 0,
          discountPrice: primaryVariant?.discountPrice !== null && primaryVariant?.discountPrice !== undefined ? Number(primaryVariant.discountPrice) : null,
          stock: totalStock > 0 ? totalStock : (primaryVariant?.stock ?? 50),
          imageUrl: primaryImg,
          variants: cleanedVariants,
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
        imageUrl: cat.imageUrl || null,
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
      data = items.map((b, idx) => {
        let safeImg = b.imageUrl;
        if (safeImg && safeImg.includes("shop.glowgoodly.com")) {
          safeImg = `/images/sliders/slider-${(idx % 3) + 1}.png`;
        }
        let safeMobile = b.mobileImageUrl || safeImg;
        if (safeMobile && safeMobile.includes("shop.glowgoodly.com")) {
          safeMobile = safeImg;
        }
        let safeTablet = b.tabletImageUrl || safeImg;
        if (safeTablet && safeTablet.includes("shop.glowgoodly.com")) {
          safeTablet = safeImg;
        }
        return {
          id: b.id,
          title: b.title,
          imageUrl: safeImg,
          mobileImageUrl: safeMobile,
          tabletImageUrl: safeTablet,
          linkUrl: b.linkUrl || null,
          bgColor: b.bgColor || "#1a1a2e",
          page: b.page || "Homepage",
          isActive: b.isActive,
          sortOrder: b.sortOrder,
          createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: b.updatedAt ? b.updatedAt.toISOString() : new Date().toISOString(),
        };
      });
    } else if (this.colName === "hero_banners" || this.colName === "heroBanners") {
      let items: any[] = [];
      try {
        if ((prisma as any).heroBanner) {
          items = await (prisma as any).heroBanner.findMany({ orderBy: { order: "asc" } });
        }
      } catch (e) {
        items = [];
      }
      if (items.length === 0) {
        try {
          const setting = await prisma.setting.findUnique({ where: { key: "HERO_BANNERS_DATA" } });
          if (setting && setting.value) {
            items = JSON.parse(setting.value);
          }
        } catch (e) {}
      }
      data = items.map((b: any) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || null,
        mediaUrl: b.mediaUrl,
        mediaType: b.mediaType || "image",
        ctaLink: b.ctaLink || null,
        isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
        order: b.order !== undefined ? Number(b.order) : 0,
        createdAt: b.createdAt ? (typeof b.createdAt === "string" ? b.createdAt : b.createdAt.toISOString()) : new Date().toISOString(),
        updatedAt: b.updatedAt ? (typeof b.updatedAt === "string" ? b.updatedAt : b.updatedAt.toISOString()) : new Date().toISOString()
      }));
    } else if (this.colName === "homepage_sections" || this.colName === "homepageSectionBanners") {
      let items: any[] = [];
      try {
        if ((prisma as any).homepageSectionBanner) {
          items = await (prisma as any).homepageSectionBanner.findMany({ orderBy: { order: "asc" } });
        }
      } catch (e) {
        items = [];
      }
      data = items.map((b: any) => ({
        id: b.id,
        sectionKey: b.sectionKey,
        title: b.title || "",
        subtitle: b.subtitle || null,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl || null,
        order: b.order !== undefined ? Number(b.order) : 0,
        isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
        createdAt: b.createdAt ? (typeof b.createdAt === "string" ? b.createdAt : b.createdAt.toISOString()) : new Date().toISOString(),
        updatedAt: b.updatedAt ? (typeof b.updatedAt === "string" ? b.updatedAt : b.updatedAt.toISOString()) : new Date().toISOString()
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
      try {
        const notifSetting = await prisma.setting.findUnique({ where: { key: "NOTIFICATIONS_STORED_DATA" } });
        if (notifSetting && notifSetting.value) {
          const parsed = JSON.parse(notifSetting.value);
          if (Array.isArray(parsed)) {
            data = parsed;
          }
        }
      } catch (err) {}
      if (data.length === 0) {
        // Default Shajgoj-style promotional Bengali notification matching customer requirements
        data = [
          {
            id: "notif-active-1",
            title: "👉 ৯৯ টাকায় Face Wash+Moisturizer!! 😍",
            message: "মাত্র ৯৯ টাকায় কিনুন Glow & Hydrate Duo (Rajkonna Glow Booster Wash + Enso Skin Light Gel)!! অর্ডার করুন এখনই!!",
            imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
            linkUrl: "/shop?deal=combo",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
      }
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
        status: o.orderStatus,
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
    } else if (this.colName === "coupons") {
      try {
        const couponSetting = await prisma.setting.findUnique({ where: { key: "COUPONS_STORED_DATA" } });
        if (couponSetting && couponSetting.value) {
          const parsed = JSON.parse(couponSetting.value);
          if (Array.isArray(parsed)) {
            data = parsed;
          }
        }
      } catch (err) {}
    } else if (this.colName === "blogs") {
      try {
        const blogSetting = await prisma.setting.findUnique({ where: { key: "BLOGS_STORED_DATA" } });
        if (blogSetting && blogSetting.value) {
          const parsed = JSON.parse(blogSetting.value);
          if (Array.isArray(parsed)) {
            data = parsed;
          }
        }
      } catch (err) {}
    } else if (this.colName === "chatMessages") {
      try {
        const chatSetting = await prisma.setting.findUnique({ where: { key: "CHAT_MESSAGES_STORED_DATA" } });
        if (chatSetting && chatSetting.value) {
          const parsed = JSON.parse(chatSetting.value);
          if (Array.isArray(parsed)) {
            data = parsed;
          }
        }
      } catch (err) {}
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

      // Store in memory cache for 2 minutes (exclude real-time live chat messages)
      if (this.colName !== "chatMessages") {
        prismaQueryCache.set(this.colName, { data: [...data], expiry: Date.now() + PRISMA_CACHE_TTL });
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
  invalidatePrismaCache(colName);
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
  } else if (colName === "hero_banners" || colName === "heroBanners") {
    try {
      if ((prisma as any).heroBanner) {
        await (prisma as any).heroBanner.upsert({
          where: { id },
          update: {
            title: data.title || "Hero Banner",
            subtitle: data.subtitle || null,
            mediaUrl: data.mediaUrl || "",
            mediaType: data.mediaType || "image",
            ctaLink: data.ctaLink || null,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
            order: data.order !== undefined ? Number(data.order) : 0,
          },
          create: {
            id,
            title: data.title || "Hero Banner",
            subtitle: data.subtitle || null,
            mediaUrl: data.mediaUrl || "",
            mediaType: data.mediaType || "image",
            ctaLink: data.ctaLink || null,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
            order: data.order !== undefined ? Number(data.order) : 0,
          }
        });
      }
    } catch (e) {
      console.warn("Prisma heroBanner save fallback:", e);
    } finally {
      try {
        const setting = await prisma.setting.findUnique({ where: { key: "HERO_BANNERS_DATA" } });
        let list: any[] = setting && setting.value ? JSON.parse(setting.value) : [];
        const idx = list.findIndex((item: any) => item.id === id);
        const entry = { ...data, id, updatedAt: new Date().toISOString() };
        if (idx >= 0) list[idx] = entry;
        else list.push(entry);
        await prisma.setting.upsert({
          where: { key: "HERO_BANNERS_DATA" },
          update: { value: JSON.stringify(list) },
          create: { key: "HERO_BANNERS_DATA", value: JSON.stringify(list) }
        });
      } catch (err) {}
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
    }
  } else if (colName === "homepage_sections" || colName === "homepageSectionBanners") {
    try {
      if ((prisma as any).homepageSectionBanner) {
        await (prisma as any).homepageSectionBanner.upsert({
          where: { id },
          update: {
            sectionKey: data.sectionKey,
            title: data.title || null,
            subtitle: data.subtitle || null,
            imageUrl: data.imageUrl,
            linkUrl: data.linkUrl || null,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
            order: data.order !== undefined ? Number(data.order) : 0,
          },
          create: {
            id,
            sectionKey: data.sectionKey,
            title: data.title || null,
            subtitle: data.subtitle || null,
            imageUrl: data.imageUrl,
            linkUrl: data.linkUrl || null,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
            order: data.order !== undefined ? Number(data.order) : 0,
          }
        });
      }
    } catch (e) {
      console.warn("Prisma homepageSectionBanner save fallback:", e);
    } finally {
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
    }
  } else if (colName === "settings") {
    await prisma.setting.upsert({
      where: { key: data.key || id },
      update: { value: String(data.value) },
      create: { id, key: data.key || id, value: String(data.value) }
    });
  } else if (colName === "notifications") {
    try {
      let list: any[] = [];
      const notifSetting = await prisma.setting.findUnique({ where: { key: "NOTIFICATIONS_STORED_DATA" } });
      if (notifSetting && notifSetting.value) {
        try { list = JSON.parse(notifSetting.value); } catch {}
      }
      const existingIdx = list.findIndex((n: any) => n.id === id);
      const notifRecord = {
        id,
        title: data.title || "",
        message: data.message || "",
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        list[existingIdx] = notifRecord;
      } else {
        list.unshift(notifRecord);
      }
      await prisma.setting.upsert({
        where: { key: "NOTIFICATIONS_STORED_DATA" },
        update: { value: JSON.stringify(list) },
        create: { key: "NOTIFICATIONS_STORED_DATA", value: JSON.stringify(list) }
      });
    } catch (e) {
      console.warn("Prisma notifications save note:", e);
    } finally {
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
    }
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
        isVerified: data.isVerified !== undefined ? Boolean(data.isVerified) : false,
        verificationCode: data.verificationCode || null,
        codeExpiresAt: data.codeExpiresAt ? new Date(data.codeExpiresAt) : null,
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
        isVerified: data.isVerified !== undefined ? Boolean(data.isVerified) : false,
        verificationCode: data.verificationCode || null,
        codeExpiresAt: data.codeExpiresAt ? new Date(data.codeExpiresAt) : null,
      }
    });
  } else if (colName === "coupons") {
    try {
      const code = (data.code || id).toUpperCase();
      await prisma.coupon.upsert({
        where: { code },
        update: {
          discountType: data.discountType || "Fixed",
          discountValue: Number(data.discount || data.discountValue || 0),
          minOrderValue: Number(data.minOrder || data.minOrderValue || 0),
          expiryDate: data.expiresAt ? new Date(data.expiresAt) : (data.expiryDate ? new Date(data.expiryDate) : new Date(Date.now() + 365 * 86400000)),
          usageLimit: Number(data.usageLimit || 100),
        },
        create: {
          id,
          code,
          discountType: data.discountType || "Fixed",
          discountValue: Number(data.discount || data.discountValue || 0),
          minOrderValue: Number(data.minOrder || data.minOrderValue || 0),
          expiryDate: data.expiresAt ? new Date(data.expiresAt) : (data.expiryDate ? new Date(data.expiryDate) : new Date(Date.now() + 365 * 86400000)),
          usageLimit: Number(data.usageLimit || 100),
        }
      });
    } catch (e) {}

    try {
      let existingCoupons: any[] = [];
      const couponSetting = await prisma.setting.findUnique({ where: { key: "COUPONS_STORED_DATA" } });
      if (couponSetting && couponSetting.value) {
        try { existingCoupons = JSON.parse(couponSetting.value); } catch {}
      }
      const code = (data.code || id).toUpperCase();
      const idx = existingCoupons.findIndex(c => c.id === id || (c.code && c.code.toUpperCase() === code));
      const couponItem = { id, ...data, code };
      if (idx >= 0) existingCoupons[idx] = couponItem;
      else existingCoupons.unshift(couponItem);
      await prisma.setting.upsert({
        where: { key: "COUPONS_STORED_DATA" },
        update: { value: JSON.stringify(existingCoupons) },
        create: { key: "COUPONS_STORED_DATA", value: JSON.stringify(existingCoupons) }
      });
    } catch (e) {}
  } else if (colName === "blogs") {
    try {
      let existingBlogs: any[] = [];
      const blogSetting = await prisma.setting.findUnique({ where: { key: "BLOGS_STORED_DATA" } });
      if (blogSetting && blogSetting.value) {
        try { existingBlogs = JSON.parse(blogSetting.value); } catch {}
      }
      const idx = existingBlogs.findIndex(b => b.id === id);
      const blogItem = { id, ...data, updatedAt: new Date().toISOString() };
      if (idx >= 0) existingBlogs[idx] = blogItem;
      else existingBlogs.unshift(blogItem);
      await prisma.setting.upsert({
        where: { key: "BLOGS_STORED_DATA" },
        update: { value: JSON.stringify(existingBlogs) },
        create: { key: "BLOGS_STORED_DATA", value: JSON.stringify(existingBlogs) }
      });
    } catch (e) {}
  } else if (colName === "orders") {
    await prisma.order.upsert({
      where: { id },
      update: {
        orderStatus: data.orderStatus,
        paymentStatus: data.paymentStatus,
        trackingLink: data.trackingLink || null,
        notes: data.notes || null,
        courierTrackingId: data.courierTrackingId || null,
        courierConsignmentId: data.courierConsignmentId || null,
        courierName: data.courierName || null,
        courierResponse: data.courierResponse || null,
        transactionId: data.transactionId || null,
        senderPhone: data.senderPhone || null,
      },
      create: {
        id,
        orderNumber: data.orderNumber || `ORD-${Date.now()}`,
        customerName: data.customerName || "Customer",
        customerEmail: data.customerEmail || `${(data.customerPhone || "customer").replace(/[^0-9]/g, "") || "customer"}@glowgoodly.com`,
        customerPhone: data.customerPhone || "",
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
        trackingLink: data.trackingLink || null,
        courierTrackingId: data.courierTrackingId || null,
        courierConsignmentId: data.courierConsignmentId || null,
        courierName: data.courierName || null,
        courierResponse: data.courierResponse || null,
        transactionId: data.transactionId || null,
        senderPhone: data.senderPhone || null,
      }
    });
    if (data.orderItems && Array.isArray(data.orderItems)) {
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      for (const item of data.orderItems) {
        let validVariantId: string | null = null;
        if (item.variantId) {
          const exists = await prisma.variant.findUnique({ where: { id: item.variantId } });
          if (exists) {
            validVariantId = item.variantId;
          }
        }

        await prisma.orderItem.create({
          data: {
            orderId: id,
            variantId: validVariantId,
            productName: item.productName || "Product Item",
            variantName: item.variantName || "Standard",
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            total: Number(item.total || 0),
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
    if (!inMemoryCollections.has(colName)) {
      inMemoryCollections.set(colName, new Map());
    }
    const primaryV = data.variants?.[0];
    const primaryI = data.imageUrl || data.images?.[0]?.url || "/placeholder-product.svg";
    inMemoryCollections.get(colName)!.set(id, {
      ...data,
      id,
      status: data.status || "Active",
      isActive: true,
      inStock: true,
      price: primaryV ? Number(primaryV.price) : (data.price ? Number(data.price) : 0),
      discountPrice: primaryV?.discountPrice !== undefined ? primaryV.discountPrice : (data.discountPrice ? Number(data.discountPrice) : null),
      stock: primaryV?.stock !== undefined ? Number(primaryV.stock) : (data.stock ? Number(data.stock) : 50),
      imageUrl: primaryI
    });
    invalidatePrismaCache("products");
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
      const existingByName = await prisma.brand.findFirst({
        where: { name: data.name }
      });
      if (existingByName) {
        await prisma.brand.update({
          where: { id: existingByName.id },
          data: {
            name: data.name,
            logoUrl: data.logoUrl || null,
          }
        });
      } else {
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
      }
    } catch (e) {
      console.warn("Prisma brand upsert note:", e);
    } finally {
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
    }
  } else if (colName === "coupons") {
    try {
      const stored = await prisma.setting.findUnique({ where: { key: "COUPONS_STORED_DATA" } });
      let list: any[] = [];
      if (stored && stored.value) {
        try { list = JSON.parse(stored.value); } catch {}
      }
      const existingIdx = list.findIndex((c: any) => c.id === id || c.code === (data.code || id));
      const couponRecord = { id, ...data };
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...couponRecord };
      } else {
        list.push(couponRecord);
      }
      await prisma.setting.upsert({
        where: { key: "COUPONS_STORED_DATA" },
        update: { value: JSON.stringify(list) },
        create: { key: "COUPONS_STORED_DATA", value: JSON.stringify(list) }
      });
    } catch (e) {
      console.warn("Prisma coupons setting note:", e);
    } finally {
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
    }
  } else if (colName === "blogs") {
    try {
      const stored = await prisma.setting.findUnique({ where: { key: "BLOGS_STORED_DATA" } });
      let list: any[] = [];
      if (stored && stored.value) {
        try { list = JSON.parse(stored.value); } catch {}
      }
      const existingIdx = list.findIndex((b: any) => b.id === id);
      const blogRecord = { id, ...data };
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...blogRecord };
      } else {
        list.push(blogRecord);
      }
      await prisma.setting.upsert({
        where: { key: "BLOGS_STORED_DATA" },
        update: { value: JSON.stringify(list) },
        create: { key: "BLOGS_STORED_DATA", value: JSON.stringify(list) }
      });
    } catch (e) {
      console.warn("Prisma blogs setting note:", e);
    } finally {
      if (!inMemoryCollections.has(colName)) {
        inMemoryCollections.set(colName, new Map());
      }
      inMemoryCollections.get(colName)!.set(id, { id, ...data });
    }
  } else if (colName === "chatMessages") {
    try {
      let list: any[] = [];
      const stored = await prisma.setting.findUnique({ where: { key: "CHAT_MESSAGES_STORED_DATA" } });
      if (stored && stored.value) {
        try { list = JSON.parse(stored.value); } catch {}
      }
      const existingIdx = list.findIndex((m: any) => m.id === id);
      const msgRecord = { id, ...data };
      if (existingIdx >= 0) {
        list[existingIdx] = msgRecord;
      } else {
        list.push(msgRecord);
      }
      await prisma.setting.upsert({
        where: { key: "CHAT_MESSAGES_STORED_DATA" },
        update: { value: JSON.stringify(list) },
        create: { key: "CHAT_MESSAGES_STORED_DATA", value: JSON.stringify(list) }
      });
    } catch (e) {
      console.warn("Chat message persistent storage note:", e);
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
    try {
      let list: any[] = [];
      const notifSetting = await prisma.setting.findUnique({ where: { key: "NOTIFICATIONS_STORED_DATA" } });
      if (notifSetting && notifSetting.value) {
        try { list = JSON.parse(notifSetting.value); } catch {}
      }
      const idx = list.findIndex((n: any) => n.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data, id, updatedAt: new Date().toISOString() };
        await prisma.setting.upsert({
          where: { key: "NOTIFICATIONS_STORED_DATA" },
          update: { value: JSON.stringify(list) },
          create: { key: "NOTIFICATIONS_STORED_DATA", value: JSON.stringify(list) }
        });
      }
    } catch (e) {
      console.warn("Prisma notifications update note:", e);
    }
  } else if (colName === "reviews") {
    await prisma.review.update({ where: { id }, data: flatData });
  } else if (colName === "users") {
    try {
      const allowedUserKeys = ["name", "email", "passwordHash", "phone", "role", "points", "status", "isVerified", "verificationCode", "codeExpiresAt"];
      const safeUserData: any = {};
      for (const k of allowedUserKeys) {
        if (flatData[k] !== undefined) safeUserData[k] = flatData[k];
      }
      if (Object.keys(safeUserData).length > 0) {
        await prisma.user.update({ where: { id }, data: safeUserData });
      }
    } catch (uErr) {
      console.warn("Prisma user update note:", uErr);
    }
  } else if (colName === "orders") {
    const allowedKeys = [
      "orderNumber", "customerId", "customerName", "customerEmail",
      "customerPhone", "address", "zone", "deliveryCharge", "subTotal",
      "discount", "total", "paymentStatus", "paymentMethod", "orderStatus",
      "notes", "trackingLink", "salesmanId", "courierTrackingId", "courierConsignmentId",
      "courierName", "courierResponse", "transactionId", "senderPhone", "updatedAt"
    ];
    const safeData: any = {};
    for (const key of allowedKeys) {
      if (flatData[key] !== undefined) safeData[key] = flatData[key];
    }
    if (flatData.status && !safeData.orderStatus) {
      safeData.orderStatus = flatData.status;
    }
    if (safeData.updatedAt && typeof safeData.updatedAt === "string") {
      safeData.updatedAt = new Date(safeData.updatedAt);
    }
    await prisma.order.update({ where: { id }, data: safeData });
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
  invalidatePrismaCache(colName);
  try {
    if (colName === "banners") {
      await prisma.promoBanner.deleteMany({ where: { id } });
    } else if (colName === "hero_banners" || colName === "heroBanners") {
      try {
        if ((prisma as any).heroBanner) {
          await (prisma as any).heroBanner.deleteMany({ where: { id } });
        }
      } catch (e) {}
      try {
        const setting = await prisma.setting.findUnique({ where: { key: "HERO_BANNERS_DATA" } });
        if (setting && setting.value) {
          const list = JSON.parse(setting.value).filter((n: any) => n.id !== id);
          await prisma.setting.upsert({
            where: { key: "HERO_BANNERS_DATA" },
            update: { value: JSON.stringify(list) },
            create: { key: "HERO_BANNERS_DATA", value: JSON.stringify(list) }
          });
        }
      } catch (e) {}
    } else if (colName === "homepage_sections" || colName === "homepageSectionBanners") {
      try {
        if ((prisma as any).homepageSectionBanner) {
          await (prisma as any).homepageSectionBanner.deleteMany({ where: { id } });
        }
      } catch (e) {}
    } else if (colName === "settings") {
      await prisma.setting.deleteMany({ where: { id } });
    } else if (colName === "notifications") {
      try {
        const notifSetting = await prisma.setting.findUnique({ where: { key: "NOTIFICATIONS_STORED_DATA" } });
        if (notifSetting && notifSetting.value) {
          const list = JSON.parse(notifSetting.value).filter((n: any) => n.id !== id);
          await prisma.setting.upsert({
            where: { key: "NOTIFICATIONS_STORED_DATA" },
            update: { value: JSON.stringify(list) },
            create: { key: "NOTIFICATIONS_STORED_DATA", value: JSON.stringify(list) }
          });
        }
      } catch (e) {}
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
    } else if (colName === "coupons") {
      try {
        await prisma.coupon.deleteMany({ where: { OR: [{ id }, { code: id }, { code: id.toUpperCase() }] } });
      } catch (e) {}
      const couponSetting = await prisma.setting.findUnique({ where: { key: "COUPONS_STORED_DATA" } });
      if (couponSetting && couponSetting.value) {
        const existingCoupons = JSON.parse(couponSetting.value).filter((c: any) => c.id !== id && c.code?.toUpperCase() !== id.toUpperCase());
        await prisma.setting.upsert({
          where: { key: "COUPONS_STORED_DATA" },
          update: { value: JSON.stringify(existingCoupons) },
          create: { key: "COUPONS_STORED_DATA", value: JSON.stringify(existingCoupons) }
        });
      }
    } else if (colName === "blogs") {
      const blogSetting = await prisma.setting.findUnique({ where: { key: "BLOGS_STORED_DATA" } });
      if (blogSetting && blogSetting.value) {
        const existingBlogs = JSON.parse(blogSetting.value).filter((b: any) => b.id !== id);
        await prisma.setting.upsert({
          where: { key: "BLOGS_STORED_DATA" },
          update: { value: JSON.stringify(existingBlogs) },
          create: { key: "BLOGS_STORED_DATA", value: JSON.stringify(existingBlogs) }
        });
      }
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

// ─── INITIALIZATION (PURE SQL / LOCAL SQLITE PRISMA) ────────────────────────
const dbInstance: any = new MockFirestore();
db = dbInstance;

// Clean mock admin to prevent breaking legacy references
const admin: any = {
  apps: [],
  firestore: () => db,
  messaging: () => ({
    sendEachForMulticast: async () => ({ responses: [] }),
    send: async () => ({})
  }),
  credential: {
    cert: () => ({})
  },
  initializeApp: () => ({})
};

console.log("✅ Database Engine: Local SQLite Prisma Database Active (Pure SQL / Google Firebase removed).");

export { db, admin };
export default db;

import { Router, Request, Response } from "express";
import db from "../firebase";

const router = Router();

const DEFAULT_HEADER_MENUS = [
  { id: "m-1", title: "MAKEUP", url: "/shop?category=makeup", location: "Header", parentId: null, sortOrder: 1 },
  { id: "m-2", title: "SKIN", url: "/shop?category=skincare", location: "Header", parentId: null, sortOrder: 2 },
  { id: "m-3", title: "HAIR", url: "/shop?category=haircare", location: "Header", parentId: null, sortOrder: 3 },
  { id: "m-4", title: "PERSONAL CARE", url: "/shop?category=personal-care", location: "Header", parentId: null, sortOrder: 4 },
  { id: "m-5", title: "MOM & BABY", url: "/shop?category=mom-baby", location: "Header", parentId: null, sortOrder: 5 },
  { id: "m-6", title: "FRAGRANCE", url: "/shop?category=fragrance", location: "Header", parentId: null, sortOrder: 6 },
  { id: "m-7", title: "UNDERGARMENTS", url: "/shop?category=undergarments", location: "Header", parentId: null, sortOrder: 7 },
  { id: "m-8", title: "COMBO", url: "/shop?category=combo", location: "Header", parentId: null, sortOrder: 8 },
  { id: "m-9", title: "BOGO", url: "/shop?campaign=bogo", location: "Header", parentId: null, sortOrder: 9 },
  { id: "m-10", title: "CLEARANCE SALE", url: "/shop?campaign=clearance", location: "Header", parentId: null, sortOrder: 10 },
  { id: "m-11", title: "MEN", url: "/shop?category=men", location: "Header", parentId: null, sortOrder: 11 },
];


const DEFAULT_FOOTER_MENUS = [
  // Section: GLOWGOODLY
  { id: "fm-1", title: "OUR STORY", url: "/about", location: "Footer", section: "GLOWGOODLY", sortOrder: 1 },
  { id: "fm-2", title: "GLOWGOODLY MAGAZINE", url: "/magazine", location: "Footer", section: "GLOWGOODLY", sortOrder: 2 },
  { id: "fm-3", title: "JOIN OUR TEAM", url: "/careers", location: "Footer", section: "GLOWGOODLY", sortOrder: 3 },
  { id: "fm-4", title: "AUTHENTICITY", url: "/authenticity", location: "Footer", section: "GLOWGOODLY", sortOrder: 4 },
  { id: "fm-5", title: "SHARE YOUR LOVE", url: "/reviews", location: "Footer", section: "GLOWGOODLY", sortOrder: 5 },

  // Section: Top Categories
  { id: "fm-6", title: "MAKEUP", url: "/shop?category=makeup", location: "Footer", section: "Top Categories", sortOrder: 6 },
  { id: "fm-7", title: "SKIN", url: "/shop?category=skincare", location: "Footer", section: "Top Categories", sortOrder: 7 },
  { id: "fm-8", title: "EYE CARE", url: "/shop?category=eyecare", location: "Footer", section: "Top Categories", sortOrder: 8 },
  { id: "fm-9", title: "HAIR", url: "/shop?category=haircare", location: "Footer", section: "Top Categories", sortOrder: 9 },
  { id: "fm-10", title: "PERSONAL CARE", url: "/shop?category=personal-care", location: "Footer", section: "Top Categories", sortOrder: 10 },
  { id: "fm-11", title: "NATURAL", url: "/shop?category=natural", location: "Footer", section: "Top Categories", sortOrder: 11 },
  { id: "fm-12", title: "MOM & BABY", url: "/shop?category=mom-baby", location: "Footer", section: "Top Categories", sortOrder: 12 },

  // Section: Quick Links
  { id: "fm-13", title: "OFFERS", url: "/shop?tab=offers", location: "Footer", section: "Quick Links", sortOrder: 13 },
  { id: "fm-14", title: "MENS PRODUCTS", url: "/shop?category=men", location: "Footer", section: "Quick Links", sortOrder: 14 },
  { id: "fm-15", title: "SKIN CONCERNS", url: "/shop?concern=all", location: "Footer", section: "Quick Links", sortOrder: 15 },
  { id: "fm-16", title: "NEW ARRIVAL", url: "/shop?sort=newest", location: "Footer", section: "Quick Links", sortOrder: 16 },
  { id: "fm-17", title: "MAKEUP", url: "/shop?category=makeup", location: "Footer", section: "Quick Links", sortOrder: 17 },

  // Section: All About Beauty
  { id: "fm-18", title: "KNOW YOUR ROUTINE", url: "/routine", location: "Footer", section: "All About Beauty", sortOrder: 18 },
  { id: "fm-19", title: "HAIR CARE 101", url: "/routine?type=hair", location: "Footer", section: "All About Beauty", sortOrder: 19 },
  { id: "fm-20", title: "SKIN CARE 101", url: "/routine?type=skin", location: "Footer", section: "All About Beauty", sortOrder: 20 },
  { id: "fm-21", title: "MAKEUP 101", url: "/routine?type=makeup", location: "Footer", section: "All About Beauty", sortOrder: 21 },

  // Section: Help
  { id: "fm-22", title: "CONTACT US", url: "/contact", location: "Footer", section: "Help", sortOrder: 22 },
  { id: "fm-23", title: "POINTS", url: "/points", location: "Footer", section: "Help", sortOrder: 23 },
  { id: "fm-24", title: "FAQS", url: "/faq", location: "Footer", section: "Help", sortOrder: 24 },
  { id: "fm-25", title: "SHIPPING & DELIVERY", url: "/shipping-delivery", location: "Footer", section: "Help", sortOrder: 25 },
  { id: "fm-26", title: "TERMS & CONDITIONS", url: "/terms", location: "Footer", section: "Help", sortOrder: 26 },
  { id: "fm-27", title: "REFUND & RETURN POLICY", url: "/refund-policy", location: "Footer", section: "Help", sortOrder: 27 },
  { id: "fm-28", title: "PRIVACY POLICY", url: "/privacy-policy", location: "Footer", section: "Help", sortOrder: 28 },

  // Section: Payments Accepted
  { id: "fm-29", title: "bKash", url: "#", location: "Footer", section: "Payments Accepted", sortOrder: 29 },
  { id: "fm-30", title: "VISA", url: "#", location: "Footer", section: "Payments Accepted", sortOrder: 30 },
  { id: "fm-31", title: "Nagad", url: "#", location: "Footer", section: "Payments Accepted", sortOrder: 31 },
  { id: "fm-32", title: "Mastercard", url: "#", location: "Footer", section: "Payments Accepted", sortOrder: 32 },
];

// GET /api/menus — Public: Fetch dynamic menus for Header or Footer
router.get("/menus", async (req: Request, res: Response) => {
  try {
    const { location } = req.query;
    const snapshot = await db.collection("menu_items").get();
    const items: any[] = [];
    snapshot.forEach((doc: any) => {
      items.push({ id: doc.id, ...doc.data() });
    });

    if (items.length === 0) {
      // Seed default items
      const initialList = [...DEFAULT_HEADER_MENUS, ...DEFAULT_FOOTER_MENUS];
      for (const item of initialList) {
        await db.collection("menu_items").doc(item.id).set(item);
      }
      const filtered = location 
        ? initialList.filter(i => i.location.toLowerCase() === String(location).toLowerCase()) 
        : initialList;
      return res.json(filtered.sort((a, b) => a.sortOrder - b.sortOrder));
    }

    let filtered = items;
    if (location) {
      filtered = items.filter(i => i.location && i.location.toLowerCase() === String(location).toLowerCase());
    }

    // Build hierarchy (nest subItems under parent)
    const parentItems = filtered.filter(i => !i.parentId);
    const result = parentItems.map(p => {
      const children = filtered.filter(c => c.parentId === p.id).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      return { ...p, subItems: children };
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/menus — Admin: Get all menu items unflat
router.get("/admin/menus", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("menu_items").get();
    const items: any[] = [];
    snapshot.forEach((doc: any) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    res.json(items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/menus — Admin: Create new Menu item
router.post("/admin/menus", async (req: Request, res: Response) => {
  try {
    const { title, url, location, parentId, sortOrder } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: "Menu title and URL are required" });
    }

    const docRef = db.collection("menu_items").doc();
    const newItem = {
      id: docRef.id,
      title,
      url,
      location: location || "Header",
      parentId: parentId || null,
      sortOrder: Number(sortOrder || 0),
      createdAt: new Date().toISOString(),
    };

    await docRef.set(newItem);
    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/menus/:id — Admin: Update Menu item
router.put("/admin/menus/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, url, location, parentId, sortOrder } = req.body;

    const docRef = db.collection("menu_items").doc(id as string);
    const updateData = {
      title,
      url,
      location,
      parentId: parentId || null,
      sortOrder: Number(sortOrder || 0),
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updateData);
    res.json({ id, ...updateData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/menus/:id — Admin: Delete Menu item
router.delete("/admin/menus/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("menu_items").doc(id as string);
    await docRef.delete();
    res.json({ success: true, message: "Menu item deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

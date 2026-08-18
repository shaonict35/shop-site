import { Router, Request, Response } from "express";
import db from "../firebase";

const router = Router();

// Memory cache for products queries to maximize performance
export const productsCache = new Map<string, { data: any; expiry: number }>();

export const clearProductsCache = () => {
  productsCache.clear();
};
const CACHE_DURATION_MS = 5000; // 5 seconds fast refresh cache

// GET /api/categories
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("categories").get();
    const categoriesList: any[] = [];
    snapshot.forEach(doc => {
      categoriesList.push({ id: doc.id, ...doc.data() });
    });

    const parents = categoriesList.filter(c => !c.parentId);
    const subCategories = categoriesList.filter(c => c.parentId);

    const result = parents.map(parent => ({
      ...parent,
      subCategories: subCategories.filter(sub => sub.parentId === parent.id)
    }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories (Create/Update category or subcategory)
router.post("/categories", async (req: any, res: any) => {
  try {
    const { id, name, parentId, imageUrl } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const docId = id || db.collection("categories").doc().id;
    const docRef = db.collection("categories").doc(docId);
    const data = {
      id: docId,
      name,
      parentId: parentId || null,
      imageUrl: imageUrl || "",
      updatedAt: new Date().toISOString()
    };
    await docRef.set(data, { merge: true });
    res.json({ message: "Category saved successfully", category: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/categories/:id
router.delete("/categories/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await db.collection("categories").doc(id).delete();
    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/brands
router.get("/brands", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("brands").get();
    const brandsList: any[] = [];
    snapshot.forEach(doc => {
      brandsList.push({ id: doc.id, ...doc.data() });
    });
    res.json(brandsList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products
router.get("/products", async (req: Request, res: Response) => {
  try {
    const cacheKey = JSON.stringify(req.query);
    const cached = productsCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    const { category, categoryName, brand, campaign, search, minPrice, maxPrice, sort, ids } = req.query;

    const snapshot = await db.collection("products").where("status", "==", "Active").get();
    let productsList: any[] = [];
    snapshot.forEach(doc => {
      productsList.push({ id: doc.id, ...doc.data() });
    });

    // Support fast query by ID list (e.g. for Wishlist)
    if (ids) {
      const idList = (ids as string).split(",").map(i => i.trim());
      const filteredByIds = productsList.filter(p => idList.includes(p.id));
      productsCache.set(cacheKey, { data: filteredByIds, expiry: Date.now() + CACHE_DURATION_MS });
      return res.json(filteredByIds);
    }

    // 1. Filter by category (direct or parent)
    if (category) {
      const catId = category as string;
      productsList = productsList.filter(p => p.categoryId === catId || p.category?.parentId === catId);
    } else if (categoryName) {
      const catStr = (categoryName as string).toLowerCase();
      const searchTerms = [catStr];
      if (catStr === "skincare" || catStr === "skin") searchTerms.push("skincare", "skin");
      if (catStr === "haircare" || catStr === "hair") searchTerms.push("haircare", "hair");

      productsList = productsList.filter(p => {
        const cName = p.category?.name?.toLowerCase() || "";
        const pName = p.category?.parent?.name?.toLowerCase() || "";
        return searchTerms.some(term => cName.includes(term) || pName.includes(term));
      });
    }

    // 2. Filter by brand
    if (brand) {
      let brandIds: string[] = [];
      if (typeof brand === "string") {
        brandIds = brand.includes(",") ? brand.split(",") : [brand];
      } else if (Array.isArray(brand)) {
        brandIds = brand as string[];
      }
      productsList = productsList.filter(p => p.brandId && brandIds.includes(p.brandId));
    }

    // 3. Filter by campaign
    if (campaign) {
      productsList = productsList.filter(p => p.campaignName === campaign);
    }

    // 4. Filter by search
    if (search) {
      const q = (search as string).toLowerCase();
      productsList = productsList.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 5. Filter by price bounds (minPrice / maxPrice)
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice as string) : 0;
      const max = maxPrice ? parseFloat(maxPrice as string) : Infinity;
      productsList = productsList.filter(p => {
        return p.variants && p.variants.some((v: any) => v.price >= min && v.price <= max);
      });
    }

    // 6. Sort
    if (sort === "price_asc") {
      productsList.sort((a, b) => (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0));
    } else if (sort === "price_desc") {
      productsList.sort((a, b) => (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0));
    } else if (sort === "newest") {
      productsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      productsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Strip heavy description/ingredients/howToUse fields for super lightweight list response (35x smaller payload)
    const optimizedList = productsList.map(p => {
      const { description, ingredients, howToUse, metaDescription, metaKeywords, ...rest } = p;
      return rest;
    });

    productsCache.set(cacheKey, { data: optimizedList, expiry: Date.now() + CACHE_DURATION_MS });
    res.json(optimizedList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id
router.get("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("products").doc(id as string).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = { id: doc.id, ...doc.data() } as any;

    // Fetch approved reviews safely
    let reviews: any[] = [];
    try {
      const reviewsSnapshot = await db.collection("reviews")
        .where("productId", "==", id)
        .where("isApproved", "==", true)
        .get();
        
      reviewsSnapshot.forEach(rDoc => {
        reviews.push({ id: rDoc.id, ...rDoc.data() });
      });
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.warn("Could not fetch reviews for product", id, e);
    }
    productData.reviews = reviews;

    // Get related products safely
    let relatedProducts: any[] = [];
    try {
      const relatedSnapshot = await db.collection("products")
        .where("categoryId", "==", productData.categoryId)
        .where("status", "==", "Active")
        .limit(9)
        .get();

      relatedSnapshot.forEach(rDoc => {
        if (rDoc.id !== id && relatedProducts.length < 8) {
          relatedProducts.push({ id: rDoc.id, ...rDoc.data() });
        }
      });
    } catch (e) {
      console.warn("Could not fetch related products for category", productData.categoryId, e);
    }

    res.json({ product: productData, relatedProducts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products/:id/reviews
router.post("/products/:id/reviews", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customerName, rating, comment } = req.body;

    if (!customerName || !rating || !comment) {
      return res.status(400).json({ error: "Customer name, rating, and comment are required" });
    }

    const productDoc = await db.collection("products").doc(id as string).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const reviewRef = db.collection("reviews").doc();
    const review = {
      productId: id,
      customerName,
      rating: parseInt(rating),
      comment,
      isApproved: false, // Pending admin approval
      createdAt: new Date().toISOString(),
    };

    await reviewRef.set(review);

    res.status(201).json({
      message: "Review submitted successfully and is pending approval.",
      review: { id: reviewRef.id, ...review },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products (Admin only - Create product)
router.post("/products", async (req: Request, res: Response) => {
  try {
    const { name, description, brandId, categoryId, imageUrl, price, discountPrice, costPrice, stock, metaTitle, metaDescription, metaKeywords, campaignName, variants } = req.body;
    
    if (!name || !brandId || !categoryId) {
      return res.status(400).json({ error: "Name, brandId, and categoryId are required" });
    }

    let variantCreateList = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      variantCreateList = variants.map((v: any) => ({
        id: v.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: v.name || "Default",
        price: parseFloat(v.price),
        discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
        costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
        stock: parseInt(v.stock) || 0,
        shadeColor: v.shadeColor || null,
        sizeValue: v.sizeValue || null,
        imageUrl: v.imageUrl || null,
        sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }));
    } else {
      if (!price) {
        return res.status(400).json({ error: "Price is required when variants are not specified" });
      }
      variantCreateList = [{
        id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: "Default",
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: parseInt(stock) || 50,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }];
    }

    // Fetch category and brand denormalized info
    const categoryDoc = await db.collection("categories").doc(categoryId).get();
    const brandDoc = await db.collection("brands").doc(brandId).get();

    const categoryJson = categoryDoc.exists ? { id: categoryDoc.id, ...categoryDoc.data() } : null;
    const brandJson = brandDoc.exists ? { id: brandDoc.id, ...brandDoc.data() } : null;

    const docRef = db.collection("products").doc();
    const product = {
      name,
      description: description || "",
      brandId,
      brand: brandJson,
      categoryId,
      category: categoryJson,
      status: "Active",
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      campaignName: campaignName || null,
      images: (() => {
        const list: any[] = [];
        if (imageUrl) list.push({ id: `img-${Date.now()}`, url: imageUrl, isPrimary: true });
        variantCreateList.forEach((v: any) => {
          if (v.imageUrl && !list.some(img => img.url === v.imageUrl)) {
            list.push({ id: `img-var-${v.id}`, url: v.imageUrl, isPrimary: list.length === 0 });
          }
        });
        if (list.length === 0) {
          list.push({ id: `img-${Date.now()}`, url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80", isPrimary: true });
        }
        return list;
      })(),
      variants: variantCreateList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(product);
    productsCache.clear();
    res.status(201).json({ id: docRef.id, ...product });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT & PATCH /api/products/:id & /api/admin/products/:id (Admin only - Update product)
const updateProductHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, brandId, categoryId, imageUrl, price, discountPrice, costPrice, stock, metaTitle, metaDescription, metaKeywords, campaignName, variants } = req.body;

    const productDoc = await db.collection("products").doc(id as string).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const currentProduct = productDoc.data() as any;

    let brandJson = currentProduct.brand;
    if (brandId && brandId !== currentProduct.brandId) {
      const brandDoc = await db.collection("brands").doc(brandId).get();
      brandJson = brandDoc.exists ? { id: brandDoc.id, ...brandDoc.data() } : null;
    }

    let categoryJson = currentProduct.category;
    if (categoryId && categoryId !== currentProduct.categoryId) {
      const categoryDoc = await db.collection("categories").doc(categoryId).get();
      categoryJson = categoryDoc.exists ? { id: categoryDoc.id, ...categoryDoc.data() } : null;
    }

    let updatedVariants = currentProduct.variants || [];
    if (variants && Array.isArray(variants)) {
      updatedVariants = variants.map((v: any) => ({
        id: v.id || `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: v.name || "Default",
        price: v.price !== undefined ? parseFloat(v.price) : 0,
        discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
        costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
        stock: v.stock !== undefined ? parseInt(v.stock) : 50,
        shadeColor: v.shadeColor || null,
        sizeValue: v.sizeValue || null,
        imageUrl: v.imageUrl || null,
        sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }));
    } else if (price) {
      if (updatedVariants.length > 0) {
        updatedVariants[0].price = parseFloat(price);
        updatedVariants[0].discountPrice = discountPrice ? parseFloat(discountPrice) : null;
        updatedVariants[0].costPrice = costPrice ? parseFloat(costPrice) : null;
        updatedVariants[0].stock = stock !== undefined ? parseInt(stock) : updatedVariants[0].stock;
      }
    }

    // Rebuild images strictly from Main Cover URL + active remaining variants' images
    let updatedImages: any[] = [];
    const primaryUrl = imageUrl || currentProduct.imageUrl || currentProduct.images?.find((i: any) => i.isPrimary)?.url || currentProduct.images?.[0]?.url;
    if (primaryUrl) {
      updatedImages.push({ id: `img-primary-${id}`, url: primaryUrl, isPrimary: true });
    }
    updatedVariants.forEach((v: any, idx: number) => {
      if (v.imageUrl && v.imageUrl.trim() !== "" && !updatedImages.some(img => img.url === v.imageUrl)) {
        updatedImages.push({ id: `img-var-${v.id || idx}`, url: v.imageUrl, isPrimary: false });
      }
    });
    if (updatedImages.length === 0 && currentProduct.images?.length > 0) {
      updatedImages = currentProduct.images;
    }

    const updatedProduct = {
      ...currentProduct,
      name: name !== undefined ? name : currentProduct.name,
      description: description !== undefined ? description : currentProduct.description,
      brandId: brandId !== undefined ? brandId : currentProduct.brandId,
      brand: brandJson,
      categoryId: categoryId !== undefined ? categoryId : currentProduct.categoryId,
      category: categoryJson,
      metaTitle: metaTitle !== undefined ? metaTitle : currentProduct.metaTitle,
      metaDescription: metaDescription !== undefined ? metaDescription : currentProduct.metaDescription,
      metaKeywords: metaKeywords !== undefined ? metaKeywords : currentProduct.metaKeywords,
      campaignName: campaignName !== undefined ? campaignName : currentProduct.campaignName,
      images: updatedImages,
      variants: updatedVariants,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("products").doc(id as string).set(updatedProduct);
    productsCache.clear();
    res.json({ id, ...updatedProduct });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

router.put("/products/:id", updateProductHandler);
router.patch("/products/:id", updateProductHandler);
router.put("/admin/products/:id", updateProductHandler);
router.patch("/admin/products/:id", updateProductHandler);

// DELETE /api/products/:id (Admin only - Delete product)
router.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("products").doc(id as string);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    await docRef.update({ status: "Inactive" });
    productsCache.clear();
    res.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

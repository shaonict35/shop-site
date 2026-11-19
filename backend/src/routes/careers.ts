import { Router, Request, Response } from "express";
import db from "../firebase";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

const DEFAULT_PERKS = [
  { icon: "💰", title: "Competitive Salary", desc: "Above industry-standard pay, festive bonuses & performance incentives." },
  { icon: "💄", title: "Beauty Hampers", desc: "Generous monthly allowance of authentic skincare and cosmetic products." },
  { icon: "📈", title: "Rapid Growth", desc: "Fast-track promotions, mentorship, and cross-functional leadership roles." },
  { icon: "☕", title: "Vibrant Work Culture", desc: "Warm, supportive atmosphere, flexible environment, and modern facilities." },
];

const DEFAULT_JOBS = [
  {
    id: "job-1",
    role: "Senior Beauty Advisor & Consultant",
    type: "Full Time",
    location: "Dhaka Flagship Outlet",
    department: "RETAIL SALES",
    experience: "1-2 Years in Cosmetic Sales",
    salary: "BDT 25,000 - 35,000 + Sales Bonus",
    requirements: "Deep understanding of Korean skincare routines, skin types, and active ingredients. Outstanding customer communication and friendly demeanor.",
    responsibilities: "Consult walk-in customers, recommend suitable skincare regimens, manage floor displays, and hit monthly store sales targets.",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "job-2",
    role: "Creative Content Creator & Copywriter",
    type: "Full Time / Hybrid",
    location: "Dhanmondi HQ / Remote",
    department: "MARKETING",
    experience: "1+ Years in Digital Agency or eCommerce",
    salary: "BDT 30,000 - 45,000",
    requirements: "Proven portfolio of engaging beauty Reels, TikToks, and high-converting ad copy. Fluent in Bangla & English copywriting.",
    responsibilities: "Plan editorial content calendars, shoot product demo videos, write catchy captions, and collaborate with top beauty influencers.",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "job-3",
    role: "eCommerce Operations & Logistics Specialist",
    type: "Full Time",
    location: "Central Warehouse, Dhaka",
    department: "OPERATIONS",
    experience: "1+ Years in eCommerce Fulfillment",
    salary: "BDT 22,000 - 30,000",
    requirements: "Hands-on experience with parcel dispatch (Steadfast, Pathao Courier), barcode scanning, and inventory verification.",
    responsibilities: "Ensure zero damage packaging, manage stock inwards/outwards, maintain dispatch timelines, and handle return reconciliations.",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "job-4",
    role: "Full-Stack Web Developer (Next.js & Node.js)",
    type: "Full Time / Remote",
    location: "Remote / Hybrid",
    department: "TECH",
    experience: "2+ Years in React / Next.js / Node.js",
    salary: "BDT 50,000 - 80,000",
    requirements: "Strong proficiency in TypeScript, Next.js App Router, Prisma ORM, MySQL, and REST/GraphQL APIs.",
    responsibilities: "Build high-performance web features, optimize page speed & SEO, integrate payment gateways, and maintain backend stability.",
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Helper to get careers document
async function getCareersDoc() {
  const docRef = db.collection("settings").doc("CAREERS_DATA");
  const snap = await docRef.get();
  if (snap.exists && snap.data()?.jobs) {
    return snap.data();
  }
  // Initialize with defaults
  const initial = {
    jobs: DEFAULT_JOBS,
    perks: DEFAULT_PERKS,
    heroTitle: "Build the Future of Authentic Beauty in Bangladesh",
    heroSubtitle: "Join our vibrant team of passionate beauty experts, technologists, and creators.",
    updatedAt: new Date().toISOString()
  };
  await docRef.set(initial);
  return initial;
}

// ─── 1. PUBLIC: GET CAREERS DATA ───────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const data = await getCareersDoc();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message, jobs: DEFAULT_JOBS, perks: DEFAULT_PERKS });
  }
});

// ─── 2. ADMIN: ADD NEW JOB OPENING ─────────────────────────────────────────────
router.post("/jobs", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, type, location, department, experience, salary, requirements, responsibilities } = req.body;
    if (!role || !department) {
      return res.status(400).json({ error: "Job role and department are required" });
    }

    const docRef = db.collection("settings").doc("CAREERS_DATA");
    const current = await getCareersDoc();
    const newJob = {
      id: `job-${Date.now()}`,
      role,
      type: type || "Full Time",
      location: location || "Dhaka, Bangladesh",
      department: (department || "GENERAL").toUpperCase(),
      experience: experience || "Entry Level",
      salary: salary || "Negotiable",
      requirements: requirements || "",
      responsibilities: responsibilities || "",
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const updatedJobs = [newJob, ...(current.jobs || [])];
    await docRef.set({ ...current, jobs: updatedJobs, updatedAt: new Date().toISOString() }, { merge: true });
    res.status(201).json({ message: "Job opening added successfully", job: newJob });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 3. ADMIN: UPDATE JOB OPENING ─────────────────────────────────────────────
router.put("/jobs/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("settings").doc("CAREERS_DATA");
    const current = await getCareersDoc();
    const jobList = current.jobs || [];
    const index = jobList.findIndex((j: any) => j.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    jobList[index] = {
      ...jobList[index],
      ...req.body,
      id,
      updatedAt: new Date().toISOString()
    };

    await docRef.set({ ...current, jobs: jobList, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ message: "Job opening updated successfully", job: jobList[index] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 4. ADMIN: DELETE JOB OPENING ─────────────────────────────────────────────
router.delete("/jobs/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("settings").doc("CAREERS_DATA");
    const current = await getCareersDoc();
    const updatedJobs = (current.jobs || []).filter((j: any) => j.id !== id);

    await docRef.set({ ...current, jobs: updatedJobs, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ message: "Job opening deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 5. PUBLIC: APPLY FOR A JOB ────────────────────────────────────────────────
router.post("/apply", async (req: Request, res: Response) => {
  try {
    const { jobId, jobTitle, jobRole, position, name, email, phone, cvLink, resumeUrl, note, coverNote } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone number are required" });
    }

    const docRef = db.collection("settings").doc("JOB_APPLICATIONS");
    const snap = await docRef.get();
    const existing = snap.exists ? (snap.data()?.applications || []) : [];

    const pos = jobTitle || jobRole || position || "General Application";
    const resume = (cvLink || resumeUrl || "").trim();
    const cvr = (note || coverNote || "").trim();

    const newApp = {
      id: `app-${Date.now()}`,
      jobId: jobId || "general",
      jobTitle: pos,
      position: pos,
      name: name.trim(),
      email: (email || "").trim(),
      phone: phone.trim(),
      cvLink: resume,
      resumeUrl: resume,
      note: cvr,
      coverNote: cvr,
      status: "New",
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const updated = [newApp, ...existing];
    await docRef.set({ applications: updated, updatedAt: new Date().toISOString() }, { merge: true });
    res.status(201).json({ message: "Application submitted successfully! Our HR team will contact you.", application: newApp });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 6. ADMIN: GET ALL JOB APPLICATIONS ─────────────────────────────────────────
router.get("/applications", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docRef = db.collection("settings").doc("JOB_APPLICATIONS");
    const snap = await docRef.get();
    const applications = snap.exists ? (snap.data()?.applications || []) : [];
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 7. ADMIN: DELETE A JOB APPLICATION ────────────────────────────────────────
router.delete("/applications/:id", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("settings").doc("JOB_APPLICATIONS");
    const snap = await docRef.get();
    const applications = snap.exists ? (snap.data()?.applications || []) : [];
    const updated = applications.filter((a: any) => a.id !== id);
    await docRef.set({ applications: updated, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ message: "Application removed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 8. ADMIN: UPDATE CAREER PAGE HEADER & PERKS ──────────────────────────────
router.put("/header", authenticateJWT as any, requireRole(["SuperAdmin", "Manager", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { heroTitle, heroSubtitle, perks } = req.body;
    const docRef = db.collection("settings").doc("CAREERS_DATA");
    const current = await getCareersDoc();
    const updated = {
      ...current,
      ...(heroTitle ? { heroTitle } : {}),
      ...(heroSubtitle ? { heroSubtitle } : {}),
      ...(Array.isArray(perks) ? { perks } : {}),
      updatedAt: new Date().toISOString()
    };
    await docRef.set(updated, { merge: true });
    res.json({ message: "Careers page content updated successfully", data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

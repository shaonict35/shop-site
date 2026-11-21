import { Router, Request, Response } from "express";
import prisma from "../prisma";
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
    title: "Senior Beauty Advisor & Consultant",
    jobType: "Full Time",
    location: "Dhaka Flagship Outlet",
    department: "RETAIL SALES",
    salaryRange: "BDT 25,000 - 35,000 + Sales Bonus",
    requirements: "Deep understanding of Korean skincare routines, skin types, and active ingredients. Outstanding customer communication and friendly demeanor.",
    description: "Consult walk-in customers, recommend suitable skincare regimens, manage floor displays, and hit monthly store sales targets.",
    isActive: true,
  },
  {
    id: "job-2",
    title: "Creative Content Creator & Copywriter",
    jobType: "Full Time / Hybrid",
    location: "Dhanmondi HQ / Remote",
    department: "MARKETING",
    salaryRange: "BDT 30,000 - 45,000",
    requirements: "Proven portfolio of engaging beauty Reels, TikToks, and high-converting ad copy. Fluent in Bangla & English copywriting.",
    description: "Plan editorial content calendars, shoot product demo videos, write catchy captions, and collaborate with top beauty influencers.",
    isActive: true,
  },
  {
    id: "job-3",
    title: "eCommerce Operations & Logistics Specialist",
    jobType: "Full Time",
    location: "Central Warehouse, Dhaka",
    department: "OPERATIONS",
    salaryRange: "BDT 22,000 - 30,000",
    requirements: "Hands-on experience with parcel dispatch (Steadfast, Pathao Courier), barcode scanning, and inventory verification.",
    description: "Ensure zero damage packaging, manage stock inwards/outwards, maintain dispatch timelines, and handle return reconciliations.",
    isActive: true,
  },
  {
    id: "job-4",
    title: "Full-Stack Web Developer (Next.js & Node.js)",
    jobType: "Full Time / Remote",
    location: "Remote / Hybrid",
    department: "TECH",
    salaryRange: "BDT 50,000 - 80,000",
    requirements: "Strong proficiency in TypeScript, Next.js App Router, Prisma ORM, MySQL, and REST/GraphQL APIs.",
    description: "Build high-performance web features, optimize page speed & SEO, integrate payment gateways, and maintain backend stability.",
    isActive: true,
  }
];

function notifyCareersSync(req: Request, action: string, extra?: any) {
  try {
    const io = (req.app as any)?.get("io");
    if (io) {
      io.emit("careers:updated", { action, timestamp: Date.now(), ...extra });
      io.emit("content_updated", { type: "careers", action, ...extra });
      io.emit("data_sync", { type: "careers", action, ...extra });
    }
  } catch (_) {}
}

// Ensure default jobs exist in Prisma
async function ensurePrismaJobs() {
  try {
    const count = await prisma.career.count();
    if (count === 0) {
      for (const dj of DEFAULT_JOBS) {
        await prisma.career.create({
          data: {
            id: dj.id,
            title: dj.title,
            department: dj.department,
            location: dj.location,
            jobType: dj.jobType,
            salaryRange: dj.salaryRange,
            description: dj.description,
            requirements: dj.requirements,
            isActive: dj.isActive,
          }
        });
      }
    }
  } catch (err) {
    console.warn("Failed to seed initial Prisma careers:", err);
  }
}

// Format Prisma job for frontend compatibility (provides both role & title, type & jobType, etc.)
function formatJob(job: any) {
  return {
    ...job,
    role: job.title,
    type: job.jobType,
    salary: job.salaryRange,
    responsibilities: job.description,
  };
}

// ─── 1. PUBLIC: GET ALL ACTIVE CAREERS ─────────────────────────────────────────
router.get(["/", "/active"], async (req: Request, res: Response) => {
  try {
    await ensurePrismaJobs();
    const jobs = await prisma.career.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      jobs: jobs.map(formatJob),
      perks: DEFAULT_PERKS,
      heroTitle: "Build the Future of Clean Beauty eCommerce 💄",
      heroSubtitle: "Join our vibrant team of passionate beauty enthusiasts, engineers, and creators. We are redefining how millions in Bangladesh discover authentic cosmetics.",
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      jobs: DEFAULT_JOBS.map(formatJob),
      perks: DEFAULT_PERKS
    });
  }
});

// ─── 2. ADMIN: GET ALL CAREERS (Active + Inactive) ────────────────────────────
router.get(["/admin", "/admin/jobs", "/all"], authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensurePrismaJobs();
    const jobs = await prisma.career.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(jobs.map(formatJob));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 3. ADMIN: CREATE NEW JOB OPENING ─────────────────────────────────────────
const handleCreateJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      role,
      department,
      location,
      jobType,
      type,
      salaryRange,
      salary,
      description,
      responsibilities,
      requirements,
      deadline,
      isActive
    } = req.body;

    const jobTitle = (title || role || "").trim();
    if (!jobTitle) {
      return res.status(400).json({ error: "Job title / role is required" });
    }

    const jobDept = (department || "GENERAL").toUpperCase().trim();
    const jobLoc = (location || "Dhaka, Bangladesh").trim();
    const jobTyp = (jobType || type || "Full-time").trim();
    const jobSal = (salaryRange || salary || "Negotiable").trim();
    const jobDesc = (description || responsibilities || "").trim();
    const jobReq = (requirements || "").trim();
    const active = isActive !== undefined ? Boolean(isActive) : true;
    const parsedDeadline = deadline ? new Date(deadline) : null;

    const created = await prisma.career.create({
      data: {
        title: jobTitle,
        department: jobDept,
        location: jobLoc,
        jobType: jobTyp,
        salaryRange: jobSal,
        description: jobDesc,
        requirements: jobReq,
        deadline: parsedDeadline,
        isActive: active
      }
    });

    notifyCareersSync(req, "create", { id: created.id });

    res.status(201).json({
      success: true,
      message: "Job opening created successfully!",
      job: formatJob(created)
    });
  } catch (error: any) {
    console.error("Create career error:", error);
    res.status(500).json({ error: error.message || "Failed to create career opening" });
  }
};

router.post("/", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, handleCreateJob);
router.post("/jobs", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, handleCreateJob);

// ─── 4. ADMIN: BULK DELETE JOB OPENINGS ───────────────────────────────────────
const handleBulkDeleteJobs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required for bulk delete" });
    }

    const result = await prisma.career.deleteMany({
      where: { id: { in: ids } }
    });

    notifyCareersSync(req, "bulk_delete", { count: result.count, ids });

    res.json({
      success: true,
      message: `Successfully deleted ${result.count} job opening(s)`,
      count: result.count
    });
  } catch (error: any) {
    console.error("Bulk delete careers error:", error);
    res.status(500).json({ error: error.message || "Failed to bulk delete job openings" });
  }
};

router.post("/bulk-delete", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin"]) as any, handleBulkDeleteJobs);
router.post("/jobs/bulk-delete", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin"]) as any, handleBulkDeleteJobs);

// ─── 5. ADMIN: UPDATE JOB OPENING ─────────────────────────────────────────────
const handleUpdateJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      role,
      department,
      location,
      jobType,
      type,
      salaryRange,
      salary,
      description,
      responsibilities,
      requirements,
      deadline,
      isActive
    } = req.body;

    const existing = await prisma.career.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    const updateData: any = {};
    if (title !== undefined || role !== undefined) updateData.title = (title || role || "").trim();
    if (department !== undefined) updateData.department = (department || "").toUpperCase().trim();
    if (location !== undefined) updateData.location = (location || "").trim();
    if (jobType !== undefined || type !== undefined) updateData.jobType = (jobType || type || "").trim();
    if (salaryRange !== undefined || salary !== undefined) updateData.salaryRange = (salaryRange || salary || "").trim();
    if (description !== undefined || responsibilities !== undefined) updateData.description = (description || responsibilities || "").trim();
    if (requirements !== undefined) updateData.requirements = (requirements || "").trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    const updated = await prisma.career.update({
      where: { id: id as string },
      data: updateData
    });

    notifyCareersSync(req, "update", { id: updated.id });

    res.json({
      success: true,
      message: "Job opening updated successfully!",
      job: formatJob(updated)
    });
  } catch (error: any) {
    console.error("Update career error:", error);
    res.status(500).json({ error: error.message || "Failed to update job opening" });
  }
};

router.put("/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, handleUpdateJob);
router.patch("/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, handleUpdateJob);
router.put("/jobs/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, handleUpdateJob);
router.patch("/jobs/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, handleUpdateJob);

// ─── 6. ADMIN: DELETE SINGLE JOB OPENING ──────────────────────────────────────
const handleDeleteJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.career.delete({ where: { id: id as string } });

    notifyCareersSync(req, "delete", { id });

    res.json({
      success: true,
      message: "Job opening deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete career error:", error);
    res.status(500).json({ error: error.message || "Failed to delete job opening" });
  }
};

router.delete("/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin"]) as any, handleDeleteJob);
router.delete("/jobs/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin"]) as any, handleDeleteJob);

// ─── 7. PUBLIC: APPLY FOR A JOB ────────────────────────────────────────────────
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

    notifyCareersSync(req, "new_application", { id: newApp.id });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully! Our HR team will contact you.",
      application: newApp
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 8. ADMIN: GET ALL JOB APPLICATIONS ─────────────────────────────────────────
router.get("/applications", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin", "Manager"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docRef = db.collection("settings").doc("JOB_APPLICATIONS");
    const snap = await docRef.get();
    const applications = snap.exists ? (snap.data()?.applications || []) : [];
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 9. ADMIN: DELETE A JOB APPLICATION ────────────────────────────────────────
router.delete("/applications/:id", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("settings").doc("JOB_APPLICATIONS");
    const snap = await docRef.get();
    const applications = snap.exists ? (snap.data()?.applications || []) : [];
    const updated = applications.filter((a: any) => a.id !== id);
    await docRef.set({ applications: updated, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ success: true, message: "Application removed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 10. ADMIN: BULK DELETE JOB APPLICATIONS ───────────────────────────────────
router.post("/applications/bulk-delete", authenticateJWT as any, requireRole(["SUPER_ADMIN", "ADMIN", "SuperAdmin", "Admin"]) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }
    const docRef = db.collection("settings").doc("JOB_APPLICATIONS");
    const snap = await docRef.get();
    const applications = snap.exists ? (snap.data()?.applications || []) : [];
    const updated = applications.filter((a: any) => !ids.includes(a.id));
    await docRef.set({ applications: updated, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ success: true, message: `Removed ${ids.length} applications` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import prisma from "./prisma";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import db from "./firebase";

dotenv.config();

async function resetAdmin() {
  console.log("Resetting Admin credentials...");
  const adminEmail = "support@glowgoodly.com";
  const newPassword = "Admin@Glow2026";
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // 1. Update/Create in SQLite (Prisma)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: "SuperAdmin",
      status: "Active"
    },
    create: {
      name: "GlowGoodly SuperAdmin",
      email: adminEmail,
      passwordHash,
      role: "SuperAdmin",
      status: "Active"
    }
  });

  // Also update admin@glowgoodly.com just in case
  await prisma.user.upsert({
    where: { email: "admin@glowgoodly.com" },
    update: {
      passwordHash,
      role: "SuperAdmin",
      status: "Active"
    },
    create: {
      name: "GlowGoodly Admin",
      email: "admin@glowgoodly.com",
      passwordHash,
      role: "SuperAdmin",
      status: "Active"
    }
  });

  // 2. Update in Firestore / Mock DB
  try {
    const docRef = db.collection("users").doc("admin_super");
    await docRef.set({
      name: "GlowGoodly SuperAdmin",
      email: adminEmail,
      passwordHash,
      role: "SuperAdmin",
      status: "Active",
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.log("Firestore update skipped or synced locally.");
  }

  console.log("==========================================");
  console.log("✅ SUCCESS! Admin Credentials Reset Done!");
  console.log(`Email:    ${adminEmail} (or admin@glowgoodly.com)`);
  console.log(`Password: ${newPassword}`);
  console.log("==========================================");
}

resetAdmin().catch(console.error).finally(() => prisma.$disconnect());

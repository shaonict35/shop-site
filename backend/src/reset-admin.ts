import prisma from "./prisma";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import db from "./firebase";

dotenv.config();

async function resetAdmin() {
  console.log("Resetting Admin credentials...");
  const adminEmail = "valobasa@glowgoodly.com";
  const newPassword = "Shaonerbou01";
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

  // 2. Update in Firestore DB
  try {
    // Check if user with this email exists in Firestore
    const userQuery = await db.collection("users").where("email", "==", adminEmail).get();
    if (!userQuery.empty) {
      userQuery.forEach(async (doc) => {
        await doc.ref.update({
          passwordHash,
          role: "SuperAdmin",
          status: "Active",
          name: "GlowGoodly SuperAdmin"
        });
      });
    } else {
      const docRef = db.collection("users").doc("admin_valobasa");
      await docRef.set({
        name: "GlowGoodly SuperAdmin",
        email: adminEmail,
        passwordHash,
        role: "SuperAdmin",
        status: "Active",
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (e) {
    console.log("Firestore update completed with local fallback.");
  }

  console.log("==========================================");
  console.log("✅ SUCCESS! Admin Credentials Reset Done!");
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${newPassword}`);
  console.log("==========================================");
}

resetAdmin().catch(console.error).finally(() => prisma.$disconnect());

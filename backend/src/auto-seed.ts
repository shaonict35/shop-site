import prisma from "./prisma";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export async function autoSeedDatabase() {
  try {
    // 1. Ensure Default SuperAdmin User exists in SQL database
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@glowgoodly.com").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          name: "GlowGoodly SuperAdmin",
          email: adminEmail,
          passwordHash,
          role: "SuperAdmin",
          status: "Active",
        },
      });
      console.log(`🌱 SQL Database Loader: SuperAdmin account created successfully: [${adminEmail}]`);
    } else {
      const isMatch = await bcrypt.compare(adminPassword, existingAdmin.passwordHash);
      if (!isMatch) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.user.update({
          where: { email: adminEmail },
          data: { passwordHash, role: "SuperAdmin", status: "Active" }
        });
        console.log(`🌱 SQL Database Loader: SuperAdmin password synced with .env: [${adminEmail}]`);
      } else {
        console.log(`✅ SQL Database Loader: SuperAdmin account verified: [${adminEmail}]`);
      }
    }

    // 2. Initialize essential store delivery settings if not present (required for checkout)
    const essentialSettings: Record<string, string> = {
      SHIPPING_INSIDE_DHAKA: "70",
      SHIPPING_SUB_AREA: "100",
      SHIPPING_OUTSIDE_DHAKA: "130",
      SUPPORT_PHONE: "+8801609013011",
      SUPPORT_EMAIL: "support@glowgoodly.com",
      OFFICE_ADDRESS: "House #12, Road #4, Dhanmondi, Dhaka - 1205, Bangladesh"
    };

    for (const [key, value] of Object.entries(essentialSettings)) {
      const exists = await prisma.setting.findUnique({ where: { key } });
      if (!exists) {
        await prisma.setting.create({
          data: { key, value }
        });
      }
    }

    console.log("✅ SQL Database Loader: Ready for real data entry from Admin Panel.");
  } catch (error) {
    console.error("⚠️ SQL Database Loader encountered an error:", error);
  }
}

if (require.main === module) {
  autoSeedDatabase().then(() => {
    console.log("SQL Database Loader script completed successfully.");
    process.exit(0);
  }).catch((err) => {
    console.error("SQL Database Loader error:", err);
    process.exit(1);
  });
}

import db from "./firebase";

async function updateSmtpSettings() {
  console.log("Setting default hosting SMTP settings...");
  await db.collection("settings").doc("SMTP_HOST").set({ key: "SMTP_HOST", value: "mail.glowgoodly.com", updatedAt: new Date().toISOString() });
  await db.collection("settings").doc("SMTP_PORT").set({ key: "SMTP_PORT", value: "465", updatedAt: new Date().toISOString() });
  await db.collection("settings").doc("SMTP_USER").set({ key: "SMTP_USER", value: "support@glowgoodly.com", updatedAt: new Date().toISOString() });
  await db.collection("settings").doc("SMTP_FROM_EMAIL").set({ key: "SMTP_FROM_EMAIL", value: 'GlowGoodly Official <support@glowgoodly.com>', updatedAt: new Date().toISOString() });
  console.log("Hosting SMTP settings set successfully!");
}

updateSmtpSettings().catch(console.error).finally(() => process.exit(0));

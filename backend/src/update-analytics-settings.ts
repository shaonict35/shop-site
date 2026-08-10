import db from "./firebase";

async function updateAnalyticsSettings() {
  console.log("Updating GTM & GA4 IDs in settings database...");
  await db.collection("settings").doc("GTM_CONTAINER_ID").set({ key: "GTM_CONTAINER_ID", value: "GTM-W78SB3GC", updatedAt: new Date().toISOString() });
  await db.collection("settings").doc("GA4_MEASUREMENT_ID").set({ key: "GA4_MEASUREMENT_ID", value: "G-533220314", updatedAt: new Date().toISOString() });
  console.log("GTM & GA4 IDs updated successfully in database!");
}

updateAnalyticsSettings().catch(console.error).finally(() => process.exit(0));

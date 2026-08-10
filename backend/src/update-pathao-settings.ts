import db from "./firebase";

async function updatePathaoSettings() {
  console.log("Updating Pathao credentials in settings database...");
  await db.collection("settings").doc("PATHAO_CLIENT_ID").set({ key: "PATHAO_CLIENT_ID", value: "4zbqVlrdpr", updatedAt: new Date().toISOString() });
  await db.collection("settings").doc("PATHAO_CLIENT_SECRET").set({ key: "PATHAO_CLIENT_SECRET", value: "wKrjXWP5g5M1gPl8EffHHv29XuXcsNorJXbC12rA", updatedAt: new Date().toISOString() });
  console.log("Pathao credentials updated successfully in database!");
}

updatePathaoSettings().catch(console.error).finally(() => process.exit(0));

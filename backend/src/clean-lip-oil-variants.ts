import db from "./firebase";

async function cleanLipOilVariants() {
  console.log("Cleaning up duplicate/dummy variants from Lip Oil products...");
  const snapshot = await db.collection("products").get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.name && (data.name.toLowerCase().includes("lip oil") || data.name.toLowerCase().includes("beauty glazed"))) {
      const originalVariants: any[] = data.variants || [];
      // Keep only unique real variants (e.g. 107 HUGGING, 108) and remove generic duplicate fallback names like "Shade 2", "Shade 3" if duplicates
      const seenNames = new Set<string>();
      const cleaned = originalVariants.filter(v => {
        const name = (v.name || "").trim();
        if (seenNames.has(name.toLowerCase())) return false;
        seenNames.add(name.toLowerCase());
        return true;
      });

      if (cleaned.length !== originalVariants.length) {
        console.log(`Cleaning product ${doc.id} (${data.name}): reduced from ${originalVariants.length} to ${cleaned.length} variants.`);
        await db.collection("products").doc(doc.id).update({ variants: cleaned });
      }
    }
  }
  console.log("Cleanup complete!");
}

cleanLipOilVariants().catch(console.error).finally(() => process.exit(0));

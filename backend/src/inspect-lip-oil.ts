import db from "./firebase";

async function checkAllProducts() {
  const snapshot = await db.collection("products").get();
  const products: any[] = [];
  snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

  const matched = products.filter(p => p.name.toLowerCase().includes("glow lip oil") || p.name.toLowerCase().includes("beauty glazed") || p.name.toLowerCase().includes("107"));
  console.log(`Found ${matched.length} matching products:`);
  matched.forEach(p => {
    console.log("-----------------------------------------");
    console.log("ID:", p.id);
    console.log("Name:", p.name);
    console.log("Images:", p.images);
    console.log("Variants:", p.variants);
  });
}

checkAllProducts().catch(console.error).finally(() => process.exit(0));

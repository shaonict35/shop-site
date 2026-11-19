import db from "./firebase";

async function checkSku() {
  const snapshot = await db.collection("products").get();
  const products: any[] = [];
  snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

  const matched = products.filter(p => 
    (p.variants && p.variants.some((v: any) => (v.name && (v.name.includes("HUGGING") || v.name.includes("108") || v.name.includes("107"))) || v.sku === "37070")) ||
    (p.name && p.name.includes("Beauty Glazed"))
  );
  console.log(`Found ${matched.length} matched products:`);
  matched.forEach(p => {
    console.log("ID:", p.id);
    console.log("Name:", p.name);
    console.log("Images:", p.images);
    console.log("Variants:", p.variants);
  });
}

checkSku().catch(console.error).finally(() => process.exit(0));
